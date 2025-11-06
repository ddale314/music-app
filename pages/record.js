import Head from "next/head";
import utilStyles from '../styles/utils.module.css';
import Layout from "../components/layout";
import AudioCanvas, { setMediaStream } from '../components/audioCanvas';
import { Complex } from "../utils/complex";
import { useEffect } from 'react';
import RecordButton from "../components/recordButton"
import PlayButton from "../components/playButton"

let testData = []
for (let i = 0; i < 4096; i++) {
    let i = Math.random() * 60 - 30
    let j = Math.random() * 60 - 30
    testData.push(new Complex(i, j));
}

// record, display, and edit audio
export default function Recording() {
    useEffect(() => {
        if (navigator.mediaDevices.getUserMedia) {
            const constraints = { audio: true };
            let onSuccess = (stream) => {
                setMediaStream(stream);
            }
    
            let onError = () => {
                console.log('Error: ' + err);
            }
    
            navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
        }
    }, []);
    return (
        <Layout>
            <Head>
                <title>Record Audio</title>
            </Head>
            <section className = {utilStyles.titleLarge + ' ' + utilStyles.textGradient}>
                <p>Record</p>
                
            </section>
            <AudioCanvas type='dynamic' width={1000} height={100} maxRecordLength={10}/>
            <AudioCanvas type='static' width={1000} height={250} data={testData}/>
            <RecordButton height={50} width={50}/>
            <PlayButton height={50} width={50}/>
            <audio></audio>
        </Layout>
    )
}