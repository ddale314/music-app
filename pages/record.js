import Head from "next/head";
import utilStyles from '../styles/utils.module.css';
import Layout from "../components/layout";
import RecordingCanvas from "../components/recordingCanvas";
import useDraggable from "../hooks/useDraggable"

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