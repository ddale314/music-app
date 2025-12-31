export default function WaveformVisualizer({ width, height, data, bufferLength, context, setContext }) {
	const canvasRef = useRef(null);
	const [context, setContext] = useState(null);

	const draw = useCallback(() => {
		context.fillStyle = 'rgb(255, 255, 255)';
		context.fillRect(0, 0, width, height);

		context.lineWidth = 3;
		context.strokeStyle = 'rgb(100, 150, 255)';

		context.beginPath();

		let increment = width * 1.0 / (bufferLength / 4);
		let x = 0;

		for (let i = 0; i < (bufferLength / 4); i++) {
			let magnitude = data[i].magnitude();
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

	return <canvas ref={canvasRef} width={width} height={height}></canvas>;
}