import { useRef, useState, useEffect } from 'react';
import AudioCanvas from "./audioCanvas";
import styles from "../styles/editor.module.css";
import useDraggable from "../hooks/useDraggable.js";

export class AudioSegment {
	constructor(id, data, start, stop, track, slice=0) {
		this.id = id;
		this.data = data;
		this.start = start;
		this.stop = stop;
		this.track = track;
		this.slice = slice;
	}

	async play(ctx, offset=0) {
		console.log(this.data);
		let arrayBuffer = await this.data.arrayBuffer();
		console.log(arrayBuffer);
		let buffer = await ctx.decodeAudioData(arrayBuffer);
		const source = ctx.createBufferSource();
		source.buffer = buffer;
		source.connect(ctx.destination);
		source.start(0, offset + this.slice, this.stop - this.start);
		this.source = source;
	}

	split(pos, nextID) {
		let splitPos = (pos / (this.stop - this.start)) * this.data.size;
		// this doesnt work because there is a file header that will get cut off
		let left = new AudioSegment(nextID, this.data, this.start, this.start + pos, this.track);
		let right = new AudioSegment(nextID + 1, this.data, this.start + pos, this.stop, this.track, pos);
		return [left, right];
	}

	setX(newX) {
		let duration = this.stop - this.start;
		this.start = newX;
		this.stop = this.start + duration;
	}
	
	stopAudio() {
		if (this.source) {
			this.source.stop();
		}
	}
}

export function AudioSegmentComponent({ ctx, audioSegment, size }) {
	const updateFunction = (pos) => audioSegment.setX(pos.x / size);
	const {dragging, ref, pos} = useDraggable({x: 50, y: 50}, "x", {x: audioSegment.start * size, y: -1}, updateFunction)

	return (
		<>
			<button ref={ref} className={styles.audioSegment} style={{position: "absolute", padding: "0px", left: pos.x, width: `${(audioSegment.stop - audioSegment.start) * size}px`}}>
				{(audioSegment.stop - audioSegment.start).toFixed(1)} seconds
			</button>
		</>
	)
}