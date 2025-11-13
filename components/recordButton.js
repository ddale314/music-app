import { useState } from "react";
import { startRecording, stopRecording } from "../components/audioCanvas"

export default function RecordButton( { isRecording, onClick, width, height} ) {
	const [image, setImage] = useState("url('/images/record.jpg')");

	function handleClick() {
		if (isRecording) {
			setImage("url('/images/record.jpg')");
		}
		else {
			setImage("url('/images/stop.jpg')");
		}
		onClick();
	}
	return (
		<button onClick={handleClick} style={{width :`${width}px`, height : `${height}px`, backgroundImage: image, backgroundSize : "cover"}}></button>
	);
}