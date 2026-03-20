import Head from 'next/head';
import React from 'react';
import Layout from '../components/layout';
import AudioCanvas from '../components/audioCanvas';
import useRecorder from '../hooks/useRecorder';
import { Complex } from '../utils/complex';

let testData = []
for (let i = 0; i < 4096; i++) {
    let x = Math.random() * 60 - 30;
    let y = Math.random() * 60 - 30;
    testData.push(new Complex(x, y));
}

export default function AudioAnalysis() {
    const { isRecording, startRecording, analyser, audioContext } = useRecorder();

    if (!isRecording) {
        startRecording();
    }

    return (
        <Layout>
            <Head>
                <title>Analysis - AudioStudio</title>
            </Head>

            <div style={{ padding: '24px', height: '100%', overflow: 'auto' }}>
                <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '12px', height: '12px', background: 'var(--daw-accent-blue)', borderRadius: '50%', boxShadow: '0 0 8px rgba(91, 155, 213, 0.6)' }}></div>
                    <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Frequency Analysis Visualizer</h1>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {isRecording && (
                        <div style={{ background: 'var(--daw-bg-mid)', padding: '20px', borderRadius: 'var(--daw-radius)', border: '1px solid var(--daw-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h2 style={{ fontSize: '14px', color: 'var(--daw-text)', textTransform: 'uppercase', letterSpacing: '1px' }}>Real-time Master Input</h2>
                                <span style={{ fontSize: '11px', color: 'var(--daw-text-muted)', background: 'var(--daw-bg-darkest)', padding: '4px 8px', borderRadius: '4px' }}>LIVE</span>
                            </div>
                            <AudioCanvas type='realtime' width={1000} height={250} analyser={analyser} sampleRate={audioContext.sampleRate} />
                        </div>
                    )}

                    <div style={{ background: 'var(--daw-bg-mid)', padding: '20px', borderRadius: 'var(--daw-radius)', border: '1px solid var(--daw-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '14px', color: 'var(--daw-text)', textTransform: 'uppercase', letterSpacing: '1px' }}>Recorded Sample Data</h2>
                            <span style={{ fontSize: '11px', color: 'var(--daw-accent-yellow)', background: 'var(--daw-bg-dark)', border: '1px solid var(--daw-border)', padding: '4px 8px', borderRadius: '4px' }}>OFFLINE</span>
                        </div>
                        <AudioCanvas type='recorded' width={1000} height={250} data={testData} />
                    </div>
                </div>
            </div>
        </Layout>
    );
}