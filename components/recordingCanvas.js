import React, { useRef, useState, useEffect, useCallback } from 'react';
import useRecorder from '../hooks/useRecorder';
import RecordButton from '../components/recordButton';
import AudioSegment from '../components/audioSegment';
import styles from '../styles/track.module.css';
import Ruler from '../components/ruler';

let nextID = 0;
let nextTrack = 1;

export default function RecordingCanvas({ width=800, height=400 }) {
    const canvasRef = useRef(null);
    const [context, setContext] = useState(null);
    const [audioSegments, setAudioSegments] = useState([]);

    const [tickGap, setTickGap] = useState(2);
    const [timeSignature, setTimeSignature] = useState([4, 4]);

    const { isRecording, startRecording, stopRecording, analyser, audioContext } = useRecorder(handleRecordingComplete);

    const rulerStyle = {
		width: "150%",
		height: "50px",

		backgroundImage: "linear-gradient(90deg, rgb(0, 0, 0) 0 1px, transparent 0)",
		
		backgroundRepeat: "repeat-x",
		backgroundSize: `${30 * tickGap * (timeSignature[0] / timeSignature[1])}px 100px`
	}
    
    function handleRecordingComplete(blob, duration) {
        setAudioSegments(audioSegments.concat({ id: nextID, data: blob, start: 0, stop: Math.random() * 2 + 0.5, track: nextTrack}));
        nextID++;
        nextTrack++;
    }

    useEffect(() => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            setContext(ctx);
        }
    }, []);

    const draw = useCallback(() => {
        if (!analyser || !isRecording) return;
        
        for (let i = 0; i < audioSegments.length; i++) {
            console.log(audioSegments.length);
            //audioSegments[i].draw(context);
        }
        
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

    return (
        <>
            <div style={{width: `${width}px`, height: `${height}px`, overflowY: "scroll"}}>
                <label>tick gap</label>
                <input type="range" min="1" max="10" defaultValue="2" onChange={e => setTickGap(e.target.value)}></input>
                
                <label>time signature</label>
                <select defaultValue={"4,4"} onChange={e => setTimeSignature(Array.from(e.target.value.split(","), (c) => parseInt(c)))}>
                    <option value="3,4">3/4</option>
                    <option value="4,4">4/4</option>
                    <option value="6,8">6/8</option>
                </select>
                <Ruler tickGap={tickGap} tickValue={timeSignature[0]} tickUnit={timeSignature[1]}/>
                {
                    audioSegments.map( (item) => 
                        {
                            return (
                                <>
                                <div className={styles.track} style={rulerStyle}>
                                    <AudioSegment className={styles.audioSegment} key={item.id} audio={item.data} ctx={audioContext} start={item.start} stop={item.stop} track={item.track}/>
                                </div> 
                                </>
                            ); 
                            
                        }
                    )
                }
            </div>
            <canvas ref={canvasRef} width={500} height={300}></canvas> <br />
            <RecordButton isRecording={isRecording} onClick={isRecording ? stopRecording : startRecording} height={50} width={50}/>
        </> 
    );
}