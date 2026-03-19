import { useRef, useEffect, useCallback, useState } from "react";

// dataType: complex or float
export default function WaveformVisualizer({ width, height, bufferLength, getData, dataType }) {
	const canvasRef = useRef(null);
	const [context, setContext] = useState(null);

	const draw = useCallback(() => {
		let data = getData();
		if (!data) return;
		
		// DAW Match: dark background
		context.fillStyle = '#222';
		context.fillRect(0, 0, width, height);

		context.lineWidth = 2;
		// DAW Match: green for float (recording), blue for complex (analysis)
		context.strokeStyle = dataType === "float" ? '#34c759' : '#5b9bd5';

		context.beginPath();

		let increment = width * 1.0 / (bufferLength / 4);
		let x = 0;

		for (let i = 0; i < (bufferLength / 4); i++) {
			let magnitude = (dataType == "complex") ? data[i].magnitude() : data[i] * height / 2 + height / 2;
			let y = -magnitude + height;
			if (dataType === "complex") { // scale down for fft visualizations
				y = height - (magnitude * 5); 
			}

			if (i === 0) {
				context.moveTo(x, y);
			}
			else {
				context.lineTo(x, y);
			}
			x += increment;
		}

		context.stroke();
	
	}, [context, height, width, getData, bufferLength, dataType]);

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

	return <canvas ref={canvasRef} width={width} height={height} style={{ border: '1px solid var(--daw-border)', borderRadius: 'var(--daw-radius-sm)', display: 'block' }}></canvas>;
}