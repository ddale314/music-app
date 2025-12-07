import Head from "next/head";
import utilStyles from '../styles/utils.module.css';
import Layout from "../components/layout";
import RecordingCanvas from "../components/recordingCanvas";
import useDraggable from "../hooks/useDraggable"

// record, display, and edit audio
export default function Recording() {
    const {dragging, ref, pos} = useDraggable({x: 1, y: 1}, null, {x: 0, y: 0})

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
            <span style={{position: "absolute", left: "100px", top: "100px"}}>
                <span ref={ref} style={{userSelect: "none", backgroundColor: "red", position: "absolute", left: pos.x, top: pos.y}}>drag me</span>
            </span>
            {/*<PlayButton height={50} width={50}/>*/}
            <audio></audio>
        </Layout>
    )
}