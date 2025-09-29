import React, { useRef, useState, useEffect, useCallback } from 'react';

let mediaStream;
let audioContext;
let analyser;
let timeDomainData;
let frequencyData = [];
let fftSize = 8192;
let bufferLength = fftSize/2;

export default function RecordingCanvas({ width, height }) {
    const canvasRef = useRef(null);
    const [context, setContext] = useState(null);

    useEffect(() => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            setContext(ctx);
        }
    }, []);

    const draw = useCallback(() => {
        if (mediaStream) {
            if (!audioContext) {
                audioContext = new AudioContext();
            }
            if (!analyser) {
                const source = audioContext.createMediaStreamSource(mediaStream);
                analyser = audioContext.createAnalyser();
                analyser.fftSize = fftSize;
                source.connect(analyser);
                timeDomainData = new Float32Array(bufferLength);
            }
            
            analyser.getFloatTimeDomainData(timeDomainData);
            for (let i = 0; i < bufferLength; i++) {
                frequencyData[i] = new Complex(timeDomainData[i], 0);
            }
            fft(frequencyData, false);

            context.fillStyle = 'rgb(255, 255, 255)';
            context.fillRect(0, 0, width, height);

            context.lineWidth = 3;
            context.strokeStyle = 'rgb(100, 150, 255)';

            context.beginPath();

            let increment = width * 1.0 / (bufferLength / 4);
            let x = 0;

            for (let i = 0; i < (bufferLength / 4); i++) {
                let y = -frequencyData[i].magnitude()+height;
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
    }, [context, height, width]);

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