const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const buildDir = path.join(rootDir, 'build');
const staticDir = path.join(rootDir, 'static');
const siteUrl = process.env.SITE_URL || 'https://ralphstarter.ai';
const expectedOrigin = new URL(siteUrl).origin;

const requiredBuildFiles = [
  'sitemap.xml',
  'llms.txt',
  'llms-full.txt',
  'docs.json',
  'docs-urls.txt',
  'ai-index.json',
  'sidebar.json',
];

function assertFileExists(fullPath, label) {
  if (!fs.existsSync(fullPath)) {
    throw new Error(`${label} file missing: ${fullPath}`);
  }
}

function main() {
  assertFileExists(buildDir, 'Build directory');

  for (const file of requiredBuildFiles) {
    assertFileExists(path.join(buildDir, file), 'Generated');
  }

  const sitemapPath = path.join(buildDir, 'sitemap.xml');
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const locMatches = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

  if (locMatches.length < 10) {
    throw new Error(`Sitemap has too few URLs (${locMatches.length}).`);
  }

  if (!locMatches.some((url) => url.includes('/docs/intro'))) {
    throw new Error('Sitemap is missing /docs/intro.');
  }

  const hasInvalidSitemapOrigin = locMatches.some((url) => {
    try {
      return new URL(url).origin !== expectedOrigin;
    } catch {
      return true;
    }
  });

  if (hasInvalidSitemapOrigin) {
    throw new Error(`Sitemap contains URLs outside ${expectedOrigin}.`);
  }

  const llmsTxt = fs.readFileSync(path.join(buildDir, 'llms.txt'), 'utf8');
  if (!llmsTxt.includes(`${siteUrl}/docs/intro`)) {
    throw new Error('llms.txt does not include expected docs URL.');
  }

  const docsManifestRaw = fs.readFileSync(path.join(buildDir, 'docs.json'), 'utf8');
  const docsManifest = JSON.parse(docsManifestRaw);
  if (!Array.isArray(docsManifest.docs) || docsManifest.docs.length === 0) {
    throw new Error('docs.json manifest has no docs entries.');
  }

  const robotsPath = path.join(staticDir, 'robots.txt');
  assertFileExists(robotsPath, 'Static');
  const robotsTxt = fs.readFileSync(robotsPath, 'utf8');
  if (!robotsTxt.includes(`Sitemap: ${siteUrl}/sitemap.xml`)) {
    throw new Error('robots.txt is missing sitemap reference.');
  }

  console.log('SEO/AEO checks passed.');
  console.log(`- sitemap URLs: ${locMatches.length}`);
  console.log(`- docs manifest entries: ${docsManifest.docs.length}`);
}

main();
