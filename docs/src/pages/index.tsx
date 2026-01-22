import type { ReactNode } from 'react';
import { useEffect } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HeroSection from '@site/src/components/HeroSection';
import FeatureSections from '@site/src/components/FeatureSections';
import IntegrationShowcase from '@site/src/components/IntegrationShowcase';

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();

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
      description="Connect your tools. Run AI coding loops. Ship faster.">
      <HeroSection />
      <main>
        <FeatureSections />
        <IntegrationShowcase />
      </main>
    </Layout>
  );
}
