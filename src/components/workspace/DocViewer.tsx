'use client';

import { useRef, useCallback } from 'react';
import { ANNOTATION_TYPES } from '@/lib/constants';
import type { AnnotationItem, TextSelection } from '@/lib/types';

interface DocViewerProps {
  text: string;
  annotations: AnnotationItem[];
  activeId: string | null;
  onSelect: (sel: TextSelection) => void;
  onClickAnnotation: (id: string) => void;
}

export function DocViewer({
  text,
  annotations,
  activeId,
  onSelect,
  onClickAnnotation,
}: DocViewerProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !ref.current) return;
    const range = sel.getRangeAt(0);
    const pre = document.createRange();
    pre.selectNodeContents(ref.current);
    pre.setEnd(range.startContainer, range.startOffset);
    const start = pre.toString().length;
    const end = start + sel.toString().length;
    const txt = sel.toString();
    if (txt.trim().length > 2) onSelect({ start, end, text: txt });
  }, [onSelect]);

  const render = () => {
    if (!text) return null;
    if (!annotations.length) return <span>{text}</span>;

    const sorted = [...annotations].sort(
      (a, b) => a.locationStart - b.locationStart
    );
    const parts: React.ReactNode[] = [];
    let cursor = 0;

    sorted.forEach((ann, i) => {
      if (ann.locationStart > cursor) {
        parts.push(
          <span key={`t${i}`}>{text.slice(cursor, ann.locationStart)}</span>
        );
      }
      const t = ANNOTATION_TYPES.find((x) => x.id === ann.type);
      const color = t?.color ?? '#999';
      const isActive = activeId === ann.id;

      parts.push(
        <span
          key={ann.id}
          onClick={(e) => {
            e.stopPropagation();
            onClickAnnotation(ann.id);
          }}
          style={{
            backgroundColor: color + (isActive ? '30' : '16'),
            borderBottom: `2px solid ${color}`,
            padding: '1px 1px',
            borderRadius: '2px',
            cursor: 'pointer',
            outline: isActive ? `2px solid ${color}` : 'none',
            outlineOffset: '1px',
            transition: 'all 0.2s',
          }}
        >
          {text.slice(ann.locationStart, ann.locationEnd)}
        </span>
      );
      cursor = ann.locationEnd;
    });

    if (cursor < text.length) {
      parts.push(<span key="end">{text.slice(cursor)}</span>);
    }
    return parts;
  };

  return (
    <div
      ref={ref}
      onMouseUp={handleMouseUp}
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: '15.5px',
        lineHeight: '2',
        color: 'var(--ink)',
        whiteSpace: 'pre-wrap',
        userSelect: 'text',
        cursor: 'text',
        direction: 'rtl',
        textAlign: 'right',
      }}
    >
      {render()}
    </div>
  );
}
