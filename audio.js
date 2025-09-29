import {Complex} from './complex.js';

const record = document.querySelector('.record');
const stop = document.querySelector('.stop');
const text = document.getElementById('text');
const audio = document.getElementById('audio');
const visualizer = document.querySelector('.visualizer');
const editor = document.querySelector('.editor');
const note = document.getElementById('note');
const capture = document.querySelector('.capture');
const play = document.querySelector('.play');
const index = document.getElementById('index');
const current = document.getElementById('current');
const change = document.querySelector('.change');
const desiredMagnitude = document.getElementById('magnitude');
const noteName = document.getElementById('noteName');

const INTERVAL = 1.059463094; // 12th root of 2

stop.disabled = true;
play.disabled = true;
change.disabled = true;
let data = [];
let blob;
let audioContext;
const frequencyCanvas = visualizer.getContext("2d");
const captureCanvas = editor.getContext("2d");
let frequencyData = [];
let capturedFrequencyData = [];

play.onclick = function() {
    playCapturedAudio();
}

change.onclick = function() {
    if (index.value && Math.round(index.value) < capturedFrequencyData.length) {
        let i = Math.round(index.value);
        let currentValue = capturedFrequencyData[i];
        if (Math.round(currentValue.magnitude()) != 0) {
            let desiredValue = desiredMagnitude.value;
            let unit = currentValue.realDivide(currentValue.magnitude());
            capturedFrequencyData[i] = unit.multiply(new Complex(desiredValue, 0));
        }
    }
}

if (navigator.mediaDevices.getUserMedia) {
    const constraints = { audio: true };
    text.textContent = 'Initialized audio player.';
    let onSuccess = function(stream) {
        console.log(stream);
        const mediaRecorder = new MediaRecorder(stream);

        drawFrequencyData(stream);
        drawCapturedData(stream);

        record.onclick = function() {
            mediaRecorder.start();
            stop.disabled = false;
            record.disabled = true;
            text.textContent = 'Recording...';
        }
        stop.onclick = function() {
            mediaRecorder.stop();
            stop.disabled = true;
            record.disabled = false;
            text.textContent = 'Recording stopped.';
        }

        capture.onclick = function() {
            capturedFrequencyData = frequencyData.slice();
            change.disabled = false;
            play.disabled = false;
        }
        
        mediaRecorder.onstop = function() {
            audio.controls = true;
            blob = new Blob(data, { 'type': 'audio/ogg' });
            data = [];
            const audioURL = window.URL.createObjectURL(blob);
            audio.src = audioURL;
        }

        mediaRecorder.ondataavailable = function(e) {
            data.push(e.data);
        }

    }

    let onError = function() {
        console.log('Error: ' + err);
    }

    navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
    console.log("ran");
}

function frequencyToNote(frequency) {
    let A = 440;
    let difference = Math.log(frequency/A) / Math.log(INTERVAL); 
    difference = Math.trunc(difference);
    difference = (Math.abs(difference) % 12) * Math.sign(difference);
    if (Math.sign(difference) == -1) {
        difference = 12 + difference;
    }
    switch (difference) {
        case 1:
            return 'A#';
        case 2:
            return 'B';
        case 3:
            return 'C';
        case 4:
            return 'C#';
        case 5:
            return 'D';
        case 6:
            return 'D#';
        case 7:
            return 'E';
        case 8:
            return 'F';
        case 9:
            return 'F#';
        case 10:
            return 'G';
        case 11:
            return 'G#'
    }
    return 'A';
}


function fft(amplitudes, inverse) {
    const n = amplitudes.length;
    if (n == 1) {
        return; 
    }

    let even = [];
    let odd = [];
    even.length = n/2;
    odd.length = n/2;
    
    for (let i = 0; 2*i < n; i++) {
        even[i] = amplitudes[2*i];
        odd[i] = amplitudes[2*i+1];
    }

    fft(even, inverse);
    fft(odd, inverse);

    let angle = 2 * Math.PI / n * (inverse ? -1 : 1);
    let w = new Complex(1, 0);
    let step = new Complex(Math.cos(angle), Math.sin(angle));
    for (let i = 0; 2 * i < n; i++) {
        amplitudes[i] = even[i].add(w.multiply(odd[i]));
        amplitudes[i + n/2] = even[i].subtract(w.multiply(odd[i])); 
        
        if (inverse) {
            amplitudes[i] = amplitudes[i].realDivide(2);
            amplitudes[i + n/2] = amplitudes[i + n/2].realDivide(2);
        }

        w = w.multiply(step);
    }

}

