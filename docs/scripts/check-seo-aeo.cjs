const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const buildDir = path.join(rootDir, 'build');
const staticDir = path.join(rootDir, 'static');
const siteUrl = process.env.SITE_URL || 'https://ralphstarter.ai';
const expectedOrigin = new URL(siteUrl).origin;
// Keep a minimum URL floor so we catch truncated/partial sitemap generation.
const defaultMinSitemapUrls = 10;

function resolveMinSitemapUrls() {
  const rawValue = process.env.MIN_SITEMAP_URLS;
  if (rawValue === undefined || rawValue.trim() === '') {
    return defaultMinSitemapUrls;
  }

  const normalized = rawValue.trim();
  if (!/^\d+$/.test(normalized)) {
    throw new Error(
      `Invalid MIN_SITEMAP_URLS value "${rawValue}". Expected a positive integer.`
    );
  }

  const parsedValue = Number(normalized);
  if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(
      `Invalid MIN_SITEMAP_URLS value "${rawValue}". Expected a positive integer.`
    );
  }

  return parsedValue;
}

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
  const minSitemapUrls = resolveMinSitemapUrls();

  assertFileExists(buildDir, 'Build directory');

  for (const file of requiredBuildFiles) {
    assertFileExists(path.join(buildDir, file), 'Generated');
  }

  const sitemapPath = path.join(buildDir, 'sitemap.xml');
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const locMatches = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

  if (locMatches.length < minSitemapUrls) {
    throw new Error(
      `Sitemap has too few URLs (${locMatches.length}). Expected at least ${minSitemapUrls}.`
    );
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
  let docsManifest;
  try {
    docsManifest = JSON.parse(docsManifestRaw);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Malformed docs.json manifest: ${reason}. Please regenerate docs artifacts.`);
  }
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

try {
  main();
  process.exitCode = 0;
} catch (error) {
  if (error instanceof Error) {
    console.error('Validation failed:\n', error.stack || error.message);
  } else {
    console.error('Validation failed:', error);
  }
  process.exit(1);
}
