const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const buildDir = path.join(rootDir, 'build');
const staticDir = path.join(rootDir, 'static');

const artifacts = [
  'sitemap.xml',
  'llms.txt',
  'llms-full.txt',
  'docs.json',
  'docs-urls.txt',
  'ai-index.json',
  'sidebar.json',
];

function copyArtifact(filename) {
  const source = path.join(buildDir, filename);
  const target = path.join(staticDir, filename);

  if (!fs.existsSync(source)) {
    throw new Error(`Missing generated artifact: ${source}`);
  }

  fs.copyFileSync(source, target);
  return target;
}

function main() {
  if (!fs.existsSync(buildDir)) {
    throw new Error(`Build directory not found: ${buildDir}. Run "pnpm --dir docs build" first.`);
  }

  if (!fs.existsSync(staticDir)) {
    fs.mkdirSync(staticDir, { recursive: true });
  }

  const copied = artifacts.map(copyArtifact);
  console.log(`Synced ${copied.length} SEO/AEO assets into docs/static:`);
  for (const file of copied) {
    console.log(`- ${path.relative(rootDir, file)}`);
  }
}

main();
