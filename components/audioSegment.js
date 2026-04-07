import { useRef, useState, useEffect } from 'react';
import styles from "../styles/editor.module.css";
import useDraggable from "../hooks/useDraggable.js";
import * as Tone from 'tone';
import { BAND_HEIGHT, getRangeAsArray } from '../utils/notes';

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
		this.noteTimeouts = [];
	}

	// Attempts to play the content of this AudioSegment starting at `timeStamp` seconds into 
	// the composition. `playbackStartTime` represents the internal time of the Tone.js context's
	// clock when playback is initiated.
	async play(ctx, timeStamp, playbackStartClockTime, sampler = null, volumeNode = null) {
		this.sampler = sampler;

		// `delay` represents amount of time until playback of AudioSegment is scheduled to start
		// `offset` represents how far into the AudioSegment playback is scheduled to start
		// Only one is relevant for any given playback attempt.
		const delay = Math.max(0, this.start - timeStamp);
		const offset = Math.max(0, timeStamp - this.start);

		// noteData is nonempty when the AudioSegment corresponds to a MIDI audio track, 
		// otherwise the segment corresponds to recorded audio
		if (this.noteData && this.noteData.length > 0) {
			// Use PolySynth by default when sampler is not provided
			if (!sampler && !this.synth) {
				this.synth = new Tone.PolySynth(Tone.Synth);
				if (volumeNode) {
					this.synth.connect(volumeNode);
				} else {
					this.synth.toDestination();
				}
			}

			const segmentStartTime = playbackStartClockTime + delay;
			const rangeArray = getRangeAsArray(this.range);
			this.noteData.forEach(note => {
				const noteName = rangeArray[Math.floor(note.y / BAND_HEIGHT)];
				const noteStartTime = note.x;
				const noteDuration = note.w;

				if (!(noteStartTime + noteDuration <= offset)) {
					let noteScheduleTime = segmentStartTime + Math.max(0, noteStartTime - offset);
					let playDuration = noteDuration;

					if (noteStartTime < offset) {
						playDuration = noteDuration - (offset - noteStartTime);
					}

					let timeUntilNotePlayback = Math.max(0, noteScheduleTime - Tone.context.currentTime);

					// Schedule note to be played back after `timeUntilNotePlayback` seconds. ID is used for clearTimeout
					// to stop playback.
					let timeoutId = Tone.context.setTimeout(() => {
						if (this.sampler) {
							this.sampler.triggerAttackRelease(noteName, playDuration, Tone.context.currentTime);
						} else {
							this.synth.triggerAttackRelease(noteName, playDuration, Tone.context.currentTime);
						}
					}, timeUntilNotePlayback);
					this.noteTimeouts.push(timeoutId);
				}
			});
		} else if (this.data) {
			let arrayBuffer = await this.data.arrayBuffer();
			let buffer = await ctx.decodeAudioData(arrayBuffer);
			const source = ctx.createBufferSource();
			source.buffer = buffer;
			if (volumeNode) {
				Tone.connect(source, volumeNode);
			} else {
				source.connect(ctx.destination);
			}
			const duration = Math.max(0, this.stop - this.start - offset);
			source.start(playbackStartClockTime + delay, offset + this.slice, duration);
			this.source = source;
		}
	}

	// Return a deep copy of this AudioSegment
	copy() {
		let newSeg = new AudioSegment(this.id, this.data, this.start, this.stop, this.track, this.slice, this.filePath);
		newSeg.noteData = [...this.noteData];
		newSeg.range = { ...this.range };
		return newSeg;
	}

	// Returns two AudioSegmetns created by splitting this AudioSegment at 
	// `splitTime` seconds relative to its start time.
	// For MIDI segments, `noteData` is split across the two new segments.
	// For recorded audio, the split manifests as a modification of the AudioSegment's slice attribute,
	// which dictates how far into `data` playback will begin. The actual audio data
	// is not modified for performance reasons.
	split(splitTime, nextID) {
		let leftData = [];
		let rightData = [];
		for (let note of this.noteData) {
			if (note.x + note.w <= splitTime) {
				leftData.push(note);
			} else if (note.x >= splitTime) {
				rightData.push({ ...note, x: note.x - splitTime });
			} else {
				leftData.push({ ...note, w: splitTime - note.x });
				rightData.push({ ...note, x: 0, w: note.x + note.w - splitTime });
			}
		}

		let left = new AudioSegment(nextID, this.data, this.start, this.start + splitTime, this.track, this.slice, this.filePath, leftData, this.range);
		let right = new AudioSegment(nextID + 1, this.data, this.start + splitTime, this.stop, this.track, this.slice + splitTime, this.filePath, rightData, this.range);
		return [left, right];
	}

	setStart(newStart) {
		let duration = this.stop - this.start;
		this.start = newStart;
		this.stop = this.start + duration;
	}

	// Stops all current and future scheduled audio. For recorded audio, 
	// simply invokes AudioBufferSourceNode.stop(). For MIDI audio,
	// releases all currently playing notes and clears timeouts that
	// are scheduled to trigger in the future.
	stopAudio() {
		if (this.source) {
			try {
				this.source.stop();
				this.source = null;
			} catch (e) {
				// Ignore if the source was already stopped or not started
			}
		}
		if (this.synth) {
			this.synth.releaseAll();
		}
		if (this.noteTimeouts) {
			this.noteTimeouts.forEach(id => Tone.context.clearTimeout(id));
			this.noteTimeouts = [];
		}
		if (this.sampler) {
			this.sampler.releaseAll();
		}
	}
}

// Wraps an instance of AudioSegment as a JSX component. `scale` represents a scale factor used to convert between
// position on screen (in pixels) and time relative to start of composition (in seconds).
export function AudioSegmentComponent({ ctx, audioSegment, quantize, onSelect, selected, isBeingProcessed, openEditor, scale }) {
	const [waveformData, setWaveformData] = useState(null);

	// Triggers the AudioSegment's visual position update when dragging takes place
	const updateFunction = (pos) => { if (pos.x >= 0) audioSegment.setStart(pos.x / scale) };
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
				onClick={() => { onSelect(audioSegment) }}
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
						const duration = audioSegment.stop - audioSegment.start;
						if (duration === 0) return null;
						return (
							<div style={{ position: 'relative', width: '100%', height: '100%', opacity: 0.6 }}>
								{audioSegment.noteData.map(note => {
									const left = (note.x / duration) * 100;
									const width = (note.w / duration) * 100;
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
					{isBeingProcessed ? "..." : ""}
				</span>
			</button>
		</>
	)
}