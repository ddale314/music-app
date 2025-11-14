import React, { useRef, useState, useEffect, useCallback, Fragment } from 'react';
import { Complex } from '../utils/complex';
import { fft } from '../utils/fft';
import AudioSegment from './audioSegment';
import useRecorder from '../hooks/useRecorder';

const fftSize = 8192;
let bufferLength = fftSize / 2;

const INTERVAL = Math.pow(2, 1/12)
const NOTES = ['A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A']

function getFrequencyData(analyser) {
    let timeDomainData = getTimeDomainData(analyser)
    let frequencyData = [];
    for (let i = 0; i < bufferLength; i++) {
        frequencyData[i] = new Complex(timeDomainData[i], 0);
    }
    fft(frequencyData, false);
    return frequencyData;
}

function getTimeDomainData(analyser) {
    let timeDomainData = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(timeDomainData);
    
    return timeDomainData;
}

function getFrequencyAndNote(frequencyData, sampleRate) {
    let maxMagnitude = 0;
    let maxFrequency = 0;
    for (let i = 0; i < bufferLength; i++) {
        let magnitude = frequencyData[i].magnitude();
        if (magnitude > maxMagnitude) {
            maxMagnitude = magnitude;
            maxFrequency = i;
        }
    }
    let realFrequency = indexToFrequency(maxFrequency, sampleRate);
    
    const A = 440;
    let difference = Math.log(realFrequency / A) / Math.log(INTERVAL);
    difference = Math.trunc(difference);
    let note = (Math.abs(difference) % 12) * Math.sign(difference);
    if (Math.sign(note) == -1) {
        note = 12 + note;
    }

    return [NOTES[note - 1], realFrequency] // 0 index
}

function indexToFrequency(idx, sampleRate) {
    return Math.round(idx * (sampleRate / (fftSize / 2)));
}

export default function AudioCanvas({ type, width=400, height=200, data=null, analyser, sampleRate }) {
    const canvasRef = useRef(null);
    const [context, setContext] = useState(null);
    const [note, setNote] = useState(-1);
    const [frequency, setFrequency] = useState(-1);

    function handleRealtimeAudio() {
        let frequencyData = getFrequencyData(analyser);

        let [currentNote, currentFrequency] = getFrequencyAndNote(frequencyData, sampleRate);
        setNote(currentNote);
        setFrequency(currentFrequency);

        return frequencyData;
    }

    const draw = useCallback(() => {
        if (type == "realtime" && !analyser) return;
        let frequencyData = data;
        if (type == "realtime") {
            frequencyData = handleRealtimeAudio();
        }

        context.fillStyle = 'rgb(255, 255, 255)';
        context.fillRect(0, 0, width, height);

        context.lineWidth = 3;
        context.strokeStyle = 'rgb(100, 150, 255)';

        context.beginPath();

        let increment = width * 1.0 / (bufferLength / 4);
        let x = 0;

        for (let i = 0; i < (bufferLength / 4); i++) {
            let magnitude = frequencyData[i].magnitude();
            let y = -magnitude + height;
            if (i === 0) {
                context.moveTo(x, y);
            }
            else {
                context.lineTo(x, y);
            }
            x += increment;
        }

        context.stroke();
    
    }, [context, height, width]);

    useEffect(() => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            setContext(ctx);
        }
    }, [])
    
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
            <div>Frequency: {frequency}, Note: {note}</div>
        </>
    );
}