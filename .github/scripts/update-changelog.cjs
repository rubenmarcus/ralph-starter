#!/usr/bin/env node
/**
 * Updates CHANGELOG.md with a new release entry.
 *
 * New mode (multi-entry):
 *   Environment variables:
 *     - NEW_VERSION: The new version number
 *     - TODAY: The release date (YYYY-MM-DD)
 *     - CHANGES_JSON: JSON array of {type, title, pr} objects
 *
 * Legacy mode (single entry, backward-compatible):
 *   Environment variables:
 *     - NEW_VERSION, TODAY, CHANGE_TYPE, SOURCE_PR
 *   Arguments: node update-changelog.cjs <title>
 */

const fs = require('fs');
const path = require('path');

const version = process.env.NEW_VERSION;
const date = process.env.TODAY;

if (!version || !date) {
  console.error('Missing required environment variables: NEW_VERSION, TODAY');
  process.exit(1);
}

let changes;

if (process.env.CHANGES_JSON) {
  changes = JSON.parse(process.env.CHANGES_JSON);
} else {
  // Legacy fallback: single entry from env vars + argv
  const changeType = process.env.CHANGE_TYPE;
  const pr = process.env.SOURCE_PR;
  const title = process.argv[2];
  if (!changeType || !pr || !title) {
    console.error('Missing CHANGES_JSON or legacy env vars (CHANGE_TYPE, SOURCE_PR) + title arg');
    process.exit(1);
  }
  changes = [{ type: changeType, title, pr: Number(pr) }];
}

// Group changes by type in deterministic order
const typeOrder = ['Added', 'Fixed', 'Changed'];
const grouped = {};
for (const change of changes) {
  const t = change.type;
  if (!grouped[t]) grouped[t] = [];
  grouped[t].push(change);
}

// Build the entry
let entry = `## [${version}] - ${date}\n\n`;
for (const type of typeOrder) {
  if (!grouped[type]) continue;
  entry += `### ${type}\n`;
  for (const c of grouped[type]) {
    entry += `- ${c.title} (#${c.pr})\n`;
  }
  entry += '\n';
}

// Insert into changelog
const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
let changelog = fs.readFileSync(changelogPath, 'utf8');
const lines = changelog.split('\n');

// Find insertion point dynamically
// First try to find a sentinel marker
let insertIdx = lines.findIndex(l => l.trim().startsWith('<!-- CHANGELOG_ENTRY -->'));

// If no marker, find the first version heading
if (insertIdx === -1) {
  insertIdx = lines.findIndex(l => l.trim().match(/^## \[\d/));
}

// If still not found, default to after header (line 6)
if (insertIdx === -1) {
  insertIdx = 6;
}

// Build the new changelog
const header = lines.slice(0, insertIdx).join('\n');
const rest = lines.slice(insertIdx).join('\n');

changelog = header + '\n\n' + entry + rest;
fs.writeFileSync(changelogPath, changelog);

console.log(`Updated CHANGELOG.md with ${changes.length} entries for v${version}`);
