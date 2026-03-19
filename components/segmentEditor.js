import { useState, useCallback, useEffect } from "react";
import ClipDisplay from "./clipDisplay";
import ResizableComponent from "./resizable";
import styles from '../styles/editor.module.css';

/*
	scale is the scale factor to transform screen coordinates to time coordinates
*/
export function SegmentEditor({ width, height, rulerSettings, quantize, scale, segment, updateSegment, closeEditor }) {
	// index A0 as 0, default C3
	const [range, setRange] = useState(segment.range || { min: 27, size: 24 });
	const [noteData, setNoteData] = useState(segment.noteData || []);

	const BAND_HEIGHT = 30;
	const INITIAL_SEGMENT_WIDTH = 50;

	const NOTES = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"]

	useEffect(() => {
		updateSegment(segment.id, null, segment.stop - segment.start, noteData, null, range);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [noteData, range])

	function getRangeAsArray() {
		let arr = [];
		console.assert(typeof range.min == "number" && typeof range.size == "number");
		for (let i = range.min; i <= range.min + range.size; i++) {
			arr.push(indexToNote(i));
		}
		return arr;
	}

	function indexToNote(idx) {
		let note = NOTES[idx % 12];
		let octave = Math.floor((idx + 9) / 12); // indexed from A0, C1 corresponds to range.min of 3, so add 9
		return note + octave;
	}

	function addNote(initialPos) {
        let snappedY = Math.floor(initialPos.y / BAND_HEIGHT) * BAND_HEIGHT;
        let snappedX = Math.floor(initialPos.x / quantize) * quantize;
		setNoteData(prev => [...prev, { id: Date.now(), x: snappedX, y: snappedY, w: INITIAL_SEGMENT_WIDTH }]);
	}

	const updateNoteData = useCallback((id, pos, width) => {
		setNoteData(prev => {
			const noteIndex = prev.findIndex(x => x.id == id);
			console.assert(noteIndex != -1);

			const newData = [...prev];
			newData[noteIndex] = { id: id, x: pos.x, y: pos.y, w: width };
			return newData;
		})
	}, []);

	function yCoordToNote(y) {
		return getRangeAsArray()[y / BAND_HEIGHT];
	}

	// steps from C: A is 9 steps above C, A# is 10, B is 11, etc.
	const STEPS = [9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8]

	function noteToStepsFromC0(note) {
		let idx = NOTES.indexOf(note.substring(0, note.length - 1));
		let steps = STEPS[idx];
		let octaveSteps = parseInt(note.charAt(note.length - 1)) * 12;
		return octaveSteps + steps;
	}

	function widthToDuration(w) {
		return w / scale;
	}

	function noteToComponent(note) {
		return <ResizableComponent
			key={note.id}
			id={note.id}
			initialWidth={note.w}
			height={BAND_HEIGHT}
			gridX={quantize}
			initialPos={{ x: note.x, y: note.y }}
			setData={updateNoteData}
		/>
	}

	async function createAudioFile() {
		noteData.sort((obj1, obj2) => obj1.x - obj2.x);
		let notes = noteData.map(obj => yCoordToNote(obj.y));
		console.log(notes);
		let startTimes = noteData.map(obj => widthToDuration(obj.x));
		let durations = noteData.map(obj => widthToDuration(obj.w));
		let steps = notes.map(note => noteToStepsFromC0(note));

		// zips elements of steps, startTimes, and durations and flattens
		let interleaved = steps.flatMap((item, idx) => [item, startTimes[idx], durations[idx]]);
		console.log(interleaved);

		let segmentID = segment.id;
		console.log(`segment${segmentID}.wav`);

		const response = await fetch("http://localhost:3000/api/synth", {
			method: "POST",
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ notes: interleaved, fileName: `segment${segmentID}.wav` })
		});

		let totalDuration = 0;
		for (let i = 0; i < durations.length; i++) {
			let end = startTimes[i] + durations[i];
			if (end > totalDuration) totalDuration = end;
		}

		if (response.ok) {
			console.log("Created audio from editor");
			const blob = await response.blob();
			const data = await blob.arrayBuffer();
			const dataString = Buffer.from(data).toString("base64");

			const uploadRes = await fetch("http://localhost:3000/api/upload", {
				method: "POST",
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ fileName: `segment${segmentID}`, buffer: dataString })
			});

			if (uploadRes.ok) {
				updateSegment(segmentID, blob, totalDuration, noteData, `./public/audio/segment${segmentID}.wav`, range);
				closeEditor();
			} else {
				console.error("Failed to upload generated segment to public folder");
			}
		} else {
			console.error("Failed to generate audio via synth endpoint");
		}
	}

	return (
		<>
			<div className={styles.segmentEditorControls}>
				<label>
					Range Min
					<input type="range" min="0" max="51" defaultValue="27" onChange={e => setRange({ min: parseInt(e.target.value), size: range.size })}></input>
					<span style={{color: 'var(--daw-text)', fontWeight: 'bold'}}>{range.min}</span>
				</label>
				
				<div className={styles.transportDivider}></div>

				<label>
					Range Size
					<input type="range" min="12" max="36" defaultValue="24" onChange={e => setRange({ min: range.min, size: parseInt(e.target.value) })}></input>
					<span style={{color: 'var(--daw-text)', fontWeight: 'bold'}}>{range.size}</span>
				</label>

				<div style={{flex: 1}}></div>

				<button onClick={createAudioFile} style={{color: 'var(--daw-accent-green)'}}>Synthesize Audio</button>
				<button onClick={closeEditor}>Close</button>
			</div>

			<ClipDisplay components={noteData.map((note) => noteToComponent(note))} width={width} height={height} rulerSettings={rulerSettings} type={"segmentEditor"} range={getRangeAsArray()} addNote={addNote} />
		</>
	)
}