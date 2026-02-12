import { existsSync, readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { detectPackageManager, formatRunCommand, getRunCommand } from '../package-manager.js';

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);

describe('detectPackageManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return pnpm when pnpm-lock.yaml exists', () => {
    mockExistsSync.mockImplementation((p: any) => p.toString().includes('pnpm-lock.yaml'));
    expect(detectPackageManager('/test')).toBe('pnpm');
  });

  it('should return yarn when yarn.lock exists', () => {
    mockExistsSync.mockImplementation((p: any) => p.toString().includes('yarn.lock'));
    expect(detectPackageManager('/test')).toBe('yarn');
  });

  it('should return bun when bun.lockb exists', () => {
    mockExistsSync.mockImplementation((p: any) => p.toString().includes('bun.lockb'));
    expect(detectPackageManager('/test')).toBe('bun');
  });

  it('should return bun when bun.lock exists', () => {
    mockExistsSync.mockImplementation((p: any) => p.toString().includes('bun.lock'));
    expect(detectPackageManager('/test')).toBe('bun');
  });

  it('should read packageManager field from package.json', () => {
    mockExistsSync.mockImplementation((p: any) => p.toString().includes('package.json'));
    mockReadFileSync.mockReturnValue(JSON.stringify({ packageManager: 'pnpm@9.0.0' }));
    expect(detectPackageManager('/test')).toBe('pnpm');
  });

  it('should prefer lockfile over packageManager field', () => {
    mockExistsSync.mockImplementation(
      (p: any) => p.toString().includes('yarn.lock') || p.toString().includes('package.json')
    );
    mockReadFileSync.mockReturnValue(JSON.stringify({ packageManager: 'pnpm@9.0.0' }));
    expect(detectPackageManager('/test')).toBe('yarn');
  });

  it('should default to npm when no indicators found', () => {
    mockExistsSync.mockReturnValue(false);
    expect(detectPackageManager('/test')).toBe('npm');
  });

  it('should default to npm for unrecognized packageManager', () => {
    mockExistsSync.mockImplementation((p: any) => p.toString().includes('package.json'));
    mockReadFileSync.mockReturnValue(JSON.stringify({ packageManager: 'unknown@1.0.0' }));
    expect(detectPackageManager('/test')).toBe('npm');
  });

  it('should handle invalid package.json gracefully', () => {
    mockExistsSync.mockImplementation((p: any) => p.toString().includes('package.json'));
    mockReadFileSync.mockReturnValue('not valid json');
    expect(detectPackageManager('/test')).toBe('npm');
  });
});

describe('getRunCommand', () => {
  it('should return shorthand for test script', () => {
    expect(getRunCommand('pnpm', 'test')).toEqual({ command: 'pnpm', args: ['test'] });
    expect(getRunCommand('npm', 'test')).toEqual({ command: 'npm', args: ['test'] });
    expect(getRunCommand('bun', 'test')).toEqual({ command: 'bun', args: ['test'] });
  });

  it('should use run for non-test scripts', () => {
    expect(getRunCommand('pnpm', 'build')).toEqual({ command: 'pnpm', args: ['run', 'build'] });
    expect(getRunCommand('npm', 'lint')).toEqual({ command: 'npm', args: ['run', 'lint'] });
    expect(getRunCommand('bun', 'dev')).toEqual({ command: 'bun', args: ['run', 'dev'] });
  });
});

describe('formatRunCommand', () => {
  it('should format test commands', () => {
    expect(formatRunCommand('pnpm', 'test')).toBe('pnpm test');
    expect(formatRunCommand('npm', 'test')).toBe('npm test');
  });

  it('should format run commands', () => {
    expect(formatRunCommand('pnpm', 'build')).toBe('pnpm run build');
    expect(formatRunCommand('yarn', 'lint')).toBe('yarn run lint');
  });
});
