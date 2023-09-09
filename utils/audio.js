const getAudio = async () => {
    const constraints = { audio : true };
    let stream = null;
    try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
    }
    catch (err) {
        console.log('Error: ' + err);
    }

    return (
        { stream }
    );
}

export default getAudio;