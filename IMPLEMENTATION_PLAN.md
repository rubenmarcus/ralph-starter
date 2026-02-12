# Implementation Plan

*Auto-generated from spec*

## Tasks

### Task 1: Content Extraction

- [ ] Extract all text layers from Figma file
- [ ] Organize by frame/page hierarchy
- [ ] Identify semantic roles (heading, body, button, label, etc.)
- [ ] Map to content structure

### Task 2: IA Extraction

- [ ] Detect page/screen structure
- [ ] Extract navigation patterns
- [ ] Identify component hierarchy
- [ ] Build content map

### Task 3: Template Matching

- [ ] Scan existing project for components
- [ ] Match Figma frames to project components
- [ ] Identify text slots in templates
- [ ] Map Figma content to component props

### Task 4: Content Application

- [ ] Update component props with extracted text
- [ ] Preserve existing styling/structure
- [ ] Handle dynamic content (arrays, conditionals)
- [ ] Generate content diff for review

### Task 5: CLI Options

- [ ] Add `--figma-mode content` option
- [ ] Add `--figma-target <path>` for target directory
- [ ] Add `--figma-preview` to show changes without applying
- [ ] Add `--figma-mapping <file>` for custom content mapping

### Session Management
- [x] Create `src/loop/session.ts` for pause/resume support
- [x] Add `ralph-starter pause` command
- [x] Add `ralph-starter resume` command
- [ ] Store session state in `.ralph-session.json`

### Task 6: Documentation

- [ ] Add content mode section to README.md
- [ ] Create `docs/figma-content-mode.md` for Docusaurus
- [ ] Document content mapping patterns
- [ ] Add examples for common frameworks
