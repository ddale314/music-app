import { useState } from "react";
import ClipDisplay from "./clipDisplay";

export default function SegmentEditor({ width, height, rulerSettings }) {
	const [notes, setNotes] = useState([]);

	function asComp(note) {
		return <div>{note}</div>
	}

	return (
		<>
			<button onClick={() => setNotes([...notes].concat(["A", "B", "C", "D", "E", "F", "G"][Math.floor(Math.random() * 7)]))}>Add Note</button>
			<ClipDisplay components={notes} width={width} height={height} rulerSettings={rulerSettings} asComp={asComp} type={"segmentEditor"} />
		</>
	)
}