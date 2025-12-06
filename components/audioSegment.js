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
	const [dragging, setDragging] = useState(false);
	const [x, setX] = useState(0);
	const [relX, setRelX] = useState(0);
	const ref = useRef();

	const gridX = 2;

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
		let newX = Math.trunc((e.pageX - relX) / gridX) * gridX;
		let diff = x - newX;
		setX(newX);
		if (diff + audioSegment.start >= 0) {
			audioSegment.translateX(diff / size);
			setX(x + diff);
		}

		//e.stopPropagation();
		e.preventDefault();
	}

	function handleMouseUp(e) {
		setDragging(false);
		//e.stopPropagation();
		e.preventDefault();
	}
	
	function handleMouseDown(e) {
		let box = ref.current.getBoundingClientRect();
		setRelX(e.pageX - box.left)
		setDragging(true);
		//e.stopPropagation();
		e.preventDefault();
	}

	return (
		<>
			<span ref={ref}>
				<button onMouseMove={handleMouseMove} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} className={styles.audioSegment} style={{position: "absolute", padding: "0px", left: `${audioSegment.start * size}px`, width: `${(audioSegment.stop - audioSegment.start) * size}px`}}>
					{(audioSegment.stop - audioSegment.start).toFixed(1)} seconds
				</button>
			</span>
		</>
	)
}