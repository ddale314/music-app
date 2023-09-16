import Head from 'next/head';
import Layout from '../components/layout';
import utilStyles from '../styles/utils.module.css';

export default function AudioAnalysis() {
    return <Layout>
        <Head>
            <title>Audio Analysis</title>
        </Head>
        <h1 className={utilStyles.heading2XL} style={{color: 'rgb(255, 0, 0)'}}>Analysis</h1>
    </Layout>
}