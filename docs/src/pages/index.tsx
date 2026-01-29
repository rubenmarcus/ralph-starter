import type { ReactNode } from 'react';
import { useEffect } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HeroSection from '@site/src/components/HeroSection';
import FeatureSections from '@site/src/components/FeatureSections';
import IntegrationShowcase from '@site/src/components/IntegrationShowcase';

export default function Home(): ReactNode {
  useDocusaurusContext();

  // Add homepage class for special navbar styling
  useEffect(() => {
    document.documentElement.classList.add('homepage');
    return () => {
      document.documentElement.classList.remove('homepage');
    };
  }, []);

  return (
    <Layout
      title="Home"
      description="Connect your tools like GitHub, Linear, and Notion. Fetch specs from anywhere and let AI coding agents build production-ready code automatically with autonomous loops.">
      <HeroSection />
      <main>
        <FeatureSections />
        <IntegrationShowcase />
      </main>
    </Layout>
  );
}
