import Head from 'next/head';
import React, { useEffect, createRef } from 'react';
import Layout from '../components/layout';
import utilStyles from '../styles/utils.module.css';
import { drawFrequencyData } from '../utils/visualize';
import AudioCanvas from '../components/audioCanvas';
import { setMediaStream } from '../components/audioCanvas';

export default function AudioAnalysis() {
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
    return <Layout>
        <Head>
            <title>Audio Analysis</title>
        </Head>
        <h1 className={utilStyles.heading2XL} style={{ color: 'rgb(255, 0, 0)' }}>Analysis</h1>
        <section>
            <h1 className={utilStyles.headingMD} style={{ color: 'rgb(0, 0, 255)' }}>Frequency Visualization</h1>
            <AudioCanvas type={'dynamic'} width={1000} height={1000}/>
        </section>
    </Layout>
}