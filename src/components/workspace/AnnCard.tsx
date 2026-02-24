'use client';

import { useState, useEffect } from 'react';
import { CloseIcon, PlusIcon, annotationIcons } from '@/components/icons';
import { he } from '@/locale/he';
import { ANNOTATION_TYPES, EVIDENCE_KINDS, EVIDENCE_ICON_MAP } from '@/lib/constants';
import type { AnnotationItem } from '@/lib/types';

interface AnnCardProps {
  ann: AnnotationItem;
  onUpdateNote: (id: string, note: string) => void;
  onDelete: (id: string) => void;
  onAddEvidence: (annotationId: string, type: string, content: string) => void;
}

export function AnnCard({ ann, onUpdateNote, onDelete, onAddEvidence }: AnnCardProps) {
  const t = ANNOTATION_TYPES.find((x) => x.id === ann.type);
  const color = t?.color ?? '#999';
  const Icon = annotationIcons[ann.type];
  const prompts = he.guidedPrompts[ann.type] ?? [];

  const [showEvForm, setShowEvForm] = useState(false);
  const [evKind, setEvKind] = useState('source');
  const [evText, setEvText] = useState('');
  const [localNote, setLocalNote] = useState(ann.note || '');

  useEffect(() => {
    setLocalNote(ann.note || '');
  }, [ann.note]);

  const submitEv = () => {
    if (!evText.trim()) return;
    onAddEvidence(ann.id, evKind, evText.trim());
    setEvText('');
    setShowEvForm(false);
  };

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRight: `4px solid ${color}`,
        borderRadius: '8px',
        padding: '14px',
        marginBottom: '10px',
        direction: 'rtl',
        textAlign: 'right',
      }}
    >
      {/* Header: badge + delete */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: color + '14',
            border: `1px solid ${color}33`,
            borderRadius: '8px',
            padding: '3px 10px',
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            fontWeight: 600,
            color: color,
            direction: 'rtl',
          }}
        >
          {Icon && <Icon size={13} color={color} />}
          {t?.label}
        </span>
        <button
          onClick={() => onDelete(ann.id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
          }}
        >
          <CloseIcon size={14} color="var(--ink-faint)" />
        </button>
      </div>

      {/* Excerpt */}
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '12.5px',
          color: 'var(--ink-soft)',
          fontStyle: 'italic',
          padding: '6px 10px',
          background: 'var(--bg)',
          borderRadius: '4px',
          marginBottom: '8px',
          borderRight: `3px solid ${color}33`,
          lineHeight: '1.7',
          direction: 'rtl',
          textAlign: 'right',
        }}
      >
        &laquo;
        {ann.selectedText.length > 140
          ? ann.selectedText.slice(0, 140) + '...'
          : ann.selectedText}
        &raquo;
      </div>

      {/* Note textarea */}
      <textarea
        value={localNote}
        onChange={(e) => setLocalNote(e.target.value)}
        onBlur={() => {
          if (localNote !== ann.note) {
            onUpdateNote(ann.id, localNote);
          }
        }}
        placeholder={he.workspace.writeAnalysis}
        style={{
          width: '100%',
          minHeight: '55px',
          border: '1px solid var(--border-light)',
          borderRadius: '6px',
          padding: '8px 10px',
          fontFamily: 'var(--font-body)',
          fontSize: '12.5px',
          resize: 'vertical',
          background: 'var(--card-hover)',
          boxSizing: 'border-box',
          lineHeight: '1.7',
          direction: 'rtl',
          textAlign: 'right',
        }}
      />

      {/* Guided prompts */}
      <div
        style={{
          marginTop: '6px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
        }}
      >
        {prompts.map((p, i) => (
          <button
            key={i}
            onClick={() => {
              const newNote =
                (localNote || '') + (localNote ? '\n\n' : '') + p + '\n';
              setLocalNote(newNote);
              onUpdateNote(ann.id, newNote);
            }}
            style={{
              background: 'var(--card-hover)',
              border: `1px solid ${color}25`,
              borderRadius: '8px',
              padding: '3px 10px',
              fontSize: '10.5px',
              fontFamily: 'var(--font-body)',
              color: 'var(--ink-soft)',
              cursor: 'pointer',
              direction: 'rtl',
              textAlign: 'right',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Existing evidence */}
      {ann.evidence.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          {ann.evidence.map((ev) => {
            const ek = EVIDENCE_KINDS.find((x) => x.id === ev.type);
            const EvIcon = EVIDENCE_ICON_MAP[ev.type];
            return (
              <div
                key={ev.id}
                style={{
                  background: 'var(--card-hover)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '5px',
                  padding: '6px 8px',
                  marginBottom: '4px',
                  fontSize: '11.5px',
                  fontFamily: 'var(--font-body)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                  direction: 'rtl',
                  textAlign: 'right',
                }}
              >
                {EvIcon && <EvIcon size={13} color="var(--ink-soft)" />}
                <span>
                  <strong style={{ color: 'var(--ink-soft)' }}>
                    {ek?.label}:
                  </strong>{' '}
                  <span style={{ color: 'var(--ink-soft)' }}>
                    {ev.content.length > 150
                      ? ev.content.slice(0, 150) + '...'
                      : ev.content}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Add evidence */}
      {!showEvForm ? (
        <button
          onClick={() => setShowEvForm(true)}
          style={{
            marginTop: '6px',
            background: 'none',
            border: '1px dashed var(--border)',
            borderRadius: '6px',
            padding: '5px 10px',
            fontSize: '11.5px',
            fontFamily: 'var(--font-body)',
            color: 'var(--ink-faint)',
            cursor: 'pointer',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            direction: 'rtl',
          }}
        >
          <PlusIcon size={12} color="var(--ink-faint)" /> {he.workspace.attachEvidence}
        </button>
      ) : (
        <div
          style={{
            marginTop: '6px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '8px',
            direction: 'rtl',
            textAlign: 'right',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '4px',
              marginBottom: '6px',
              flexWrap: 'wrap',
            }}
          >
            {EVIDENCE_KINDS.map((ek) => {
              const EvIcon = EVIDENCE_ICON_MAP[ek.id];
              const isSelected = evKind === ek.id;
              return (
                <button
                  key={ek.id}
                  onClick={() => setEvKind(ek.id)}
                  style={{
                    background: isSelected ? 'var(--ink)' : 'var(--card)',
                    color: isSelected ? '#FFF9F4' : 'var(--ink-soft)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '3px 10px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-body)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {EvIcon && (
                    <EvIcon
                      size={12}
                      color={isSelected ? '#FFF9F4' : 'var(--ink-soft)'}
                    />
                  )}
                  {ek.label}
                </button>
              );
            })}
          </div>
          <textarea
            value={evText}
            onChange={(e) => setEvText(e.target.value)}
            placeholder={
              EVIDENCE_KINDS.find((x) => x.id === evKind)?.placeholder
            }
            style={{
              width: '100%',
              minHeight: '55px',
              border: '1px solid var(--border-light)',
              borderRadius: '5px',
              padding: '7px',
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              resize: 'vertical',
              boxSizing: 'border-box',
              background: 'var(--card)',
              direction: 'rtl',
              textAlign: 'right',
            }}
          />
          <div
            style={{ display: 'flex', gap: '5px', marginTop: '5px' }}
          >
            <button
              onClick={submitEv}
              style={{
                background: 'var(--accent)',
                color: '#FFF9F4',
                border: 'none',
                borderRadius: '10px',
                padding: '4px 12px',
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {he.workspace.add}
            </button>
            <button
              onClick={() => {
                setShowEvForm(false);
                setEvText('');
              }}
              style={{
                background: 'var(--card)',
                color: 'var(--ink)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '4px 12px',
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {he.workspace.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
