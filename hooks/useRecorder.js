import { useState, useRef } from 'react'

const fftSize = 8192;

export default function useRecorder(onRecordingComplete=null) {
	const [isRecording, setIsRecording] = useState(false);
	const [start, setStart] = useState(0);

	const mediaStreamRef = useRef(null);
	const audioContextRef = useRef(null);
	const mediaRecorderRef = useRef(null);

	const analyserNodeRef = useRef(null);
	
	const recordedData = useRef([]);

	const startRecording = async () => {
		try {
			const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaStreamRef.current = mediaStream;

			const audioContext = new AudioContext();
			audioContextRef.current = audioContext;

			const source = audioContext.createMediaStreamSource(mediaStream);
			const analyser = audioContext.createAnalyser();
			analyser.fftSize = fftSize;
			source.connect(analyser);

			analyserNodeRef.current = analyser;

			const mediaRecorder = new MediaRecorder(mediaStream);
			mediaRecorderRef.current = mediaRecorder;

			recordedData.current = [];

			mediaRecorder.ondataavailable = (event) => {
				recordedData.current.push(event.data);
			};
			
			mediaRecorder.onstop = () => {
				const audioBlob = new Blob(recordedData.current, { 'type': 'audio/ogg' });
				console.log(start, Date.now());
				const duration = Date.now() - start;
				if (onRecordingComplete) {
					onRecordingComplete(audioBlob, duration);
				}
			};

			mediaRecorder.start();
			setStart(Date.now());
			setIsRecording(true);
			console.log("Started recording");
		}
		catch (err) {
			console.log("Error in startRecording" + err);
		}
	};

	const stopRecording = () => {
		if (mediaRecorderRef && isRecording) {
			mediaRecorderRef.current.stop();
			setIsRecording(false);
		}
	};

	return {
		isRecording: isRecording,
		startRecording: startRecording,
		stopRecording: stopRecording,
		analyser: analyserNodeRef.current,
		audioContext: audioContextRef.current
	};
};