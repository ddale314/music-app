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

const fftSize = 8192;
const bufferLength = fftSize / 2;
let nextID = 0;
const SERVER_PATH = "http://localhost:3000/api";

export default function RecordingCanvas({ width = 800, height = 400 }) {
    const [tickGap, setTickGap] = useState(2);
    const [timeSignature, setTimeSignature] = useState([4, 4]);
    const [bpm, setBPM] = useState(100);
    const [quantize, setQuantize] = useState(8);

    const [selectedTrack, setSelectedTrack] = useState(1);
    const [tracks, setTracks] = useState([new Track(1)]);
    const [playLocation, setPlayLocation] = useState(-1);
    const [selectedSegment, setSelectedSegment] = useState(null);
    const [shifting, setShifting] = useState(false); // whether time shift processing is taking place

    const rulerWidth = 30;
    const boundingRectLeft = 482;

    const [editingSegment, setEditingSegment] = useState(null);

    const { isRecording, startRecording, stopRecording, analyser, audioContext } = useRecorder(handleRecordingComplete);

    // normal argument to useDraggable is false because we want listeners to be attached to the whole editor rather than just the literal arrow
    const { dragging, ref, pos, setPos } = useDraggable({ x: 1, y: 1 }, "x", { x: 0, y: 0 }, () => { }, { x: 140, y: 0 }, false);

    const animationRef = useRef(null);
    const isPlayingRef = useRef(false);
    const playStartTimeRef = useRef(0);
    const startPosRef = useRef(0);
    const updatePlayheadRef = useRef();
    const activeCtxRef = useRef(null);

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
        console.log(blob);
        let data = await blob.arrayBuffer();
        const dataString = Buffer.from(data).toString("base64");

        // create file based on buffer
        const response = await fetch(`${SERVER_PATH}/upload`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: `segment${nextID}`, buffer: dataString })
        });

        if (response.ok) {
            const result = await response.json();
            console.log(result.path);

            // create audiosegment based on blob (arraybuffer can only be "used" once)
            let newAudioSegment = new AudioSegment(nextID, blob, getTimestamp(pos.x), getTimestamp(pos.x) + duration, selectedTrack - 1, 0, result.path);
            newTrack.addAudioSegment(newAudioSegment);
            setTracks(tracksCopy);
            nextID++;
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
        setTracks(tracks.concat(new Track(nextTrackID)));
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
            audioSegment={obj} size={rulerWidth * tickGap / timeSignature[1] * (bpm / 60)}
            quantize={rulerWidth * tickGap / quantize} select={toggleSelect}
            selected={obj == selectedSegment} processing={obj == selectedSegment && shifting}
            openEditor={(seg) => setEditingSegment(seg)}
        />;
    }

    // start playing audiosegments across all tracks which lie after the playhead
    function playAt(ts) {
        let ctx = audioContext || new window.AudioContext();
        activeCtxRef.current = ctx;

        isPlayingRef.current = true;
        playStartTimeRef.current = ctx.currentTime;
        startPosRef.current = ts;

        for (let i = 0; i < tracks.length; i++) {
            let track = tracks[i];
            for (let j = 0; j < track.audioSegments.length; j++) {
                let segment = track.audioSegments[j];
                if (segment.stop > ts) {
                    let delay = Math.max(0, segment.start - ts);
                    let offset = Math.max(0, ts - segment.start);
                    segment.play(ctx, delay, offset, playStartTimeRef.current);
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
        const [left, right] = segment.split(getTimestamp(pos.x) - segment.start, nextID);

        let tracksCopy = tracks.map((track) => track.copy());
        let newTrack = tracksCopy[selectedTrack - 1];

        newTrack.addAudioSegment(left);
        newTrack.addAudioSegment(right);
        newTrack.removeAudioSegment(segment);

        setTracks(tracksCopy);
        nextID += 2;
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
        console.log(newTrack);
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
            console.log(blob);
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
        let newAudioSegment = new AudioSegment(nextID, null, getTimestamp(pos.x), getTimestamp(pos.x) + 4, selectedTrack - 1, 0, null);
        let tracksCopy = tracks.map((track) => track.copy());
        let newTrack = tracksCopy[selectedTrack - 1];

        newTrack.addAudioSegment(newAudioSegment);
        setTracks(tracksCopy);
        nextID++;
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
            playAt(getTimestamp(pos.x));
            await startRecording();
        }
    }

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
                    <button onClick={addTrack} title="Add Track">＋</button>
                    <button onClick={removeSelectedTrack} title="Remove Track">－</button>
                </div>

                <div className={styles.transportDivider}></div>

                {/* Playback controls */}
                <div className={styles.transportGroup}>
                    <RecordButton isRecording={isRecording} onClick={toggleRecording} height={32} width={32} />
                    <button className={styles.transportBtn} onClick={() => playAt(getTimestamp(pos.x))} title="Play">▶</button>
                    <button className={styles.transportBtn} onClick={stopAll} title="Stop">⏹</button>
                </div>

                <div className={styles.transportDivider}></div>

                {/* Edit tools */}
                <div className={styles.transportGroup}>
                    <button onClick={splitAtPlayhead} title="Split at Playhead">✂</button>
                    <button onClick={deleteSelectedSegment} title="Delete Selected">🗑</button>
                    <button onClick={addEmptySegment}>+ Segment</button>
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
                    <input type="range" min="20" max="200" defaultValue="100" onChange={e => setBPM(e.target.value)}></input>
                    <span className={styles.controlValue}>{bpm}</span>
                </div>
                <div className={styles.controlGroup}>
                    <label>Zoom</label>
                    <input type="range" min="1" max="10" defaultValue="2" onChange={e => setTickGap(e.target.value)}></input>
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
                    </select>
                </div>
            </div>

            {/* ===== Track Editor ===== */}
            <ClipDisplay components={tracks} width={width} height={height} rulerSettings={{ width: rulerWidth, gap: tickGap, sig: timeSignature }} selected={{ selectedTrack: selectedTrack, setSelectedTrack: setSelectedTrack }} playhead={{ ref: ref, pos: pos }} asComp={asAudioSegmentComponent} type={"recordingCanvas"} />

            {/* ===== Waveform Monitor ===== */}
            <div className={styles.waveformSection}>
                <div className={styles.waveformLabel}>Input Monitor</div>
                <WaveformVisualizer width={500} height={120} bufferLength={bufferLength} getData={getDisplayableAudioData} dataType={"float"} />
            </div>
        </div>
    );
}