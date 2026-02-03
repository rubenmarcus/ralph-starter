import { describe, expect, it } from 'vitest';
import { formatPrdPrompt, getPrdStats, parsePrdContent } from '../prd-parser.js';

describe('prd-parser', () => {
  describe('parsePrdContent', () => {
    it('should parse title from first # header', () => {
      const content = `# My PRD Title

Some description here.

- [ ] Task 1
- [ ] Task 2`;

      const result = parsePrdContent(content);
      expect(result.title).toBe('My PRD Title');
    });

    it('should parse description before first task', () => {
      const content = `# My PRD

This is the description.
It can span multiple lines.

- [ ] Task 1`;

      const result = parsePrdContent(content);
      expect(result.description).toBe('This is the description.\nIt can span multiple lines.');
    });

    it('should parse uncompleted checkbox tasks', () => {
      const content = `# PRD

- [ ] Task one
- [ ] Task two
- [ ] Task three`;

      const result = parsePrdContent(content);
      expect(result.tasks).toHaveLength(3);
      expect(result.tasks[0]).toEqual({
        name: 'Task one',
        completed: false,
        index: 0,
        section: undefined,
      });
    });

    it('should parse completed checkbox tasks', () => {
      const content = `# PRD

- [x] Done task
- [X] Also done
- [ ] Not done`;

      const result = parsePrdContent(content);
      expect(result.tasks[0].completed).toBe(true);
      expect(result.tasks[1].completed).toBe(true);
      expect(result.tasks[2].completed).toBe(false);
    });

    it('should track sections from ## headers', () => {
      const content = `# PRD

## Backend

- [ ] API endpoint
- [ ] Database schema

## Frontend

- [ ] UI component
- [ ] Styling`;

      const result = parsePrdContent(content);
      expect(result.tasks).toHaveLength(4);
      expect(result.tasks[0].section).toBe('Backend');
      expect(result.tasks[1].section).toBe('Backend');
      expect(result.tasks[2].section).toBe('Frontend');
      expect(result.tasks[3].section).toBe('Frontend');
    });

    it('should handle asterisk bullet points', () => {
      const content = `# PRD

* [ ] Task with asterisk
* [x] Completed asterisk task`;

      const result = parsePrdContent(content);
      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0].name).toBe('Task with asterisk');
    });

    it('should handle indented tasks', () => {
      const content = `# PRD

  - [ ] Indented task
    - [ ] More indented`;

      const result = parsePrdContent(content);
      expect(result.tasks).toHaveLength(2);
    });

    it('should return default title if none found', () => {
      const content = `- [ ] Task without title`;

      const result = parsePrdContent(content);
      expect(result.title).toBe('Untitled PRD');
    });

    it('should preserve raw content', () => {
      const content = `# PRD\n\n- [ ] Task`;

      const result = parsePrdContent(content);
      expect(result.rawContent).toBe(content);
    });
  });

  describe('getPrdStats', () => {
    it('should calculate correct stats', () => {
      const prd = parsePrdContent(`# PRD

- [x] Done 1
- [x] Done 2
- [ ] Todo 1
- [ ] Todo 2
- [ ] Todo 3`);

      const stats = getPrdStats(prd);
      expect(stats.total).toBe(5);
      expect(stats.completed).toBe(2);
      expect(stats.pending).toBe(3);
      expect(stats.percentComplete).toBe(40);
    });

    it('should handle empty PRD', () => {
      const prd = parsePrdContent(`# Empty PRD`);

      const stats = getPrdStats(prd);
      expect(stats.total).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.percentComplete).toBe(0);
    });

    it('should handle 100% complete', () => {
      const prd = parsePrdContent(`# PRD

- [x] Done
- [x] Also done`);

      const stats = getPrdStats(prd);
      expect(stats.percentComplete).toBe(100);
    });
  });

  describe('formatPrdPrompt', () => {
    it('should include title and description', () => {
      const prd = parsePrdContent(`# My Feature PRD

Build a new feature.

- [ ] Task 1`);

      const prompt = formatPrdPrompt(prd);
      expect(prompt).toContain('# My Feature PRD');
      expect(prompt).toContain('Build a new feature.');
    });

    it('should show task progress', () => {
      const prd = parsePrdContent(`# PRD

- [x] Done
- [ ] Todo 1
- [ ] Todo 2`);

      const prompt = formatPrdPrompt(prd);
      expect(prompt).toContain('Completed: 1/3');
      expect(prompt).toContain('Remaining: 2');
    });

    it('should list pending tasks', () => {
      const prd = parsePrdContent(`# PRD

- [x] Done
- [ ] Pending task`);

      const prompt = formatPrdPrompt(prd);
      expect(prompt).toContain('- [ ] Pending task');
      expect(prompt).not.toContain('- [ ] Done');
    });

    it('should group tasks by section when multiple sections exist', () => {
      const prd = parsePrdContent(`# PRD

## Backend

- [ ] API work

## Frontend

- [ ] UI work`);

      const prompt = formatPrdPrompt(prd);
      expect(prompt).toContain('### Backend');
      expect(prompt).toContain('### Frontend');
    });

    it('should indicate when all tasks are complete', () => {
      const prd = parsePrdContent(`# PRD

- [x] All done`);

      const prompt = formatPrdPrompt(prd);
      expect(prompt).toContain('All tasks have been completed!');
    });
  });
});
