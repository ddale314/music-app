import Head from "next/head";
import utilStyles from '../styles/utils.module.css';
import Layout from "../components/layout";
import AudioCanvas, { setMediaStream } from '../components/audioCanvas';
import { Complex } from "../utils/complex";
import { useEffect } from 'react';
import RecordButton from "../components/recordButton"
import useRecorder from "../hooks/useRecorder"
import PlayButton from "../components/playButton"

// record, display, and edit audio
export default function Recording() {

    const { isRecording, startRecording, stopRecording, analyser, audioContext } = useRecorder();

    if (!isRecording) {
        startRecording();
    }

    return (
        <Layout>
            <Head>
                <title>Record Audio</title>
            </Head>
            <section className = {utilStyles.titleLarge + ' ' + utilStyles.textGradient}>
                <p>Record</p>
                
            </section>
            {/*<button onClick={startRecording}>Start displaying audio</button>*/}
            {isRecording && <AudioCanvas type='realtime' width={1000} height={100} analyser={analyser} sampleRate={audioContext.sampleRate}/>}

            <RecordButton height={50} width={50}/>
            {/*<PlayButton height={50} width={50}/>*/}
            <audio></audio>
        </Layout>
    )
}