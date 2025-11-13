import Head from "next/head";
import utilStyles from '../styles/utils.module.css';
import Layout from "../components/layout";
import AudioCanvas, { setMediaStream } from '../components/audioCanvas';
import RecordingCanvas from "../components/recordingCanvas";
import { Complex } from "../utils/complex";
import { useEffect } from 'react';
import RecordButton from "../components/recordButton"
import useRecorder from "../hooks/useRecorder"
import PlayButton from "../components/playButton"

// record, display, and edit audio
export default function Recording() {

    return (
        <Layout>
            <Head>
                <title>Record Audio</title>
            </Head>
            <section className = {utilStyles.titleLarge + ' ' + utilStyles.textGradient}>
                <p>Record</p>
                
            </section>
            {/*<button onClick={startRecording}>Start displaying audio</button>*/}
            {/*{isRecording && <AudioCanvas type='realtime' width={1000} height={100} analyser={analyser} sampleRate={audioContext.sampleRate}/>}*/}

            <RecordingCanvas />
            
            {/*<PlayButton height={50} width={50}/>*/}
            <audio></audio>
        </Layout>
    )
}