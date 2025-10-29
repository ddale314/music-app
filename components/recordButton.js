import { useState } from "react";
import { startRecording, stopRecording } from "../components/audioCanvas"

export default function RecordButton( {width, height} ) {
	const [recordStatus, setRecordStatus] = useState(false);
	const [image, setImage] = useState("url('/images/record.jpg')");

	function onClick() {
		if (recordStatus == false) {
			setImage("url('/images/stop.jpg')");
			setRecordStatus(true);
			startRecording();
		}
		else {
			setImage("url('/images/record.jpg')");
			setRecordStatus(false);
			stopRecording();
		}
	}
	return (
		<button onClick={onClick} style={{width :`${width}px`, height : `${height}px`, backgroundImage: image, backgroundSize : "cover"}}></button>
	);
}