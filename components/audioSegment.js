import { useRef, useState, useEffect } from 'react';
import AudioCanvas from "./audioCanvas";
import styles from "../styles/editor.module.css";
import useDraggable from "../hooks/useDraggable.js";

export class AudioSegment {

	constructor(id, data, start, stop, track, slice, filePath) {
		this.id = id;
		this.data = data; // blob object
		this.start = start;
		this.stop = stop;
		this.track = track;
		this.slice = slice; // position to start playback
		this.filePath = filePath;
		this.noteData = [];
		this.range = { min: 27, size: 24 };
	}

	async play(ctx, delay=0, offset=0, scheduleStart=0) {
		if (!this.data) return;
		console.log(this.data);
		let arrayBuffer = await this.data.arrayBuffer();
		let buffer = await ctx.decodeAudioData(arrayBuffer);
		const source = ctx.createBufferSource();
		source.buffer = buffer;
		source.connect(ctx.destination);
		source.start(scheduleStart + delay, offset + this.slice, Math.max(0, this.stop - this.start - offset));
		this.source = source;
	}
	
	copy() {
		let newSeg = new AudioSegment(this.id, this.data, this.start, this.stop, this.track, this.slice, this.filePath);
		newSeg.noteData = [...this.noteData];
		newSeg.range = { ...this.range };
		return newSeg;
	}

	// split segment "cosmetically" without mutating audio data
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

export function AudioSegmentComponent({ ctx, audioSegment, size, quantize, select, selected, processing, openEditor }) {
	// triggers audiosegment's visual position update when dragging takes place
	const updateFunction = (pos) => {if (pos.x >= 0) audioSegment.setX(pos.x / size)};
	const {dragging, ref, pos, setPos} = useDraggable({x: quantize, y: 1}, "x", {x: audioSegment.start * size, y: 0}, updateFunction, {x: 0, y: 0}, true)
	const color = selected ? "rgb(0, 136, 34)" :  "rgb(0, 228, 57)";

	return (
		<>
			<button ref={ref} onClick={() => {select(audioSegment)}} onDoubleClick={() => {if(openEditor) openEditor(audioSegment)}} className={styles.audioSegment} style={{backgroundColor: color, position: "absolute", padding: "0px", left: audioSegment.start * size, width: `${(audioSegment.stop - audioSegment.start) * size}px`}}>
				{processing ? "Processing..." : `${(audioSegment.stop - audioSegment.start).toFixed(1)} seconds`}
			</button>
		</>
	)
}