import { useRef, useState, useEffect } from 'react';
import AudioCanvas from "./audioCanvas"

export default function AudioSegment({ url, ctx }) {
	const [audioBuffer, setBuffer] = useState(null);
	const [audioData, setData] = useState(null);

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

	return (
		<>
			<button onClick={play}>Play Audio: {audioBuffer ? audioBuffer.duration.toFixed(1) : ""} seconds</button>
			{console.log(audioData ? audioData : null)}
			{/*<AudioCanvas type='dynamic' width={1000} height={100} data={audioBuffer ? audioBuffer.getChannelData(0) : null}/>*/}
		</>
		
		//<audio controls={true} src={url}></audio>
	)
}