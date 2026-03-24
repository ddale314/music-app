import { useState, useCallback, useEffect } from "react";
import ClipDisplay from "./clipDisplay";
import ResizableComponent from "./resizable";
import styles from '../styles/editor.module.css';
import { BAND_HEIGHT, getRangeAsArray } from '../utils/notes';

/*
	scale is the scale factor to transform screen coordinates to time coordinates
*/
export function SegmentEditor({ width, height, rulerSettings, quantize, scale, segment, updateSegment, closeEditor }) {
	// index A0 as 0, default C3
	const [range, setRange] = useState(segment.range || { min: 27, size: 24 });
	const [noteData, setNoteData] = useState(segment.noteData || []);

	const INITIAL_SEGMENT_WIDTH = 50;

	useEffect(() => {
		let totalDuration = segment.stop - segment.start;
		let maxNoteEnd = 0;
		noteData.forEach(n => {
			let end = (n.x + n.w) / scale;
			if (end > maxNoteEnd) maxNoteEnd = end;
		});
		if (maxNoteEnd > totalDuration) totalDuration = maxNoteEnd;

		updateSegment(segment.id, null, totalDuration, noteData, segment.filePath, range);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [noteData, range])



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
		return getRangeAsArray(range)[y / BAND_HEIGHT];
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



	return (
		<>
			<div className={styles.segmentEditorControls}>
				<label>
					Range Min
					<input type="range" min="0" max="51" defaultValue="27" onChange={e => setRange({ min: parseInt(e.target.value), size: range.size })}></input>
					<span style={{ color: 'var(--daw-text)', fontWeight: 'bold' }}>{range.min}</span>
				</label>

				<div className={styles.transportDivider}></div>

				<label>
					Range Size
					<input type="range" min="12" max="36" defaultValue="24" onChange={e => setRange({ min: range.min, size: parseInt(e.target.value) })}></input>
					<span style={{ color: 'var(--daw-text)', fontWeight: 'bold' }}>{range.size}</span>
				</label>

				<div style={{ flex: 1 }}></div>

				<button onClick={closeEditor}>Close</button>
			</div>

			<ClipDisplay components={noteData.map((note) => noteToComponent(note))} width={width} height={height} rulerSettings={rulerSettings} type={"segmentEditor"} range={getRangeAsArray(range)} addNote={addNote} />
		</>
	)
}