'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Copy, Plug, Terminal } from 'lucide-react';
import { useProject } from '../components/project-context';

export default function McpConfigPage() {
  const { project, isLoading } = useProject();
  const [copied, setCopied] = useState<string | null>(null);

  const slug = project?.slug ?? '';
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://your-domain.com';

  const mcpConfig = JSON.stringify(
    {
      mcpServers: {
        'ai-dev-brain': {
          type: 'http',
          url: `${origin}/api/mcp`,
          headers: {
            Authorization: 'Bearer YOUR_API_KEY',
            'X-Project-Slug': slug,
          },
        },
      },
    },
    null,
    2,
  );

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyBtn = ({ textKey, text }: { textKey: string; text: string }) => (
    <button
      onClick={() => handleCopy(text, textKey)}
      className="flex items-center gap-1 text-[11px] text-muted-foreground/50 hover:text-foreground transition-colors cursor-pointer"
    >
      {copied === textKey ? (
        <>
          <Check className="size-3 text-primary" />
          <span className="text-primary">Copied</span>
        </>
      ) : (
        <>
          <Copy className="size-3" />
          <span>Copy</span>
        </>
      )}
    </button>
  );

  if (isLoading || !slug) return null;

  return (
    <div className="adb-fade-in space-y-6 max-w-2xl">
      {/* Intro */}
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Plug className="size-4.5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            MCP Configuration
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Connect AI agents to this project via the Model Context Protocol.
          </p>
        </div>
      </div>

      {/* 1. Server Config */}
      <div className="adb-project-card rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="size-3.5 text-muted-foreground/50" />
            <p className="text-xs font-medium text-foreground">
              MCP Server Config
            </p>
          </div>
          <CopyBtn textKey="config" text={mcpConfig} />
        </div>
        <pre className="adb-mono bg-zinc-950 text-zinc-300 p-4 rounded-lg text-[11px] overflow-x-auto border border-zinc-800 leading-relaxed">
          {mcpConfig}
        </pre>
        <p className="text-[11px] text-muted-foreground/50">
          Add to <code className="adb-mono">.mcp.json</code> (Claude Code) or
          MCP settings (Cursor). Replace{' '}
          <code className="adb-mono text-amber-400/70">YOUR_API_KEY</code> with
          a key from{' '}
          <Link
            href="/org/api-keys"
            className="text-primary/70 hover:text-primary underline underline-offset-2"
          >
            Organization → API Keys
          </Link>
          .
        </p>
      </div>

      {/* How it works */}
      <div className="adb-project-card rounded-xl p-5 space-y-3">
        <p className="text-xs font-medium text-foreground">How it works</p>
        <div className="text-[12px] text-muted-foreground/70 space-y-2 leading-relaxed">
          <p>
            The <code className="adb-mono text-primary/70">X-Project-Slug</code>{' '}
            header sets the default project for all MCP tool calls. Tools can
            still override it by passing an explicit{' '}
            <code className="adb-mono text-primary/70">project</code> parameter.
          </p>
          <p>
            This means your AI agent doesn&apos;t need to specify the project on
            every single tool call — it&apos;s configured once in the MCP
            connection.
          </p>
        </div>
      </div>

      {/* Quick reference */}
      <div className="flex items-center gap-4 px-1">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/40 mb-0.5">
            Project Slug
          </p>
          <code className="adb-mono text-sm text-primary font-medium">
            {slug}
          </code>
        </div>
        <CopyBtn textKey="slug" text={slug} />
      </div>
    </div>
  );
}
