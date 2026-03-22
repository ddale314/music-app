import { useRef, useState, useEffect } from 'react';
import styles from "../styles/editor.module.css";
import useDraggable from "../hooks/useDraggable.js";

export class AudioSegment {

	constructor(id, data, start, stop, track, slice, filePath, noteData = [], range = { min: 27, size: 24 }) {
		this.id = id;
		this.data = data; // blob object
		this.start = start;
		this.stop = stop;
		this.track = track;
		this.slice = slice; // position to start playback
		this.filePath = filePath;
		this.noteData = noteData;
		this.range = range;
	}

	async play(ctx, delay = 0, offset = 0, scheduleStart = 0) {
		if (!this.data) return;

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
	split(pos, nextID, scale) {
		let splitPixel = pos * scale;
		let leftData = [];
		let rightData = [];
		for (let note of this.noteData) {
			if (note.x + note.w <= splitPixel) {
				leftData.push(note);
			} else if (note.x >= splitPixel) {
				rightData.push({ ...note, x: note.x - splitPixel });
			} else {
				leftData.push({ ...note, w: splitPixel - note.x });
				rightData.push({ ...note, x: 0, w: note.x + note.w - splitPixel });
			}
		}

		let left = new AudioSegment(nextID, this.data, this.start, this.start + pos, this.track, this.slice, this.filePath, leftData);
		let right = new AudioSegment(nextID + 1, this.data, this.start + pos, this.stop, this.track, this.slice + pos, this.filePath, rightData);
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

export function AudioSegmentComponent({ ctx, audioSegment, quantize, select, selected, processing, openEditor, scale }) {
	const [waveformData, setWaveformData] = useState(null);

	// triggers audiosegment's visual position update when dragging takes place
	const updateFunction = (pos) => { if (pos.x >= 0) audioSegment.setX(pos.x / scale) };
	const { dragging, ref, pos, setPos } = useDraggable({ x: quantize, y: 1 }, "x", { x: audioSegment.start * scale, y: 0 }, updateFunction, { x: 0, y: 0 }, true)

	useEffect(() => {
		if (!dragging) {
			setPos({ x: audioSegment.start * scale, y: 0 });
		}
	}, [scale, audioSegment.start, dragging, setPos]);

	const bgGradient = selected
		? "linear-gradient(180deg, var(--daw-accent-green-dark) 0%, #1a632b 100%)"
		: "linear-gradient(180deg, var(--daw-accent-green) 0%, var(--daw-accent-green-dark) 100%)";

	const borderColor = selected ? "#ffffff" : "var(--daw-bg-darkest)";

	useEffect(() => {
		let active = true;
		if (audioSegment.data && (!audioSegment.noteData || audioSegment.noteData.length === 0)) {
			audioSegment.data.arrayBuffer().then(buffer => {
				return ctx.decodeAudioData(buffer);
			}).then(audioBuffer => {
				if (!active) return;
				console.log(audioSegment.start, audioSegment.slice, audioSegment.stop);
				const channelData = audioBuffer.getChannelData(0).slice(audioSegment.slice * ctx.sampleRate, (audioSegment.slice + audioSegment.stop - audioSegment.start) * ctx.sampleRate + 1);

				const step = Math.ceil(channelData.length / 200);
				const downsampled = [];
				for (let i = 0; i < channelData.length; i += step) {
					let max = 0;
					for (let j = 0; j < step && i + j < channelData.length; j++) {
						if (Math.abs(channelData[i + j]) > max) {
							max = Math.abs(channelData[i + j]);
						}
					}
					downsampled.push(max);
				}
				setWaveformData(downsampled);
			}).catch(err => {
				console.error("Error decoding audio data for waveform:", err);
			});
		}
		return () => { active = false; };
	}, [audioSegment.data, ctx, audioSegment.noteData]);

	return (
		<>
			<button
				ref={ref}
				onClick={() => { select(audioSegment) }}
				onDoubleClick={() => { if (openEditor) openEditor(audioSegment) }}
				className={styles.audioSegment}
				style={{
					background: bgGradient,
					position: "absolute",
					padding: 0,
					left: pos.x,
					width: `${(audioSegment.stop - audioSegment.start) * scale}px`,
					border: `1px solid ${borderColor}`,
					boxShadow: selected ? "0 0 8px rgba(255,255,255,0.4)" : "inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.5)",
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'flex-start',
					overflow: 'hidden'
				}}
			>
				{/* Visuals Overlay */}
				<div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
					{audioSegment.noteData && audioSegment.noteData.length > 0 && (() => {
						const maxEnd = Math.max(...audioSegment.noteData.map(n => n.x + n.w));
						if (maxEnd === 0) return null;
						return (
							<div style={{ position: 'relative', width: '100%', height: '100%', opacity: 0.6 }}>
								{audioSegment.noteData.map(note => {
									const left = (note.x / maxEnd) * 100;
									const width = (note.w / maxEnd) * 100;
									const top = ((note.y / 30) / (audioSegment.range.size + 1)) * 100;
									const heightPercent = (1 / (audioSegment.range.size + 1)) * 100;
									return (
										<div key={note.id} style={{
											position: 'absolute',
											left: `${left}%`,
											width: `${width}%`,
											top: `${top}%`,
											height: `${heightPercent}%`,
											backgroundColor: '#ffffff',
											borderRadius: '1px'
										}} />
									);
								})}
							</div>
						);
					})()}

					{(!audioSegment.noteData || audioSegment.noteData.length === 0) && waveformData && (() => {
						const pathData = waveformData.map((val, idx) => {
							const x = (idx / (waveformData.length - 1)) * 100;
							const h = val * 90; // scale to 90% height Max
							return `M ${x} ${50 - h / 2} L ${x} ${50 + h / 2}`;
						}).join(" ");

						return (
							<svg preserveAspectRatio="none" viewBox="0 0 100 100" style={{ width: '100%', height: '100%', opacity: 0.5 }}>
								<path d={pathData} stroke="#ffffff" strokeWidth="1" vectorEffect="non-scaling-stroke" />
							</svg>
						);
					})()}
				</div>

				<span style={{ position: 'relative', zIndex: 1, paddingLeft: '8px', color: '#fff', fontSize: '12px', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
					{processing ? "..." : ""}
				</span>
			</button>
		</>
	)
}