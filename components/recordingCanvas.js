import React, { useRef, useState, useEffect, useCallback } from 'react';
import useRecorder from '../hooks/useRecorder';
import RecordButton from '../components/recordButton';
import { AudioSegment, AudioSegmentComponent } from '../components/audioSegment';
import styles from '../styles/editor.module.css';
import Ruler from '../components/ruler';
import { Track, TrackComponent } from '../components/track';

let nextID = 0;

export default function RecordingCanvas({ width=800, height=400 }) {
    const canvasRef = useRef(null);
    const [context, setContext] = useState(null);

    const [tickGap, setTickGap] = useState(2);
    const [timeSignature, setTimeSignature] = useState([4, 4]);
    const [bpm, setBPM] = useState(100);
    const [mouseX, setMouseX] = useState(0);

    const [selectedTrack, setSelectedTrack] = useState(1);
    const [tracks, setTracks] = useState([new Track(1)]);
    const [playLocation, setPlayLocation] = useState(-1);
    
    const rulerWidth = 30;
    const boundingRectLeft = 482;

    const { isRecording, startRecording, stopRecording, analyser, audioContext } = useRecorder(handleRecordingComplete);

    const rulerStyle = {
        // make this width scale with the maximum audio segment length, or cap recording at certain length
		width: "200%",
		height: "50px",

		backgroundImage: "linear-gradient(90deg, rgb(0, 0, 0) 0 1px, transparent 0)",
		
		backgroundRepeat: "repeat-x",
		backgroundSize: `${rulerWidth * tickGap * (timeSignature[0] / timeSignature[1])}px 100px`
	}
    
    function handleRecordingComplete(blob, duration) {
        let tracksCopy = tracks.map((track) => track.copy());
        let newTrack = tracksCopy[selectedTrack-1];
        let newAudioSegment = new AudioSegment(nextID, blob, getTimestamp(mouseX), getTimestamp(mouseX) + duration, selectedTrack - 1);
        newTrack.addAudioSegment(newAudioSegment);
        setTracks(tracksCopy);
        nextID++;
    }

    const [dragging, setDragging] = useState(false);

    function handleMouseMove(e) {
        //console.log(e.target.getBoundingClientRect().left);
        if (!dragging) return;
        let bounds = e.target.getBoundingClientRect();
        setMouseX(e.screenX - bounds.left);
    }

    function handleClick(e) {
        let bounds = e.target.getBoundingClientRect();
        setMouseX(e.screenX - bounds.left);
    }

    function removeSelectedTrack() {
        let updatedTracks = tracks.filter((t) => (t.id != selectedTrack))
        for (let i = 0; i < updatedTracks.length; i++) {
            let track = updatedTracks[i];
            if (track.id > selectedTrack) {
                track.setID(track.id-1);
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

    useEffect(() => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            setContext(ctx);
        }
    }, []);

    const draw = useCallback(() => {
        if (!analyser || !isRecording) return;
        
        let bufferLength = analyser.fftSize / 2;

        let data = new Float32Array(bufferLength);
        analyser.getFloatTimeDomainData(data);
        // analyser.getFloatFrequencyData(data);

        context.fillStyle = 'rgb(255, 255, 255)';
        context.fillRect(0, 0, width, height);

        context.lineWidth = 3;
        context.strokeStyle = 'rgb(100, 150, 255)';

        context.beginPath();

        let increment = width * 1.0 / (bufferLength / 4);
        let x = 0;

        for (let i = 0; i < (bufferLength / 4); i++) {
            let y = data[i] * height / 2 + height / 2;
            if (i === 0) {
                context.moveTo(x, y);
            }
            else {
                context.lineTo(x, y);
            }

            x += increment;
        }
    
        context.stroke();
    }, [context, height, width, isRecording]);

    useEffect(() => {
        let animationFrameId;

        if (context) {
            const render = () => {
                draw();
                animationFrameId = requestAnimationFrame(render);
            }
            render();
        }

        return () => {
            cancelAnimationFrame(animationFrameId);
        }
    }, [draw, context]);

    function asAudioSegmentComponent(obj) {
        return <AudioSegmentComponent className={styles.audioSegment} key={obj.id} ctx={audioContext} audioSegment={obj} size={rulerWidth * tickGap * (1 / timeSignature[1]) * (bpm / 60)}/>;
    }

    function playAt(pos) {
        for (let i = 0; i < tracks.length; i++) {
            let track = tracks[i];
            let segment = track.containing(pos);
            if (segment) {
                segment.play(audioContext, pos - segment.start);
                setPlayLocation(getX(pos));
            }
        }
    }

    function stopAll() {
        for (let i = 0; i < tracks.length; i++) {
            let track = tracks[i];
            for (let j = 0; j < track.audioSegments.length; j++) {
                track.audioSegments[j].stopAudio();
            }
        }
    }

    function getTimestamp(pos) {
        return pos / (rulerWidth * tickGap * (1 / timeSignature[1]) * (bpm / 60));
    }

    function getX(timestamp) {
        return timestamp * (rulerWidth * tickGap * (1 / timeSignature[1]) * (bpm / 60));
    }

    function splitAtPlayhead() {
        let track = tracks[selectedTrack-1];
        let segment = track.containing(getTimestamp(mouseX));
        if (!segment) return;
        const [left, right] = segment.split(getTimestamp(mouseX) - segment.start, nextID);

        let tracksCopy = tracks.map((track) => track.copy());
        let newTrack = tracksCopy[selectedTrack-1];

        newTrack.addAudioSegment(left);
        newTrack.addAudioSegment(right);
        newTrack.removeAudioSegment(segment);

        setTracks(tracksCopy);
        nextID += 2;
    }

    return (
        <>
            <button onClick={addTrack}>+</button>
            <button onClick={removeSelectedTrack}>-</button>
            <button onClick={splitAtPlayhead}>Split</button>
            <div style={{width: `${width}px`}}>
                <label>
                    tick gap
                    <input type="range" min="1" max="10" defaultValue="2" onChange={e => setTickGap(e.target.value)}></input>
                    {tickGap}
                </label>
                <label>
                    bpm
                    <input type="range" min="20" max="200" defaultValue="100" onChange={e => setBPM(e.target.value)}></input>
                    {bpm}
                </label>
                <label>
                    time signature
                    <select defaultValue={"4,4"} onChange={e => setTimeSignature(Array.from(e.target.value.split(","), (c) => parseInt(c)))}>
                        <option value="3,4">3/4</option>
                        <option value="4,4">4/4</option>
                        <option value="6,8">6/8</option>
                    </select>
                </label>
                <RecordButton isRecording={isRecording} onClick={isRecording ? stopRecording : startRecording} height={50} width={50}/>
                <button onClick={() => playAt(getTimestamp(mouseX))}>{'\u23F5'}</button>
                <button onClick={stopAll}>{'\u23F8'}</button>

            </div>

            <div className={styles.editorContainer}>
                <div className={styles.trackLabel} style={{height: `${height-55}px`}}>
                    {
                        tracks.map((track) => 
                            {
                                return (
                                    <button onClick={() => setSelectedTrack(track.id)} style={{height: "50px", border: 0, backgroundColor: (selectedTrack == track.id ? "rgb(0, 255, 0)" : "rgb(255, 255, 255)")}}>track {track.id}</button>
                                ); 
                                
                            }   
                        )
                    }
                </div>
                
                {/* This appears to be fixed -> Maybe there is an issue if the size of the audio segment exceeds the size of the container? */}
                <div onClick={handleClick} onMouseUp={(e) => {setDragging(false)}} onMouseDown={(e) => {setDragging(true)}} onMouseMove={handleMouseMove} className={styles.editor} style={{width: `${width}px`, height: `${height}px`}}>
                    <div className={styles.ruler}>
                        <Ruler defaultWidth={rulerWidth} tickGap={tickGap} tickValue={timeSignature[0]} tickUnit={timeSignature[1]}/> 
                        <div style={{userSelect: "none", position: "absolute", top: 0, left: `${-6.5+mouseX}px`}}>{'\u2193'}</div>  
                     </div> 
                    {
                        tracks.map( (track) =>
                            {
                                return (
                                    <TrackComponent audioSegments={track.audioSegments.map((item) => [asAudioSegmentComponent(item)])} rulerStyle={rulerStyle}/>
                                ); 
                                
                            }
                        )
                    }
                </div>
            </div>
            <canvas ref={canvasRef} width={500} height={300}></canvas> <br />
        </> 
    );
}