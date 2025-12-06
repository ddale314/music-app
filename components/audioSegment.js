import { useRef, useState, useEffect } from 'react';
import AudioCanvas from "./audioCanvas";
import styles from "../styles/editor.module.css";

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

	getX(amount) {
		this.start += amount;
		this.stop += amount;
	}
	
	stopAudio() {
		if (this.source) {
			this.source.stop();
		}
	}
}

export function AudioSegmentComponent({ ctx, audioSegment, size }) {
	const [dragging, setDragging] = useState(false);
	const [relativePos, setRelativePos] = useState(0);
	//const ref = useRef();

	useEffect(() => {
		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [dragging]);

	function handleMouseMove(e) {
		if (!dragging) return;
		
		let newPos = e.pageX - relativePos;
		if (newPos >= 0) {
			audioSegment.translateX(newPos - audioSegment.start);
			setRelativePos(newPos);
		}

		e.stopPropagation();
		e.preventDefault();
	}

	function handleMouseUp(e) {
		setDragging(false);
		e.stopPropagation();
		e.preventDefault();
	}
	
	function handleMouseDown(e) {
		let pos = e.target.getBoundingClientRect();
		setRelativePos(e.pageX - pos.left);
		setDragging(true);
		e.stopPropagation();
		e.preventDefault();
	}

	return (
		<>
			<span>
				<button onMouseMove={handleMouseMove} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} className={styles.audioSegment} style={{position: "absolute", padding: "0px", left: `${audioSegment.start * size}px`, width: `${(audioSegment.stop - audioSegment.start) * size}px`}}>
					{(audioSegment.stop - audioSegment.start).toFixed(1)} seconds
				</button>
			</span>
		</>
	)
}