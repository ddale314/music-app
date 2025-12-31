import { useRef, useState, useEffect, useCallback, Fragment } from 'react';
import { Complex } from '../utils/complex';
import { fft } from '../utils/fft';
import WaveformVisualizer from './waveform';

const fftSize = 8192;
let bufferLength = fftSize / 2;

// equal temperament
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
    const [note, setNote] = useState(-1);
    const [frequency, setFrequency] = useState(-1);

    const [frequencyData, setFrequencyData] = useState(data);

    function handleAudio() {
        if (type != "realtime") return data;
        if (!analyser) return;
        let frequencyData = getFrequencyData(analyser);

        let [currentNote, currentFrequency] = getFrequencyAndNote(frequencyData, sampleRate);
        setNote(currentNote);
        setFrequency(currentFrequency);

        return frequencyData;
    }

    return (
        <>
            <WaveformVisualizer width={width} height={height} bufferLength={bufferLength} getData={handleAudio} dataType={"complex"}/>
            <div>Frequency: {frequency}, Note: {note}</div>
        </>
    );
}