function playCapturedAudio() {
    let fftData = [];
    fftData.length = capturedFrequencyData.length;
    for (let i = 0; i < fftData.length; i++) {
        fftData[i] = new Complex(capturedFrequencyData[i].real, capturedFrequencyData[i].imaginary);
    }
    fft(fftData, true);
    const timeDomain = new Float32Array(fftData.length);

    for (let i = 0; i < timeDomain.length; i++) {
        timeDomain[i] = fftData[i].real;
    }

    const audioBuffer = audioContext.createBuffer(1, timeDomain.length, audioContext.sampleRate);
    audioBuffer.copyToChannel(timeDomain, 0);
    const source = audioContext.createBufferSource();
    source.connect(audioContext.destination);
    source.buffer = audioBuffer;
    source.start();
}

function drawCapturedData() {
    function draw() {
        const WIDTH = editor.width;
        const HEIGHT = editor.height;
        requestAnimationFrame(draw);

        captureCanvas.fillStyle = 'rgb(255, 255, 255)';
        captureCanvas.fillRect(0, 0, WIDTH, HEIGHT);
        captureCanvas.lineWidth = 1;
        captureCanvas.strokeStyle = 'rgb(0, 0, 0)';
        captureCanvas.beginPath();
        
        let increment = WIDTH*1.0 / (capturedFrequencyData.length);
        let x = 0;

        for (let i = 0; i < (capturedFrequencyData.length); i++) {
            let real = capturedFrequencyData[i].real;
            let imaginary = capturedFrequencyData[i].imaginary;
            let magnitude = Math.sqrt(real*real+imaginary*imaginary);
            let y = -magnitude + HEIGHT;
            if (i === 0) {
                captureCanvas.moveTo(x, y);
            }
            else {
                captureCanvas.lineTo(x, y);
            }

            x += increment;
        }

        captureCanvas.lineTo(WIDTH, HEIGHT);
        captureCanvas.stroke();
        let content = 'from -- to';
        if (index.value && Math.round(index.value) < capturedFrequencyData.length) {
            let value = capturedFrequencyData[Math.round(index.value)];
            let magnitude = value.magnitude();
            content = 'from ' + Math.round(magnitude) + ' to';
        }
        current.textContent = content;
    }

    draw();

}

function drawFrequencyData(stream) {
    console.log(stream instanceof MediaStream);
    if (!audioContext) {
        audioContext = new AudioContext();
    }

    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 32768;
    const bufferLength = analyser.frequencyBinCount;
    const timeDomainData = new Float32Array(bufferLength);
    frequencyData.length = bufferLength;
    
    source.connect(analyser);

    function draw() {
        const WIDTH = visualizer.width;
        const HEIGHT = visualizer.height;
        requestAnimationFrame(draw);

        analyser.getFloatTimeDomainData(timeDomainData);
        for (let i = 0; i < bufferLength; i++) {
            frequencyData[i] = new Complex(timeDomainData[i], 0);
        }
        fft(frequencyData, false);

        frequencyCanvas.fillStyle = 'rgb(255, 255, 255)';
        frequencyCanvas.fillRect(0, 0, WIDTH, HEIGHT);

        frequencyCanvas.lineWidth = 1;
        frequencyCanvas.strokeStyle = 'rgb(0, 0, 0)';

        frequencyCanvas.beginPath();

        let increment = WIDTH * 1.0 / (bufferLength);
        let x = 0;
        
        let maxMagnitude = 0;
        let maxFrequency = 0;

        for (let i = 0; i < (bufferLength); i++) {
            let magnitude = frequencyData[i].magnitude();
            let y = -magnitude + HEIGHT;
            if (magnitude > maxMagnitude) {
                maxMagnitude = magnitude;
                maxFrequency = i;
            }
            if (i === 0) {
                frequencyCanvas.moveTo(x, y);
            }
            else {
                frequencyCanvas.lineTo(x, y);
            }

            x += increment;
        }


        frequencyCanvas.lineTo(WIDTH, HEIGHT);
        frequencyCanvas.stroke();
        let realFrequency = Math.round(maxFrequency*(audioContext.sampleRate/(analyser.fftSize/2)));
        note.textContent = realFrequency;
        noteName.textContent = frequencyToNote(realFrequency);
    }

    draw();

}




