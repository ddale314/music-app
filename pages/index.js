import Head from 'next/head';
import Script from 'next/script'
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
      <section className={utilStyles.headingMd}>
        <p>bippity bop</p>
      </section>
      <Link href="/posts/first-post">
        <h1 className={utilStyles.headingLg}>First Post</h1>
      </Link>
      
      <Canvas />
    </Layout>
  )
}