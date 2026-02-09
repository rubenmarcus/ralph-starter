import type { ReactNode } from 'react';
import { useEffect } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HeroSection from '@site/src/components/HeroSection';
import FeatureSections from '@site/src/components/FeatureSections';
import QuickStart from '@site/src/components/QuickStart';
import UseCases from '@site/src/components/UseCases';
import ClientShowcase from '@site/src/components/ClientShowcase';
import LLMProviders from '@site/src/components/LLMProviders';
import IntegrationShowcase from '@site/src/components/IntegrationShowcase';
import AutoMode from '@site/src/components/AutoMode';
import PresetsShowcase from '@site/src/components/PresetsShowcase';
import SkillsShowcase from '@site/src/components/SkillsShowcase';

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
      description="Connect your tools like Figma, GitHub, Linear, and Notion. Fetch specs from anywhere and let AI coding agents build production-ready code automatically with autonomous loops.">
      <HeroSection />
      <main>
        <FeatureSections />
        <AutoMode />
        <PresetsShowcase />
        <SkillsShowcase />
        <QuickStart />
        <UseCases />
        <ClientShowcase />
        <LLMProviders />
        <IntegrationShowcase />
      </main>
    </Layout>
  );
}
