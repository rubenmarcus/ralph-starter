// Types for the interactive wizard

export type ProjectType = 'web' | 'api' | 'cli' | 'mobile' | 'library' | 'automation';
export type Complexity = 'prototype' | 'mvp' | 'full';

export interface TechStack {
  frontend?: string;
  backend?: string;
  database?: string;
  styling?: string;
  uiLibrary?: string;
  language?: string;
}

export interface WizardAnswers {
  // From user input
  rawIdea: string;
  projectType?: ProjectType;
  techStack: TechStack;
  selectedFeatures: string[];
  complexity: Complexity;

  // From LLM refinement
  projectName: string;
  projectDescription: string;
  suggestedFeatures: string[];

  // Execution options
  autoRun: boolean;
  autoCommit: boolean;
  workingDirectory: string;
}

export interface RefinedIdea {
  projectName: string;
  projectDescription: string;
  projectType: ProjectType;
  suggestedStack: TechStack;
  coreFeatures: string[];
  suggestedFeatures: string[];
  estimatedComplexity: Complexity;
  clarifyingQuestions?: string[];
}

export interface WizardStep {
  name: string;
  status: 'pending' | 'current' | 'complete';
}

export const DEFAULT_WIZARD_ANSWERS: Partial<WizardAnswers> = {
  techStack: {},
  selectedFeatures: [],
  suggestedFeatures: [],
  complexity: 'mvp',
  autoRun: true,
  autoCommit: false,
};

// Idea Mode types

export type IdeaDiscoveryMethod = 'brainstorm' | 'trending' | 'skills' | 'problem';

export type IdeaDifficulty = 'easy' | 'moderate' | 'challenging';

export interface IdeaSuggestion {
  title: string;
  description: string;
  projectType: ProjectType;
  difficulty: IdeaDifficulty;
  reasons: string[];
}

export interface IdeaContext {
  method: IdeaDiscoveryMethod;
  skills?: string[];
  problem?: string;
  interests?: string[];
}
