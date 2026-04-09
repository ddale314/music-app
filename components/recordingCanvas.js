import { useRef, useState, useEffect, useCallback } from 'react';
import useRecorder from '../hooks/useRecorder';
import RecordButton from '../components/recordButton';
import { AudioSegment, AudioSegmentComponent } from '../components/audioSegment';
import styles from '../styles/editor.module.css';
import Ruler from '../components/ruler';
import { Track, TrackComponent } from '../components/track';
import useDraggable from '../hooks/useDraggable';
import ResizableComponent from "./resizable";
import ClipDisplay from "./clipDisplay";
import { SegmentEditor } from "./segmentEditor";
import WaveformVisualizer from './waveform';
import * as Tone from 'tone';
import { INSTRUMENT_SAMPLES, getBaseUrl } from '../utils/instruments';

const fftSize = 8192;
const bufferLength = fftSize / 2;
let nextAudioSegmentID = 0;
const SERVER_PATH = "http://localhost:3000/api";

// Convert between volume slider value (linear scale) and decibels (logarithmic scale)
export function sliderToDb(val) {
    if (val <= 0) return -100;
    // Use a power curve for more natural volume taper
    let maxAmp = Math.pow(10, 5 / 20); // Amp for 5dB
    let amp = Math.pow(val / 100, 2) * maxAmp;
    return 20 * Math.log10(amp);
}

