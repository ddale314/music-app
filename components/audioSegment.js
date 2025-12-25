import { useRef, useState, useEffect } from 'react';
import AudioCanvas from "./audioCanvas";
import styles from "../styles/editor.module.css";
import useDraggable from "../hooks/useDraggable.js";

export class AudioSegment {
	constructor(id, data, start, stop, track, slice, filePath) {
		this.id = id;
		this.data = data;
		this.start = start;
		this.stop = stop;
		this.track = track;
		this.slice = slice;
		this.filePath = filePath;
	}

	async play(ctx, offset=0) {
		console.log(this.data);
		let arrayBuffer = await this.data.arrayBuffer();
		let buffer = await ctx.decodeAudioData(arrayBuffer);
		const source = ctx.createBufferSource();
		source.buffer = buffer;
		source.connect(ctx.destination);
		source.start(0, offset + this.slice, this.stop - this.start);
		this.source = source;
	}
	
	copy() {
		return new AudioSegment(this.id, this.data, this.start, this.stop, this.track, this.slice, this.filePath);
	}

	split(pos, nextID) {
		let left = new AudioSegment(nextID, this.data, this.start, this.start + pos, this.track, 0, this.filePath);
		let right = new AudioSegment(nextID + 1, this.data, this.start + pos, this.stop, this.track, pos, this.filePath);
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

export function AudioSegmentComponent({ ctx, audioSegment, size, quantize, select, selected }) {
	const updateFunction = (pos) => {if (pos.x >= 0) audioSegment.setX(pos.x / size)};
	const {dragging, ref, pos} = useDraggable({x: quantize, y: 1}, "x", {x: audioSegment.start * size, y: 0}, updateFunction, {x: 0, y: 0}, true)
	const color = selected ? "rgb(0, 136, 34)" :  "rgb(0, 228, 57)";

	return (
		<>
			<button ref={ref} onClick={() => {select(audioSegment)}} className={styles.audioSegment} style={{backgroundColor: color, position: "absolute", padding: "0px", left: audioSegment.start * size, width: `${(audioSegment.stop - audioSegment.start) * size}px`}}>
				{(audioSegment.stop - audioSegment.start).toFixed(1)} seconds
			</button>
		</>
	)
}