import React, { createRef } from 'react';

let audioContext;
let WIDTH = 1000;
let HEIGHT = 1000;


export function drawFrequencyData(stream, ctx) {
    if (!audioContext) {
        audioContext = new AudioContext();
    }
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 32768;
    const bufferLength = analyser.frequencyBinCount;
    const frequencyData = new Float32Array(bufferLength);
    analyser.getFloatFrequencyData(frequencyData);
    source.connect(analyser);

    draw(frequencyData, ctx, bufferLength);
}

function draw(data, ctx, bufferLength) {
    console.log("ran draw");
    requestAnimationFrame(draw);
    console.log("started: " + ctx);
    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgb(0, 0, 0)';

    ctx.beginPath();

    let increment = WIDTH*1.0 / (bufferLength/4);
    let x = 0;

    for (let i = 0; i < (bufferLength/4); i++) {
        let y = -data[i] + HEIGHT;
        if (i === 0) {
            ctx.moveTo(x, y);
        }
        else {
            ctx.lineTo(x, y);
        }
        
        x += increment;
    }
}