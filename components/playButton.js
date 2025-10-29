import { useState } from "react";
import { playCapturedAudio } from "../components/audioCanvas"

export default function PlayButton( {width, height} ) {
	const image = "url('/images/profile.jpg')";
	function onClick() {
		playCapturedAudio();
	}
	return (
		<button onClick={onClick} style={{width :`${width}px`, height : `${height}px`, backgroundImage: image, backgroundSize : "cover"}}></button>
	);
}