import Head from "next/head";
import Layout from "../components/layout";
import RecordingCanvas from "../components/recordingCanvas";

// record, display, and edit audio
export default function Recording() {
    return (
        <Layout>
            <Head>
                <title>Recording Studio</title>
            </Head>
            <RecordingCanvas />
            <audio></audio>
        </Layout>
    )
}