import React, { useEffect, useRef } from 'react';
import getAudio from '../utils/audio';
const WIDTH = 1000;
const HEIGHT = 1000;

const Canvas = ( {audioData} ) => {
    const canvasRef = useRef(null);
    

    useEffect(() => {
        let audioContext = new AudioContext();
        const stream = getAudio();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser;
        analyser.fftSize = 32768;
        const bufferLength = analyser.frequencyBinCount;
        const frequencyData = new Float32Array(bufferLength);
        analyser.getFloatFrequencyData(frequencyData);

        source.connect(analyser);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgb(255, 255, 255)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgb(0, 0, 0)';
        ctx.beginPath();

        let increment = WIDTH*1.0 / (bufferLength/4);
        let x = 0;

        for (let i = 0; i < (bufferLength/4); i++) {
            let y = -frequencyData[i] + HEIGHT;
            if (i === 0) {
                ctx.moveTo(x, y);
            }
            else {
                ctx.lineTo(x, y);
            }

            x += increment;
        }

        ctx.lineTo(WIDTH, HEIGHT);
        ctx.stroke();

      }, []);

    return (
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT}></canvas>
    );
};

export default Canvas;