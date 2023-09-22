import React, { useRef, useState, useEffect, useCallback } from 'react';

let mediaStream;
let audioContext;
let analyser;
let WIDTH = 1000, HEIGHT = 1000;

export function setMediaStream(stream) {
    mediaStream = stream;
}

export default function AudioCanvas({ type, width, height }) {
    const canvasRef = useRef(null);
    const [context, setContext] = useState(null);

    const draw = useCallback(() => {

        if (mediaStream) {
            if (!audioContext) {
                audioContext = new AudioContext();
            }
            if (!analyser) {
                const source = audioContext.createMediaStreamSource(mediaStream);
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 2048;
                source.connect(analyser);
            }

            const bufferLength = analyser.frequencyBinCount;
            const frequencyData = new Float32Array(bufferLength);
            analyser.getFloatFrequencyData(frequencyData);

            console.log(frequencyData);
            context.fillStyle = 'rgb(255, 255, 255)';
            context.fillRect(0, 0, WIDTH, HEIGHT);

            context.lineWidth = 1;
            context.strokeStyle = 'rgb(0, 0, 0)';

            context.beginPath();

            let increment = WIDTH * 1.0 / (bufferLength / 4);
            let x = 0;

            for (let i = 0; i < (bufferLength / 4); i++) {
                let y = -frequencyData[i]+HEIGHT/2;
                if (i === 0) {
                    context.moveTo(x, y);
                }
                else {
                    context.lineTo(x, y);
                }

                x += increment;
            }
        }
        context.stroke();
    }, [context]);

    useEffect(() => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            setContext(ctx);
        }
    }, []);

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
        <canvas ref={canvasRef} width={width} height={height}></canvas>
    );
}