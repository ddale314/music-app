import React, { useRef, useState, useEffect, useCallback } from 'react';
import useRecorder from '../hooks/useRecorder';
import RecordButton from '../components/recordButton'

export default function RecordingCanvas({ width=600, height=200 }) {
    const canvasRef = useRef(null);
    const [context, setContext] = useState(null);
    const [audioSegments, setAudioSegments] = useState([]);

    function handleRecordingComplete(blob) {
        setAudioSegments(audioSegments.concat(blob))
    }

    const { isRecording, startRecording, stopRecording, analyser, audioContext } = useRecorder(handleRecordingComplete);

    useEffect(() => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            setContext(ctx);
        }
    }, []);

    const draw = useCallback(() => {
        if (!analyser || !isRecording) return;
        
        //for (let i = 0; i < audioSegments.length; i++) {
        //    audioSegments[i].draw(context);
        //}
        
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
            let y = data[i] * height + height / 2;
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
            <canvas ref={canvasRef} width={width} height={height}></canvas>
            <RecordButton isRecording={isRecording} onClick={isRecording ? stopRecording : startRecording} height={50} width={50}/>
        </> 
    );
}