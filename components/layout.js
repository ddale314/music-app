import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/layout.module.css';

export const siteTitle = 'AudioStudio';

export default function Layout({ children }) {
  const router = useRouter();

  return (
    <div className={styles.appShell}>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Digital Audio Workstation" />
        <meta name="og:title" content={siteTitle} />
        <title>{siteTitle}</title>
      </Head>

      <div className={styles.toolbar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}></span>
          {siteTitle}
        </div>

        <nav className={styles.nav}>
          <Link
            href="/analysis"
            className={router.pathname === '/analysis' ? styles.navLinkActive : styles.navLink}
          >
            Analysis
          </Link>
          <Link
            href="/record"
            className={router.pathname === '/record' ? styles.navLinkActive : styles.navLink}
          >
            Recording
          </Link>
        </nav>
      </div>

      <main className={styles.main}>{children}</main>
    </div>
  );
}