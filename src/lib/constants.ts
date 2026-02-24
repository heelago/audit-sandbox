import { he } from '@/locale/he';
import type { AnnotationType } from '@/components/ui/Badge';
import { ChatIcon, SourceIcon, NoteIcon } from '@/components/icons';

/* ------------------------------------------------------------------ */
/* Annotation types                                                    */
/* ------------------------------------------------------------------ */

export const ANNOTATION_TYPES: {
  id: AnnotationType;
  label: string;
  color: string;
  desc: string;
}[] = [
  { id: 'error', label: he.annotationTypes.error.label, color: '#B54D4D', desc: he.annotationTypes.error.desc },
  { id: 'verified', label: he.annotationTypes.verified.label, color: '#4D8B6A', desc: he.annotationTypes.verified.desc },
  { id: 'alternative', label: he.annotationTypes.alternative.label, color: '#A68A2B', desc: he.annotationTypes.alternative.desc },
  { id: 'gap', label: he.annotationTypes.gap.label, color: '#9B6B42', desc: he.annotationTypes.gap.desc },
  { id: 'nuance', label: he.annotationTypes.nuance.label, color: '#4A6F8B', desc: he.annotationTypes.nuance.desc },
  { id: 'accepted', label: he.annotationTypes.accepted.label, color: '#7A7568', desc: he.annotationTypes.accepted.desc },
];

/* ------------------------------------------------------------------ */
/* Evidence kinds                                                      */
/* ------------------------------------------------------------------ */

export const EVIDENCE_KINDS: {
  id: string;
  label: string;
  iconKey: string;
  placeholder: string;
}[] = [
  { id: 'conversation', label: he.evidenceTypes.conversation.label, iconKey: 'conversation', placeholder: he.evidenceTypes.conversation.placeholder },
  { id: 'source', label: he.evidenceTypes.source.label, iconKey: 'source', placeholder: he.evidenceTypes.source.placeholder },
  { id: 'note', label: he.evidenceTypes.note.label, iconKey: 'note', placeholder: he.evidenceTypes.note.placeholder },
];

export const EVIDENCE_ICON_MAP: Record<string, typeof ChatIcon> = {
  conversation: ChatIcon,
  source: SourceIcon,
  note: NoteIcon,
};

/* ------------------------------------------------------------------ */
/* Status colors                                                       */
/* ------------------------------------------------------------------ */

export const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  draft:       { color: 'var(--ink-faint)', bg: 'var(--neutral-soft)' },
  generating:  { color: 'var(--warn)',      bg: 'var(--warn-soft)' },
  analyzing:   { color: 'var(--info)',      bg: 'var(--info-soft)' },
  calibrating: { color: 'var(--accent)',    bg: 'var(--accent-soft)' },
  active:      { color: 'var(--success)',   bg: 'var(--success-soft)' },
  grading:     { color: 'var(--warn)',      bg: 'var(--warn-soft)' },
  closed:      { color: 'var(--ink-faint)', bg: 'var(--neutral-soft)' },
};
