import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Complex } from '../utils/complex';
import { fft } from '../utils/fft';

let mediaStream;
let audioContext;
let analyser;
let recording = false;
let recordedBuffer;
let recordedData;
let recordPos = 0;
let recordLength;

let fftSize = 8192;
let bufferLength = fftSize / 2;

const INTERVAL = Math.pow(2, 1/12)
const NOTES = ['A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A']

export function setMediaStream(stream) {
    mediaStream = stream;
}

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

function initAnalyser(audioContext) {
    const source = audioContext.createMediaStreamSource(mediaStream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = fftSize;
    source.connect(analyser);
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

export function startRecording() {
    recordPos = 0;
    recordedData = new Float32Array(audioContext.sampleRate * recordLength);
    recording = true;
}

export function stopRecording() {
    recording = false;
    //recordedBuffer.copyToChannel(recordedData, 0);
}

export function playCapturedAudio() {
    console.log(recordedData);
    const source = audioContext.createBufferSource();
    source.connect(audioContext.destination);
    source.buffer = recordedBuffer;
    console.log(recordedBuffer);
    source.start();
}


export default function AudioCanvas({ type, width, height, data=null, maxRecordLength }) {
    const canvasRef = useRef(null);
    const [context, setContext] = useState(null);
    const [note, setNote] = useState(-1);
    const [frequency, setFrequency] = useState(-1);
    recordLength = maxRecordLength;

    const draw = useCallback(() => {
        if (mediaStream) {
            if (!audioContext) {
                audioContext = new AudioContext();
            }
            if (!analyser) {
                initAnalyser(audioContext);
            }

            let frequencyData;

            if (recording) {
                if (!recordedBuffer) {
                    recordedBuffer = audioContext.createBuffer(1, audioContext.sampleRate * maxRecordLength, audioContext.sampleRate);
                }

                    // for multiple channels
                    //let pos = recordPos;
                    //for (let i = 0; i < recordedBuffer.numberOfChannels; i++) {
                    //    const channel = recordedBuffer.getChannelData(i);
                    //    while (pos < recordedBuffer.length) {
                    //        pos++;
                    //    }
                    //    if (i == recordedBuffer.numberOfChannels - 1) {
                    //        recordPos = pos;
                    //    }
                    //    else {
                    //        pos = recordPos;
                    //    }
                    //}

                let timeDomainData = getTimeDomainData(analyser);
                recordedBuffer.copyToChannel(timeDomainData, 0);
                //for (let i = 0; i < timeDomainData.length; i++) {
                //    recordedData[recordPos] = timeDomainData[i];
                //    recordPos++;
                //}

                    //const channel = recordedBuffer.getChannelData(0);
                    //let timeDomainData = getTimeDomainData(analyser);
                    //let i = 0;
                    //while (recordPos < recordedBuffer.length && i < timeDomainData.length) {
                    //    channel[recordPos] = timeDomainData[i];
                    //    console.log(recordPos + " " + i);
                    //    recordPos++;
                    //    i++;
                    //}
            }

            if (data === null) {
                 frequencyData = getFrequencyData(analyser);
            }
            else {
                frequencyData = data
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

            let [currentNote, currentFrequency] = getFrequencyAndNote(frequencyData, audioContext.sampleRate);
            setNote(currentNote);
            setFrequency(currentFrequency);
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