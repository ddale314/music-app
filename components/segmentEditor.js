import { useState, useCallback } from "react";
import ClipDisplay from "./clipDisplay";
import ResizableComponent from "./resizable";

/*
	scale is the scale factor to transform screen coordinates to time coordinates
*/
export function SegmentEditor({ width, height, rulerSettings, quantize, scale }) {
	// index A0 as 0, default C2
	const [range, setRange] = useState({min: 9, size: 14});
	const [noteData, setNoteData] = useState([]);

	const BAND_HEIGHT = 30;
	const INITIAL_SEGMENT_WIDTH = 50;

	function getRangeAsArray() {
		let arr = [];
		console.assert(typeof range.min == "number" && typeof range.size == "number");
		for (let i = range.min; i <= range.min + range.size; i++) {
			arr.push(indexToNote(i));
		}
		return arr;
	}

	function indexToNote(idx) {
		let diff = idx % 7;
		let note = String.fromCharCode(65 + diff); // "A" = 65
		let octave = Math.floor((idx + 5) / 7); // indexed from A0, C1 corresponds to range.min of 2, so add 5
		return note + octave;
	}

	function addNote(initialPos) {
		setNoteData(prev => [...prev, {id: Date.now(), x: initialPos.x, y: initialPos.y, w: INITIAL_SEGMENT_WIDTH}]);
	}

	const updateNoteData = useCallback((id, pos, width) => {
		setNoteData(prev => {
			const noteIndex = prev.findIndex(x => x.id == id);
			console.assert(noteIndex != -1);

			const newData = [...prev];
			newData[noteIndex] = {id: id, x: pos.x, y: pos.y, w: width};
			return newData;
		})
	}, []);

	function yCoordToNote(y) {
		return getRangeAsArray()[y / BAND_HEIGHT];
	}

	// steps from C: A is 9 steps above C, B is 11, etc.
	const STEPS = [9, 11, 0, 2, 4, 5, 7]

	function noteToStepsFromC0(note) {
		let diff = note.charCodeAt(0) - 65; // "A" = 65
		let steps = STEPS[diff];
		let octaveSteps = parseInt(note.charAt(1)) * 12;
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
			initialPos={{x: note.x, y: note.y}}
			setData={updateNoteData}
		/>
	}

	function createAudioFile() {
		console.log(noteData);
		let notes = noteData.map(obj => yCoordToNote(obj.y));
		console.log(notes);
		let durations = noteData.map(obj => widthToDuration(obj.w));
		console.log(durations);
		let steps = notes.map(note => noteToStepsFromC0(note));
		console.log(steps);
		
		// zips elements of steps and durations and flattens the result 1 dimension
		let interleaved = steps.flatMap((item, idx) => [item, durations[idx]]);
		console.log(interleaved);
	}

	return (
		<>
			<br/>
			<label>
				range min
				{/* A0 to C5 */}
				<input type="range" min="0" max="30" defaultValue="9" onChange={e => setRange({min: parseInt(e.target.value), size: range.size})}></input>
				{range.min}
            </label>
			<br/>
			<label>
				range size
				{/* 1 to 3 octaves */}
				<input type="range" min="7" max="21" defaultValue="14" onChange={e => setRange({min: range.min, size: parseInt(e.target.value)})}></input>
				{range.size}
			</label>
			<button onClick={createAudioFile}>Create</button>
			<ClipDisplay components={noteData.map((note) => noteToComponent(note))} width={width} height={height} rulerSettings={rulerSettings} type={"segmentEditor"} range={getRangeAsArray()} addNote={addNote}/>
		</>
	)
}