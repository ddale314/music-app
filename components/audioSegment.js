import { useRef, useState, useEffect } from 'react';
import AudioCanvas from "./audioCanvas";
import styles from "../styles/editor.module.css";

export default function AudioSegment({ audio, ctx, start, stop, track, size }) {
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
			<span>
				<button className={styles.audioSegment} onClick={play} style={{padding: "0px", width: `${(audioBuffer ? audioBuffer.duration.toFixed(1) : 1)*size}px`}}>
					{audioBuffer ? audioBuffer.duration.toFixed(1) : ""} seconds
				</button>
			</span>
		</>
	)
}