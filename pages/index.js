import Head from 'next/head';
import Layout, { siteTitle } from '../components/layout';
import utilStyles from '../styles/utils.module.css';
import Link from 'next/link';
import Canvas from '../components/canvas';

export default function Home() {
  return (
    <Layout home>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <section className={utilStyles.titleLarge + ' ' + utilStyles.textGradient}>
        <p>Stuff</p>
      </section>
      
      <Canvas />
    </Layout>
  )
}