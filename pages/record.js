import Head from "next/head";
import utilStyles from '../styles/utils.module.css';
import Layout from "../components/layout";

export default function Recording() {
    return (
        <Layout>
            <Head>
                <title>Record Audio</title>
            </Head>
            <section className = {utilStyles.titleLarge + ' ' + utilStyles.textGradient}>
                <p>Record</p>
            </section>
        </Layout>
    )
}