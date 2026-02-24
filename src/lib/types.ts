import type { AnnotationType } from '@/components/ui/Badge';

/* ------------------------------------------------------------------ */
/* Workspace types                                                     */
/* ------------------------------------------------------------------ */

export interface EvidenceItem {
  id: string;
  type: string;
  content: string;
  createdAt?: string;
}

export interface AnnotationItem {
  id: string;
  textId: string;
  type: AnnotationType;
  locationStart: number;
  locationEnd: number;
  selectedText: string;
  note: string;
  evidence: EvidenceItem[];
  createdAt: string;
}

export interface TextSelection {
  start: number;
  end: number;
  text: string;
}

export interface TextData {
  id: string;
  textContent: string;
  wordCount: number;
  annotations: AnnotationItem[];
}

export interface AssignmentData {
  id: string;
  title: string;
  promptText: string;
  sectionBlueprint?: string | null;
  texts: TextData[];
}

/* ------------------------------------------------------------------ */
/* Dashboard types                                                     */
/* ------------------------------------------------------------------ */

export interface Text {
  id: string;
  studentCode: string;
  studentName: string | null;
  status: string;
  wordCount: number;
  textContent?: string;
  generationMeta?: string | null;
}

export interface Assignment {
  id: string;
  title: string;
  status: string;
  promptText: string;
  courseContext: string | null;
  requirements: string | null;
  knownPitfalls: string | null;
  referenceMaterial: string | null;
  sectionBlueprint: string | null;
  evaluationCriteria: string | null;
  exemplarNotes: string | null;
  generationStrategy: 'natural' | 'balanced_errors' | 'strict_truth';
  plannedStudentCount: number | null;
  plannedStudentCodes: string[];
  createdAt: string;
  texts: Text[];
}

export type ImportTextEntry = {
  textContent: string;
  studentCode?: string;
  sourceLabel?: string;
};

export type AnalysisReportSummary = {
  id: string;
  textId: string;
  mode: string;
  summary: string;
  findingsCount: number;
  totalsCritical: number;
  totalsModerate: number;
  totalsMinor: number;
  errorCount: number;
  createdAt: string;
};

export type ActivityLogEntry = {
  id: string;
  level: 'info' | 'success' | 'error';
  message: string;
  createdAt: number;
};

/* ------------------------------------------------------------------ */
/* Create-assignment types                                             */
/* ------------------------------------------------------------------ */

export type PromptTemplate = {
  id: string;
  name: string;
  title: string;
  promptText: string;
  courseContext: string;
  requirements: string;
  knownPitfalls: string;
  referenceMaterial: string;
  sectionBlueprint: string;
  evaluationCriteria: string;
  exemplarNotes: string;
  generationStrategy: 'natural' | 'balanced_errors' | 'strict_truth';
  studentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type GuidedSection = {
  id: string;
  title: string;
  task: string;
  criteria: string;
  pitfalls: string;
};
