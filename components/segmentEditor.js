import { useState, useCallback, useEffect } from "react";
import ClipDisplay from "./clipDisplay";
import ResizableComponent from "./resizable";
import styles from '../styles/editor.module.css';
import { BAND_HEIGHT, getRangeAsArray } from '../utils/notes';

// `scale` represents a scale factor used to convert between position on screen (in pixels)
// and time relative to start of composition (in seconds).
export function SegmentEditor({ width, height, rulerSettings, quantize, scale, segment, updateSegment, closeEditor }) {
	// Index A0 as 0, use C3 as default
	const [range, setRange] = useState(segment.range || { min: 27, size: 24 });
	const [noteData, setNoteData] = useState(segment.noteData || []);
	const [selectedNotes, setSelectedNotes] = useState([]);

	const INITIAL_SEGMENT_WIDTH = 50;

	// Update visual length of segment based on position of last note
	useEffect(() => {
		let maxNoteEnd = 0;
		noteData.forEach(n => {
			let end = n.x + n.w;
			if (end > maxNoteEnd) maxNoteEnd = end;
		});

		let totalDuration = segment.stop - segment.start;
		if (noteData.length > 0) {
			totalDuration = maxNoteEnd;
		}

		updateSegment(segment.id, null, totalDuration, noteData, segment.filePath, range);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [noteData, range])

	function addNote(initialPos) {
		let snappedY = Math.floor(initialPos.y / BAND_HEIGHT) * BAND_HEIGHT;
		let snappedX = Math.floor(initialPos.x / quantize) * quantize;
		setNoteData(prev => [...prev, { id: Date.now(), x: snappedX / scale, y: snappedY, w: INITIAL_SEGMENT_WIDTH / scale }]);
	}

	function duplicateNote(targetId) {
		setNoteData(prev => {
			let idsToDuplicate = [targetId];
			if (selectedNotes.includes(targetId)) {
				idsToDuplicate = selectedNotes;
			}

			const notesToDuplicate = prev.filter(n => idsToDuplicate.includes(n.id));
			if (notesToDuplicate.length === 0) return prev;

			const minX = Math.min(...notesToDuplicate.map(n => n.x));
			const maxX = Math.max(...notesToDuplicate.map(n => n.x + n.w));
			const offsetTime = Math.max(0.1, maxX - minX);

			const newNotes = notesToDuplicate.map((original, i) => ({
				id: Date.now() + i, // prevent id collision
				x: original.x + offsetTime,
				y: original.y,
				w: original.w
			}));

			return [...prev, ...newNotes];
		});
	}

	function deleteNote(targetId) {
		let idsToDelete = [targetId];
		if (selectedNotes.includes(targetId)) {
			idsToDelete = selectedNotes;
		}
		setNoteData(prev => prev.filter(n => !idsToDelete.includes(n.id)));
		setSelectedNotes(prev => prev.filter(id => !idsToDelete.includes(id)));
	}

	const updateNoteData = useCallback((id, pos, width) => {
		setNoteData(prev => {
			const noteIndex = prev.findIndex(x => x.id == id);
			if (noteIndex == -1) return prev;

			const original = prev[noteIndex];
			const newX = pos.x / scale;
			const newY = pos.y;
			const newW = width / scale;

			const deltaX = newX - original.x;
			const deltaY = newY - original.y;
			const deltaW = newW - original.w;

			console.log("selected notes:", selectedNotes);
			if (deltaX !== 0 || deltaY !== 0 || deltaW !== 0) {
				if (selectedNotes.includes(id) && deltaW === 0) {
					return prev.map((n, i) => {
						if (i === noteIndex) {
							return { id: id, x: Math.max(0, newX), y: newY, w: newW };
						}
						if (selectedNotes.includes(n.id)) {
							return { ...n, x: Math.max(0, n.x + deltaX), y: n.y + deltaY };
						}
						return n;
					});
				}

				const newData = [...prev];
				newData[noteIndex] = { id: id, x: Math.max(0, newX), y: newY, w: newW };
				return newData;
			}
			return prev;
		})
	}, [scale, selectedNotes]);

	function noteToComponent(note) {
		return <ResizableComponent
			key={note.id}
			id={note.id}
			initialWidth={note.w * scale}
			height={BAND_HEIGHT}
			gridX={quantize}
			initialPos={{ x: note.x * scale, y: note.y }}
			setData={updateNoteData}
			selected={selectedNotes.includes(note.id)}
			onClick={() => {
				if (!selectedNotes.includes(note.id)) {
					setSelectedNotes([note.id]);
				}
			}}
		/>
	}

	// Modifies the `selectedNotes` state based on the notes which are within the selected region
	// defined by `box`.
	function onSelectRegion(box) {
		const filterFunc = note => {
			const noteX = note.x * scale;
			const noteY = note.y;
			const noteW = note.w * scale;
			const noteH = BAND_HEIGHT;
			return (noteX + noteW >= box.x) && (noteX <= box.x + box.w)
				&& (noteY + noteH >= box.y) && (noteY <= box.y + box.h);
		}
		const selected = noteData.filter(filterFunc).map(note => note.id);
		setSelectedNotes(selected);
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

			<ClipDisplay
				components={noteData.map((note) => noteToComponent(note))}
				width={width}
				height={height}
				rulerSettings={rulerSettings}
				type={"segmentEditor"}
				range={getRangeAsArray(range)}
				addNote={addNote}
				duplicateNote={duplicateNote}
				deleteNote={deleteNote}
				onSelectRegion={onSelectRegion}
				onDeselectAll={() => setSelectedNotes([])}
			/>
		</>
	)
}