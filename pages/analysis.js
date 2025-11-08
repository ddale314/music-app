import Head from 'next/head';
import React, { useEffect, createRef } from 'react';
import Layout from '../components/layout';
import utilStyles from '../styles/utils.module.css';
import AudioCanvas from '../components/audioCanvas';
import { setMediaStream } from '../components/audioCanvas';
import useRecorder from '../hooks/useRecorder';
import { Complex } from '../utils/complex';

let testData = []
for (let i = 0; i < 4096; i++) {
    let i = Math.random() * 60 - 30
    let j = Math.random() * 60 - 30
    testData.push(new Complex(i, j));
}

export default function AudioAnalysis() {

    const { isRecording, startRecording, stopRecording, analyser, audioContext } = useRecorder();
    
    if (!isRecording) {
        startRecording();
    }

    return <Layout>
        <Head>
            <title>Audio Analysis</title>
        </Head>
        <h1 className={utilStyles.heading2XL} style={{ color: 'rgb(255, 0, 0)' }}>Analysis</h1>
        <section>
            <h1 className={utilStyles.headingMD} style={{ color: 'rgb(0, 0, 255)' }}>Frequency Visualization</h1>
            {isRecording && <AudioCanvas type='realtime' width={1000} height={250} analyser={analyser} sampleRate={audioContext.sampleRate}/>}
            <AudioCanvas type='recorded' width={1000} height={250} data={testData}/>
        </section>
    </Layout>
}