export default function RecordingCanvas({ width = 800, height = 400 }) {
    const [tickGap, setTickGap] = useState(5);
    const [timeSignature, setTimeSignature] = useState([4, 4]);
    const [bpm, setBPM] = useState(100);
    const [quantize, setQuantize] = useState(8);

    const [selectedTrack, setSelectedTrack] = useState(1);
    const [tracks, setTracks] = useState([new Track(1)]);
    const [newTrackType, setNewTrackType] = useState('audio');

    const [selectedSegment, setSelectedSegment] = useState(null);
    // Whether time shift processing is taking place
    const [shifting, setShifting] = useState(false);

    const rulerWidth = 30;

    const [editingSegment, setEditingSegment] = useState(null);

    const { isRecording, startRecording, stopRecording, analyser, audioContext } = useRecorder(handleRecordingComplete);

    // TODO: REWRITE
    // Normal argument to useDraggable is false because we want listeners to be attached to the 
    // whole editor rather than just the literal arrow
    const { dragging, ref, pos, setPos } = useDraggable({ x: 1, y: 1 }, "x", { x: 0, y: 0 }, () => { }, { x: 0, y: 0 }, false, { top: 0, bottom: 40 });

    const animationRef = useRef(null);
    const isPlayingRef = useRef(false);
    const playStartTimeRef = useRef(0);
    const startPosRef = useRef(0);
    const updatePlayheadRef = useRef();
    const activeCtxRef = useRef(null);
    const trackSamplersRef = useRef({});
    const trackVolumesRef = useRef({});

    // Handle track volume
    useEffect(() => {
        tracks.forEach(t => {
            if (!trackVolumesRef.current[t.id]) {
                const volValue = t.volume !== undefined ? t.volume : 100;
                const volNode = new Tone.Volume(sliderToDb(volValue)).toDestination();
                volNode.mute = (volValue <= 0);
                trackVolumesRef.current[t.id] = volNode;
            }
        });
    }, [tracks]);

    const changeTrackVolume = useCallback((trackId, newVolume) => {
        setTracks(prevTracks => prevTracks.map(t => {
            if (t.id === trackId) {
                let tCopy = t.copy();
                tCopy.volume = newVolume;
                return tCopy;
            }
            return t;
        }));
        if (trackVolumesRef.current[trackId]) {
            trackVolumesRef.current[trackId].volume.value = sliderToDb(newVolume);
            trackVolumesRef.current[trackId].mute = (newVolume <= 0);
        }
    }, [tracks]);

    // Loads and initializes data for Tone.Sampler instances
    const loadSampler = useCallback((trackId, instrument) => {
        if (instrument === 'synth') {
            trackSamplersRef.current[trackId] = null;
            return;
        }
        if (!INSTRUMENT_SAMPLES[instrument]) return;

        console.log(`Loading sampler for ${instrument}...`);
        const sampler = new Tone.Sampler({
            urls: INSTRUMENT_SAMPLES[instrument],
            baseUrl: getBaseUrl(instrument),
            onload: () => {
                console.log(`${instrument} loaded for track ${trackId}`);
                trackSamplersRef.current[trackId] = sampler;
            }
        });
        if (trackVolumesRef.current[trackId]) {
            sampler.connect(trackVolumesRef.current[trackId]);
        } else {
            sampler.toDestination();
        }
    }, []);

    const changeTrackInstrument = useCallback((trackId, newInstrument) => {
        setTracks(prevTracks => prevTracks.map(t => {
            if (t.id === trackId) {
                let tCopy = t.copy();
                tCopy.instrument = newInstrument;
                return tCopy;
            }
            return t;
        }));
    }, []);

    updatePlayheadRef.current = () => {
        let ctx = activeCtxRef.current;
        if (!isPlayingRef.current || !ctx) return;
        const elapsed = ctx.currentTime - playStartTimeRef.current;
        const currentTimestamp = startPosRef.current + elapsed;

        const currentX = getPos(currentTimestamp);
        setPos(prev => ({ x: currentX, y: prev.y }));

        animationRef.current = requestAnimationFrame(updatePlayheadRef.current);
    };

    async function handleRecordingComplete(blob, duration) {
        let tracksCopy = tracks.map((track) => track.copy());
        let newTrack = tracksCopy[selectedTrack - 1];

        let data = await blob.arrayBuffer();
        const dataString = Buffer.from(data).toString("base64");

        // Create file based on buffer
        const response = await fetch(`${SERVER_PATH}/upload`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: `segment${nextAudioSegmentID}`, buffer: dataString })
        });

        if (response.ok) {
            const result = await response.json();

            // Create audiosegment based on blob (ArrayBuffer can only be "used" once)
            let newAudioSegment = new AudioSegment(nextAudioSegmentID, blob, getTimestamp(pos.x), getTimestamp(pos.x) + duration, selectedTrack - 1, 0, result.path);
            newTrack.addAudioSegment(newAudioSegment);
            setTracks(tracksCopy);
            nextAudioSegmentID++;
        }
        else {
            console.log("Could not create audio segment");
        }
    }

    function removeSelectedTrack() {
        let updatedTracks = tracks.filter((t) => (t.id != selectedTrack))
        for (let i = 0; i < updatedTracks.length; i++) {
            let track = updatedTracks[i];
            if (track.id > selectedTrack) {
                track.setID(track.id - 1);
            }
        }
        let newSelectedTrack = 1;
        if (selectedTrack == tracks.length) {
            if (selectedTrack != 1) {
                newSelectedTrack = selectedTrack - 1;
            }
        }
        else if (selectedTrack != 1) {
            newSelectedTrack = selectedTrack;
        }
        setTracks(updatedTracks);
        setSelectedTrack(newSelectedTrack);
    }

    function addTrack() {
        let nextTrackID = (tracks.length == 0 ? 1 : tracks.at(-1).id + 1);
        setTracks(tracks.concat(new Track(nextTrackID, [], newTrackType)));
        setSelectedTrack(nextTrackID);
    }

    const getDisplayableAudioData = useCallback(() => {
        if (!analyser || !isRecording) return;

        let data = new Float32Array(bufferLength);
        analyser.getFloatTimeDomainData(data);

        return data;
    }, [analyser, isRecording]);

    function toggleSelect(audioSegment) {
        if (selectedSegment == audioSegment) {
            setSelectedSegment(null);
        }
        else {
            setSelectedSegment(audioSegment);
        }
    }

    function asAudioSegmentComponent(obj) {
        return <AudioSegmentComponent
            className={styles.audioSegment} key={obj.id} ctx={audioContext}
            audioSegment={obj} quantize={rulerWidth * tickGap / quantize} onSelect={toggleSelect}
            selected={obj == selectedSegment} isBeingProcessed={obj == selectedSegment && shifting}
            openEditor={(seg) => setEditingSegment(seg)}
            scale={rulerWidth * tickGap / timeSignature[1] * (bpm / 60)}
        />;
    }

    async function playAt(timeStamp) {
        if (Tone.context.state !== "running") {
            await Tone.start();
        }
        let ctx = Tone.context.rawContext;
        activeCtxRef.current = ctx;

        isPlayingRef.current = true;
        playStartTimeRef.current = ctx.currentTime;
        startPosRef.current = timeStamp;

        for (let i = 0; i < tracks.length; i++) {
            let track = tracks[i];
            if (track.volume !== undefined && track.volume <= 0) continue;
            let sampler = trackSamplersRef.current[track.id] || null;
            let volumeNode = trackVolumesRef.current[track.id] || null;
            for (let j = 0; j < track.audioSegments.length; j++) {
                let segment = track.audioSegments[j];
                if (segment.stop > timeStamp) {
                    segment.play(ctx, timeStamp, playStartTimeRef.current, sampler, volumeNode);
                }
            }
        }

        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        animationRef.current = requestAnimationFrame(updatePlayheadRef.current);
    }

    function stopAll() {
        isPlayingRef.current = false;
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        for (let i = 0; i < tracks.length; i++) {
            let track = tracks[i];
            for (let j = 0; j < track.audioSegments.length; j++) {
                track.audioSegments[j].stopAudio();
            }
        }
    }

    function getTimestamp(pos) {
        return pos / (rulerWidth * tickGap / timeSignature[1] * (bpm / 60));
    }

    function getPos(timestamp) {
        return timestamp * (rulerWidth * tickGap / timeSignature[1] * (bpm / 60));
    }

    function splitAtPlayhead() {
        let track = tracks[selectedTrack - 1];
        let segment = track.containing(getTimestamp(pos.x));
        if (!segment) return;
        const currentScale = rulerWidth * tickGap / timeSignature[1] * (bpm / 60);
        const [left, right] = segment.split(getTimestamp(pos.x) - segment.start, nextAudioSegmentID);

        let tracksCopy = tracks.map((track) => track.copy());
        let newTrack = tracksCopy[selectedTrack - 1];

        newTrack.addAudioSegment(left);
        newTrack.addAudioSegment(right);
        newTrack.removeAudioSegment(segment);

        setTracks(tracksCopy);
        nextAudioSegmentID += 2;
    }

    function deleteSelectedSegment() {
        if (!selectedSegment) return;
        let trackNum = selectedSegment.track;
        let tracksCopy = tracks.map((track) => track.copy());
        let newTrack = tracksCopy[trackNum];
        newTrack.removeAudioSegment(selectedSegment);
        if (selectedSegment == editingSegment) {
            setEditingSegment(null);
        }
        setTracks(tracksCopy);
    }

    async function shiftSelected(e) {
        e.preventDefault();
        if (!selectedSegment) return;
        const formData = new FormData(e.target);
        const formJSON = Object.fromEntries(formData.entries());
        const shift = parseFloat(formJSON["shift"]);

        setShifting(true);
        const response = await fetch(`${SERVER_PATH}/shift`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ factor: shift, type: "shift", filePath: selectedSegment.filePath })
        });

        if (response.ok) {
            const shiftedAudio = await fetch(selectedSegment.filePath.replace("./public", ""));
            const blob = await shiftedAudio.blob();
            let newSegment = selectedSegment.copy()
            newSegment.data = blob;

            let trackNum = selectedSegment.track;
            let tracksCopy = tracks.map((track) => track.copy());
            let newTrack = tracksCopy[trackNum];

            newTrack.removeAudioSegment(selectedSegment);
            newTrack.addAudioSegment(newSegment);
            setTracks(tracksCopy);
            setSelectedSegment(newSegment);
            setShifting(false);
        }
        else {
            console.log("Could not shift audio segment");
        }
    }

    function addEmptySegment() {
        let newAudioSegment = new AudioSegment(nextAudioSegmentID, null, getTimestamp(pos.x), getTimestamp(pos.x) + 4, selectedTrack - 1, 0, null);
        let tracksCopy = tracks.map((track) => track.copy());
        let newTrack = tracksCopy[selectedTrack - 1];

        newTrack.addAudioSegment(newAudioSegment);
        setTracks(tracksCopy);
        nextAudioSegmentID++;
    }

    function updateSegmentData(id, blob, duration, noteData, filePath, range) {
        let tracksCopy = tracks.map((track) => track.copy());
        for (let track of tracksCopy) {
            let seg = track.audioSegments.find((s) => s.id === id);
            if (seg) {
                if (blob) seg.data = blob;
                seg.stop = seg.start + duration;
                seg.noteData = noteData;
                if (filePath) seg.filePath = filePath;
                if (range) seg.range = range;
                break;
            }
        }
        setTracks(tracksCopy);
    }

    async function toggleRecording() {
        if (isRecording) {
            stopRecording();
            stopAll();
        } else {
            await playAt(getTimestamp(pos.x));
            await startRecording();
        }
    }

    function handleBPMChange(e) {
        let newBPM = parseInt(e.target.value);
        if (newBPM === bpm) return;

        let ratio = bpm / newBPM;

        let tracksCopy = tracks.map(track => {
            let tCopy = track.copy();
            tCopy.audioSegments = tCopy.audioSegments.map(seg => {
                let segCopy = seg.copy();
                let oldStart = segCopy.start;
                segCopy.start = oldStart * ratio;

                if (!segCopy.data) {
                    let oldDuration = segCopy.stop - oldStart;
                    segCopy.stop = segCopy.start + (oldDuration * ratio);
                    if (segCopy.noteData) {
                        segCopy.noteData = segCopy.noteData.map(note => ({
                            ...note,
                            x: note.x * ratio,
                            w: note.w * ratio
                        }));
                    }
                } else {
                    let oldDuration = segCopy.stop - oldStart;
                    segCopy.stop = segCopy.start + oldDuration;
                }
                return segCopy;
            });
            return tCopy;
        });

        setTracks(tracksCopy);
        setBPM(newBPM);
    }

    const currentTrack = tracks.find(t => t.id === selectedTrack);
    const isAudioTrack = currentTrack ? currentTrack.type === 'audio' : true;
    const isMidiTrack = currentTrack ? currentTrack.type === 'midi' : false;

    return (
        <div className={styles.dawPage}>

            {/* Segment Editor (opens when double-clicking a segment) */}
            {editingSegment && (
                <div className={styles.segmentEditorPanel}>
                    <SegmentEditor key={editingSegment.id} width={width} height={height} quantize={rulerWidth * tickGap / quantize} scale={rulerWidth * tickGap / timeSignature[1] * (bpm / 60)} rulerSettings={{ width: rulerWidth, gap: tickGap, sig: timeSignature }} segment={editingSegment} updateSegment={updateSegmentData} closeEditor={() => setEditingSegment(null)} />
                </div>
            )}

            {/* ===== Transport Bar ===== */}
            <div className={styles.transportBar}>
                {/* Track management */}
                <div className={styles.transportGroup}>
                    <select value={newTrackType} onChange={e => setNewTrackType(e.target.value)} title="Track Type" style={{ backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', padding: '4px' }}>
                        <option value="audio">Audio</option>
                        <option value="midi">MIDI</option>
                    </select>
                    <button onClick={addTrack} title="Add Track">＋</button>
                    <button onClick={removeSelectedTrack} title="Remove Track">－</button>
                </div>

                <div className={styles.transportDivider}></div>

                {/* Playback controls */}
                <div className={styles.transportGroup}>
                    <RecordButton isRecording={isRecording} onClick={toggleRecording} height={32} width={32} disabled={!isAudioTrack} />
                    <button className={styles.transportBtn} onClick={() => { if (isPlayingRef.current) stopAll(); else playAt(getTimestamp(pos.x)); }} title="Play">▶</button>
                    <button className={styles.transportBtn} onClick={stopAll} title="Stop">⏹</button>
                </div>

                <div className={styles.transportDivider}></div>

                {/* Edit tools */}
                <div className={styles.transportGroup}>
                    <button onClick={splitAtPlayhead} title="Split at Playhead">✂</button>
                    <button onClick={deleteSelectedSegment} title="Delete Selected">🗑</button>
                    <button onClick={addEmptySegment} disabled={!isMidiTrack} style={{ opacity: isMidiTrack ? 1 : 0.5, cursor: isMidiTrack ? 'pointer' : 'not-allowed' }}>+ Segment</button>
                </div>

                <div className={styles.transportDivider}></div>

                {/* Pitch shift */}
                <form className={styles.shiftForm} onSubmit={(e) => shiftSelected(e)}>
                    <label>
                        Shift
                        <input name="shift" type="number" min="0.5" max="2" step="0.1" defaultValue="1" style={{ width: '60px' }}></input>
                    </label>
                    <button type="submit">Apply</button>
                </form>
            </div>

            {/* ===== Controls Panel ===== */}
            <div className={styles.controlsPanel}>
                <div className={styles.controlGroup}>
                    <label>BPM</label>
                    <input type="range" min="20" max="200" value={bpm} onChange={e => handleBPMChange(e)}></input>
                    <span className={styles.controlValue}>{bpm}</span>
                </div>
                <div className={styles.controlGroup}>
                    <label>Zoom</label>
                    <input type="range" min="1" max="10" defaultValue="5" onChange={e => setTickGap(e.target.value)}></input>
                    <span className={styles.controlValue}>{tickGap}</span>
                </div>
                <div className={styles.controlGroup}>
                    <label>Time Sig</label>
                    <select defaultValue={"4,4"} onChange={e => setTimeSignature(Array.from(e.target.value.split(","), (c) => parseInt(c)))}>
                        <option value="3,4">3/4</option>
                        <option value="4,4">4/4</option>
                        <option value="6,8">6/8</option>
                    </select>
                </div>
                <div className={styles.controlGroup}>
                    <label>Quantize</label>
                    <select defaultValue={8} onChange={e => setQuantize(e.target.value)}>
                        <option value={16}>1/16</option>
                        <option value={8}>1/8</option>
                        <option value={4}>1/4</option>
                        <option value={2}>1/2</option>
                        <option value={1}>1/1</option>
                    </select>
                </div>
            </div>

            {/* ===== Track Editor ===== */}
            <ClipDisplay components={tracks} width={width} height={height} rulerSettings={{ width: rulerWidth, gap: tickGap, sig: timeSignature }} selected={{ selectedTrack: selectedTrack, setSelectedTrack: setSelectedTrack }} changeTrackVolume={changeTrackVolume} playhead={{ ref: ref, pos: pos }} asComp={asAudioSegmentComponent} type={"recordingCanvas"} />

            {/* ===== Waveform Monitor & Instrument Selector ===== */}
            <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', padding: '10px' }}>
                <div className={styles.waveformSection} style={{ flex: 1, margin: 0 }}>
                    <div className={styles.waveformLabel}>Input Monitor</div>
                    <WaveformVisualizer width={500} height={120} bufferLength={bufferLength} getData={getDisplayableAudioData} dataType={"float"} />
                </div>

                {isMidiTrack && (
                    <div className={styles.instrumentSection} style={{ flex: 1, backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '4px', border: '1px solid #333' }}>
                        <div className={styles.waveformLabel} style={{ marginBottom: '10px', fontSize: '12px', color: '#888' }}>Instrument Selection</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <select
                                value={currentTrack?.instrument || 'piano'}
                                onChange={(e) => {
                                    changeTrackInstrument(currentTrack.id, e.target.value);
                                    if (e.target.value === 'synth') trackSamplersRef.current[currentTrack.id] = null;
                                }}
                                style={{ padding: '8px', backgroundColor: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', outline: 'none' }}
                            >
                                <option value="synth">synth</option>
                                {Object.keys(INSTRUMENT_SAMPLES).map(inst => (
                                    <option key={inst} value={inst}>{inst}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => loadSampler(currentTrack.id, currentTrack.instrument || 'piano')}
                                style={{ padding: '8px', cursor: 'pointer', backgroundColor: 'var(--daw-accent-green)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
                            >
                                Load Instrument
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}