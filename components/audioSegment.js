import { useRef, useState, useEffect } from 'react';
import AudioCanvas from "./audioCanvas";
import styles from "../styles/track.module.css";

export default function AudioSegment({ audio, ctx, start, stop, track }) {
	const [audioBuffer, setBuffer] = useState(null);
	const [audioData, setData] = useState(null);
	const [pos, setPos] = useState( {x: 0, y: 0} );
	const [dragging, setDragStatus] = useState(false);

	useEffect(() => {
		async function getAudio() {
			let buffer = await ctx.decodeAudioData(await audio.arrayBuffer());
			setBuffer(buffer);
			setData(buffer.getChannelData(0));
		}
		getAudio();
	}, [ctx]);

	function play() {
		const source = ctx.createBufferSource();
		source.buffer = audioBuffer;
		source.connect(ctx.destination);
		source.start();
	}
	
	return (
		<>
			<div>
				<button className={styles.audioSegment} onClick={play} style={{width: `${(audioBuffer ? audioBuffer.duration.toFixed(1) : 1)*100}px`}}>
					{audioBuffer ? audioBuffer.duration.toFixed(1) : ""} seconds
				</button>
			</div>
		</>
	)
}