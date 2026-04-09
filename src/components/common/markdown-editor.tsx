'use client';

import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });
const MDPreview = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default.Markdown),
  { ssr: false },
);

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
}

export function MarkdownEditor({
  value,
  onChange,
  height = 200,
}: MarkdownEditorProps) {
  const { resolvedTheme } = useTheme();

  return (
    <div data-color-mode={resolvedTheme === 'dark' ? 'dark' : 'light'}>
      <MDEditor
        value={value}
        onChange={(val) => onChange(val ?? '')}
        height={height}
        preview="edit"
      />
    </div>
  );
}

interface MarkdownPreviewProps {
  source: string;
  className?: string;
}

export function MarkdownPreview({ source, className }: MarkdownPreviewProps) {
  const { resolvedTheme } = useTheme();

  return (
    <div
      data-color-mode={resolvedTheme === 'dark' ? 'dark' : 'light'}
      className={className}
    >
      <MDPreview source={source} />
    </div>
  );
}
