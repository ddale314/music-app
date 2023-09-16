const getAudio = async () => {
    const constraints = { audio : true };
    try {
        let stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        let audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream); 
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 32768;
        const bufferLength = analyser.frequencyBinCount;
        const frequencyData = new Float32Array(bufferLength);
        
        analyser.getFloatFrequencyData(frequencyData);
        source.connect(analyser);
        
        console.log("bl: " + bufferLength);
        
        frequencyData[10] = 1000;
        console.log(frequencyData);
        return { frequencyData, bufferLength };
    }
    catch (err) {
        console.log('Error: ' + err);
    }
}

export default getAudio;