import Head from "next/head";
import utilStyles from '../styles/utils.module.css';
import Layout from "../components/layout";
import RecordingCanvas from "../components/recordingCanvas";
import useDraggable from "../hooks/useDraggable"
import { useState } from "react";
import { SegmentEditor } from "../components/segmentEditor";

// record, display, and edit audio
export default function Recording() {
    const [showEditor, setShowEditor] = useState(false);
    return (
        <Layout>
            <Head>
                <title>Record Audio</title>
            </Head>
            <section className = {utilStyles.titleSmall + ' ' + utilStyles.textGradient}>
                <p>Record</p>
            </section>
            <br />
            <button onClick={() => setShowEditor(!showEditor)}>{showEditor ? "Close" : "Open"} Editor</button>
            {showEditor && <SegmentEditor />}
            <RecordingCanvas />
            <audio></audio>
        </Layout>
    )
}