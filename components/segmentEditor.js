import { useState } from "react";
import RecordingCanvas from "./recordingCanvas";

export function SegmentEditor() {
	const [notes, setNotes] = useState([]);

	return (
		<>
			<button onClick={() => setNotes([...notes].concat("A"))}>Add Note</button>
			<RecordingCanvas />
		</>
	)
}