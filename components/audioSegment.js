import { useRef, useState, useEffect } from 'react';
import AudioCanvas from "./audioCanvas";
import styles from "../styles/editor.module.css";

export class AudioSegment {
	constructor(id, data, start, stop, track) {
		this.id = id;
		this.data = data;
		this.start = start;
		this.stop = stop;
		this.track = track;
	}

	async play(ctx, offset=0) {
		let buffer = await ctx.decodeAudioData(await this.data.arrayBuffer());
		const source = ctx.createBufferSource();
		source.buffer = buffer;
		source.connect(ctx.destination);
		source.start(0, offset);
		this.source = source;
	}
	
	stopAudio() {
		if (this.source) {
			this.source.stop();
		}
	}
}

export function AudioSegmentComponent({ ctx, audioSegment, size }) {
	return (
		<>
			<span>
				<button className={styles.audioSegment} style={{padding: "0px", width: `${(audioSegment.stop - audioSegment.start) * size}px`}}>
					{audioSegment.stop - audioSegment.start} seconds
				</button>
			</span>
		</>
	)
}