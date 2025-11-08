import { useRef, useState, useEffect } from 'react';
import AudioCanvas from "./audioCanvas"

export default function AudioSegment({ url, ctx, mousePos }) {
	const [audioBuffer, setBuffer] = useState(null);
	const [audioData, setData] = useState(null);
	const [pos, setPos] = useState( {x: 0, y: 0} );
	const [dragging, setDragStatus] = useState(false);

	useEffect(() => {
		async function getAudio() {
			const response = await fetch(url);
			let buffer = await ctx.decodeAudioData(await response.arrayBuffer());
			setBuffer(buffer);
			setData(buffer.getChannelData(0));
		}
		getAudio();
	}, [url, ctx]);

	function play() {
		const source = ctx.createBufferSource();
		source.buffer = audioBuffer;
		source.connect(ctx.destination);
		source.start();
	}


	function onMouseDown() {
		setDragStatus(true);
	}
	
	function onMouseUp() {
		setDragStatus(false);
	}

	function onMouseMove() {
		if (dragging) {
			setPos( {x: mousePos.x, y: mousePos.y} );
		}
	}

	return (
		<>
			{console.log(pos.x, pos.y)}
			<button onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseMove={onMouseMove} onClick={play} style={{position: "relative", left: pos.x, top: pos.y}}>Play Audio: {audioBuffer ? audioBuffer.duration.toFixed(1) : ""} seconds</button>
			{/*<AudioCanvas type='dynamic' width={1000} height={100} data={audioBuffer ? audioBuffer.getChannelData(0) : null}/>*/}
		</>
		
		//<audio controls={true} src={url}></audio>
	)
}