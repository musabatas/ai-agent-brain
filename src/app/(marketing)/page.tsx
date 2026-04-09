import Link from 'next/link';
import {
  ArrowRight,
  Brain,
  ChevronRight,
  FileText,
  FolderKanban,
  Gavel,
  GitBranch,
  Key,
  ListTodo,
  PlugZap,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Dev Brain — Project Intelligence for AI-Assisted Development',
};

export default function HomePage() {
  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden pt-14">
        {/* Ambient gradient */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 0%, oklch(50% 0 0 / 0.03) 0%, transparent 70%)',
          }}
        />

        <div className="relative mx-auto max-w-[980px] px-6 pb-4 pt-20 text-center md:pt-28 lg:px-4">
          {/* Pill badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/40 px-3 py-1 text-xs text-muted-foreground">
            <Zap className="size-3" />
            <span>Now with MCP Streamable HTTP</span>
            <ChevronRight className="size-3 opacity-40" />
          </div>

          {/* Headline */}
          <h1 className="mx-auto max-w-[720px] text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-[-0.035em] text-foreground">
            The persistent brain your AI agents need.
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-[540px] text-[clamp(1rem,2vw,1.25rem)] leading-relaxed text-muted-foreground">
            Structured project intelligence that both humans visualize and AI
            agents query via{' '}
            <span className="font-medium text-foreground">
              Model Context Protocol
            </span>
            .
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2.5 rounded-full bg-foreground px-7 py-3 text-sm font-medium text-background transition-all hover:opacity-85"
            >
              Get Started Free
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              See how it works
            </Link>
          </div>
        </div>

        {/* ─── Terminal Block ─── */}
        <div className="relative mx-auto mt-12 max-w-[720px] px-6 pb-24 md:mt-16 lg:px-4">
          {/* Glow behind terminal */}
          <div
            className="pointer-events-none absolute inset-x-12 -bottom-8 top-8 rounded-3xl opacity-[0.03]"
            style={{
              background:
                'radial-gradient(ellipse at 50% 40%, oklch(50% 0 0) 0%, transparent 70%)',
            }}
          />

          <div className="relative overflow-hidden rounded-2xl border border-zinc-200/70 shadow-[0_8px_40px_-12px_oklch(0%_0_0/0.12)] dark:border-zinc-800/70 dark:shadow-[0_8px_40px_-12px_oklch(0%_0_0/0.5)]">
            {/* Title bar */}
            <div className="flex items-center gap-2 border-b border-zinc-200/50 bg-zinc-100/80 px-4 py-2.5 dark:border-zinc-800/50 dark:bg-zinc-900/80">
              <div className="flex items-center gap-1.5">
                <div className="size-[10px] rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <div className="size-[10px] rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <div className="size-[10px] rounded-full bg-zinc-300 dark:bg-zinc-700" />
              </div>
              <span className="ml-2 text-[11px] text-zinc-400 dark:text-zinc-600">
                Terminal — claude-code
              </span>
            </div>

            {/* Terminal body */}
            <div className="bg-zinc-950 px-5 py-5 font-[family-name:var(--font-mono)] text-[13px] leading-7 text-zinc-400">
              <div>
                <span className="text-zinc-600">~</span>
                <span className="text-zinc-600"> $ </span>
                <span className="text-zinc-200">claude</span>{' '}
                <span className="text-zinc-500">
                  &quot;What decisions were made about auth?&quot;
                </span>
              </div>
              <div className="mt-4 text-zinc-600">
                ● Querying AI Dev Brain via MCP…
              </div>
              <div className="mt-3 border-l-2 border-zinc-800 pl-3">
                <div>
                  <span className="text-zinc-200">Decision #3</span>
                  <span className="text-zinc-700"> — </span>
                  <span className="text-zinc-500">
                    Use dual auth: session cookies for web UI, API keys for MCP
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-zinc-200">Decision #7</span>
                  <span className="text-zinc-700"> — </span>
                  <span className="text-zinc-500">
                    PostgreSQL full-text search over Elasticsearch for v1
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-zinc-200">Rule #2</span>
                  <span className="text-zinc-700"> — </span>
                  <span className="text-zinc-500">
                    All API routes must support both session and API key auth
                  </span>
                </div>
              </div>
              <div className="mt-3 text-emerald-600">
                ✓ 3 items loaded into context
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Logos / Entity strip ─── */}
      <section className="border-y border-border/20 bg-muted/30">
        <div className="mx-auto flex max-w-[980px] flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 py-6 lg:px-4">
          {[
            { icon: FolderKanban, label: 'Features' },
            { icon: ListTodo, label: 'Tasks' },
            { icon: Gavel, label: 'Decisions' },
            { icon: ScrollText, label: 'Rules' },
            { icon: FileText, label: 'Documents' },
            { icon: Brain, label: 'Memory' },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 text-xs tracking-wide text-muted-foreground/40"
            >
              <Icon className="size-3.5" />
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="overflow-hidden">
        <div className="mx-auto max-w-[980px] px-6 py-24 md:py-32 lg:px-4">
          <div className="mx-auto mb-16 max-w-[560px] text-center">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
              Capabilities
            </p>
            <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-tight tracking-[-0.03em] text-foreground">
              Everything your AI
              <br />
              needs to know.
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              A structured knowledge layer between your team and your AI tools.
              Persistent, queryable, always up to date.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: FolderKanban,
                title: 'Structured Intelligence',
                desc: 'Organize features, tasks, decisions, rules, and documents in one hub that both humans and AI understand.',
              },
              {
                icon: PlugZap,
                title: 'Native MCP',
                desc: 'Claude Code and Cursor connect directly via Model Context Protocol. No plugins, no glue code.',
              },
              {
                icon: Gavel,
                title: 'Decision Tracking',
                desc: 'Capture the "why" behind every architectural choice. AI queries past decisions before proposing new ones.',
              },
              {
                icon: ScrollText,
                title: 'Living Rules',
                desc: 'Define coding standards and constraints. AI agents respect your rules automatically, every session.',
              },
              {
                icon: Brain,
                title: 'Persistent Memory',
                desc: 'Project context that persists across sessions. No more re-explaining your codebase to every new conversation.',
              },
              {
                icon: ShieldCheck,
                title: 'Team-Aware',
                desc: 'Multi-team support with scoped API keys. Isolated project spaces with granular access control.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl border border-border/40 p-6 transition-all duration-300 hover:border-border/70 hover:bg-muted/20"
              >
                <div className="mb-4 inline-flex rounded-xl bg-muted/50 p-2.5 transition-colors group-hover:bg-muted/80">
                  <Icon className="size-[18px] text-foreground/70" />
                </div>
                <h3 className="mb-1.5 text-[15px] font-semibold tracking-[-0.01em] text-foreground">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground/80">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MCP Section (dark panel) ─── */}
      <section
        id="mcp"
        className="border-y border-border/20 bg-zinc-950 text-zinc-100 dark:bg-zinc-900/40"
      >
        <div className="mx-auto max-w-[980px] px-6 py-24 md:py-32 lg:px-4">
          <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
            {/* Left copy */}
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-widest text-zinc-500">
                Integration
              </p>
              <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight tracking-[-0.03em] text-white">
                One config.
                <br />
                Instant connection.
              </h2>
              <p className="mt-4 max-w-[380px] text-[15px] leading-relaxed text-zinc-400">
                Generate an API key, drop the MCP config into your AI tool.
                Your agents gain persistent access to every decision, rule, and
                context in your project.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {['Claude Code', 'Cursor', 'Windsurf'].map((tool) => (
                  <span
                    key={tool}
                    className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-500"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — config snippet */}
            <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/50">
              <div className="border-b border-zinc-800/60 px-4 py-2.5">
                <span className="text-[11px] text-zinc-600">
                  mcp.json
                </span>
              </div>
              <pre className="overflow-x-auto px-5 py-5 font-[family-name:var(--font-mono)] text-[12px] leading-6 text-zinc-400">
                <code>{`{
  "mcpServers": {
    "ai-dev-brain": {
      "type": "streamable-http",
      "url": "https://your-instance.app/api/mcp",
      "headers": {
        "Authorization": "Bearer adb_sk_..."
      }
    }
  }
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works">
        <div className="mx-auto max-w-[980px] px-6 py-24 md:py-32 lg:px-4">
          <div className="mx-auto mb-20 max-w-[560px] text-center">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
              Get started
            </p>
            <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-tight tracking-[-0.03em] text-foreground">
              Up and running
              <br />
              in minutes.
            </h2>
          </div>

          <div className="mx-auto grid max-w-[840px] gap-0 md:grid-cols-3">
            {[
              {
                num: '01',
                icon: FolderKanban,
                title: 'Create your project',
                desc: 'Define features, tasks, decisions, and rules. Build the knowledge base your AI needs.',
              },
              {
                num: '02',
                icon: Key,
                title: 'Connect via MCP',
                desc: 'Generate an API key. Drop the config into Claude Code or Cursor. One-time setup.',
              },
              {
                num: '03',
                icon: Sparkles,
                title: 'AI remembers everything',
                desc: 'Your agents query context, respect rules, and build on past decisions — automatically.',
              },
            ].map(({ num, icon: Icon, title, desc }, i) => (
              <div
                key={num}
                className="relative flex flex-col items-center px-6 py-8 text-center md:py-0"
              >
                {/* Connector line */}
                {i < 2 && (
                  <div className="absolute right-0 top-1/2 hidden h-px w-full -translate-y-1/2 md:block">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
                  </div>
                )}

                <div className="relative mb-5 flex size-16 items-center justify-center rounded-2xl border border-border/50 bg-muted/30">
                  <Icon className="size-6 text-foreground/70" />
                </div>
                <span className="mb-3 font-[family-name:var(--font-mono)] text-[11px] font-bold tracking-widest text-muted-foreground/30">
                  {num}
                </span>
                <h3 className="mb-2 text-[15px] font-semibold tracking-[-0.01em] text-foreground">
                  {title}
                </h3>
                <p className="max-w-[240px] text-sm leading-relaxed text-muted-foreground/80">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Built for Teams ─── */}
      <section className="border-t border-border/20 bg-muted/20">
        <div className="mx-auto max-w-[980px] px-6 py-24 md:py-32 lg:px-4">
          <div className="mx-auto mb-16 max-w-[560px] text-center">
            <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight tracking-[-0.03em] text-foreground">
              Built for teams that ship.
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Every engineer on your team gets consistent AI context. Every AI
              tool respects the same rules.
            </p>
          </div>

          <div className="mx-auto grid max-w-[720px] gap-4 md:grid-cols-3">
            {[
              {
                icon: Users,
                title: 'Multi-team',
                desc: 'Scoped workspaces with isolated projects and permissions.',
              },
              {
                icon: Key,
                title: 'API Keys',
                desc: 'Per-team keys for MCP. Rotate, revoke, audit — you control access.',
              },
              {
                icon: GitBranch,
                title: 'Dual Auth',
                desc: 'Session cookies for the web UI, Bearer tokens for MCP agents.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-border/30 bg-background p-6 text-center"
              >
                <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-muted/50">
                  <Icon className="size-[18px] text-foreground/60" />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-foreground">
                  {title}
                </h3>
                <p className="text-[13px] leading-relaxed text-muted-foreground/70">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="border-t border-border/20">
        <div className="mx-auto max-w-[980px] px-6 py-28 text-center md:py-36 lg:px-4">
          <h2 className="mx-auto max-w-[600px] text-[clamp(1.75rem,4.5vw,3rem)] font-bold leading-[1.1] tracking-[-0.035em] text-foreground">
            Start building your
            <br />
            project brain.
          </h2>
          <p className="mx-auto mt-5 max-w-[440px] text-base text-muted-foreground">
            Give your AI agents the context they need. Free to start, built for
            teams that ship.
          </p>
          <div className="mt-10">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2.5 rounded-full bg-foreground px-8 py-3.5 text-sm font-medium text-background transition-opacity hover:opacity-85"
            >
              Get Started Free
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
