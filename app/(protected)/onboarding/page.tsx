'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import {
  Brain,
  Check,
  Copy,
  FolderKanban,
  Key,
  Plug,
  Users,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { apiFetch } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const steps = [
  { icon: Users, label: 'Organization' },
  { icon: FolderKanban, label: 'Project' },
  { icon: Plug, label: 'Connect' },
];

const OrgSchema = z.object({
  orgName: z.string().min(2).max(50),
});

const ProjectSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});

export default function OnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [orgId, setOrgId] = useState<string | null>(
    session?.user?.defaultOrgId ?? null,
  );
  const [projectSlug, setProjectSlug] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const userName = session?.user?.name?.split(' ')[0] || 'there';

  // Step 1: Create organization
  const orgForm = useForm({
    resolver: zodResolver(OrgSchema),
    defaultValues: { orgName: `${userName}'s Organization` },
  });

  const createOrg = useMutation({
    mutationFn: async (values: { orgName: string }) => {
      const res = await apiFetch('/api/orgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: values.orgName }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create organization');
      }
      const json = await res.json();
      const newOrgId = json.data?.id;
      setOrgId(newOrgId);
      if (newOrgId) {
        document.cookie = `adb-org-id=${newOrgId}; path=/; max-age=31536000; samesite=lax${location.protocol === 'https:' ? '; secure' : ''}`;
      }
      return json;
    },
    onSuccess: () => setStep(1),
    onError: (e: Error) => toast.error(e.message),
  });

  // Step 2: Create project
  const projectForm = useForm({
    resolver: zodResolver(ProjectSchema),
    defaultValues: { name: '', description: '' },
  });

  const createProject = useMutation({
    mutationFn: async (values: { name: string; description?: string }) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (orgId) headers['X-Org-Id'] = orgId;
      const res = await apiFetch('/api/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error('Failed to create project');
      const json = await res.json();
      setProjectSlug(json.data?.slug ?? null);
      return json;
    },
    onSuccess: async () => {
      // Auto-create an API key for MCP
      const oid = orgId || session?.user?.defaultOrgId;
      if (oid) {
        try {
          const res = await apiFetch(`/api/orgs/${oid}/api-keys`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'MCP - Default' }),
          });
          if (res.ok) {
            const json = await res.json();
            setApiKey(json.data?.key ?? null);
          }
        } catch {
          // Non-critical — user can create key later
        }
      }
      setStep(2);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleCopy = async () => {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mcpConfig = JSON.stringify(
    {
      mcpServers: {
        'ai-dev-brain': {
          type: 'http',
          url: `${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/mcp`,
          headers: {
            Authorization: `Bearer ${apiKey || 'YOUR_API_KEY'}`,
          },
        },
      },
    },
    null,
    2,
  );

  return (
    <div className="adb-onboard-bg adb-dotgrid min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[520px] space-y-8 adb-fade-in">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center size-12 rounded-xl bg-primary/10 adb-pulse">
            <Brain className="size-6 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome to AI Dev Brain
          </h1>
          <p className="text-sm text-muted-foreground">
            Set up your project intelligence hub in 3 steps.
          </p>
        </div>

        {/* Step Indicator — Connected Nodes */}
        <div className="flex items-center justify-center gap-0">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center">
              {/* Node */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex items-center justify-center size-9 rounded-full border-2 transition-all duration-300 ${
                    i < step
                      ? 'bg-primary border-primary text-white'
                      : i === step
                        ? 'border-primary text-primary adb-pulse'
                        : 'border-border text-muted-foreground'
                  }`}
                >
                  {i < step ? (
                    <Check className="size-4" />
                  ) : (
                    <s.icon className="size-4" />
                  )}
                </div>
                <span
                  className={`text-[11px] font-medium transition-colors ${
                    i <= step ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div
                  className={`w-16 h-0.5 mx-2 mb-5 rounded-full transition-colors duration-300 ${
                    i < step ? 'bg-primary' : 'bg-border'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content Cards */}
        {step === 0 && (
          <div className="adb-stat-card rounded-xl p-6 adb-fade-in">
            <div className="space-y-1 mb-6">
              <h2 className="text-base font-semibold text-foreground">
                Create your organization
              </h2>
              <p className="text-sm text-muted-foreground">
                Organizations hold your projects, members, and API keys.
              </p>
            </div>
            <form
              onSubmit={orgForm.handleSubmit((v) => createOrg.mutate(v))}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label className="text-sm">Organization Name</Label>
                <Input
                  {...orgForm.register('orgName')}
                  placeholder="e.g. My Startup"
                  className="h-11"
                />
              </div>
              <Button
                type="submit"
                disabled={createOrg.isPending}
                className="h-10"
              >
                {createOrg.isPending ? 'Creating...' : 'Create Organization'}
              </Button>
            </form>
          </div>
        )}

        {step === 1 && (
          <div className="adb-stat-card rounded-xl p-6 adb-fade-in">
            <div className="space-y-1 mb-6">
              <h2 className="text-base font-semibold text-foreground">
                Create your first project
              </h2>
              <p className="text-sm text-muted-foreground">
                Projects contain features, tasks, decisions, rules, and memory —
                everything your AI agents need.
              </p>
            </div>
            <form
              onSubmit={projectForm.handleSubmit((v) =>
                createProject.mutate(v),
              )}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label className="text-sm">Project Name</Label>
                <Input
                  {...projectForm.register('name')}
                  placeholder="e.g. My App"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Description (optional)</Label>
                <Textarea
                  {...projectForm.register('description')}
                  placeholder="What is this project about?"
                  rows={3}
                />
              </div>
              <Button
                type="submit"
                disabled={createProject.isPending}
                className="h-10"
              >
                {createProject.isPending ? 'Creating...' : 'Create Project'}
              </Button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="adb-stat-card rounded-xl p-6 adb-fade-in">
            <div className="flex items-center gap-2.5 mb-1">
              <Key className="size-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">
                Connect your AI tools via MCP
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Add this to your Claude Code, Cursor, or any MCP-compatible tool.
            </p>

            <div className="space-y-5">
              {apiKey && (
                <div className="space-y-2">
                  <Label className="text-sm">Your API Key</Label>
                  <div className="flex items-center gap-2">
                    <code className="adb-mono flex-1 bg-muted px-3 py-2.5 rounded-md text-xs break-all">
                      {apiKey}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopy}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="size-3.5" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-destructive">
                    Save this key now — it won&apos;t be shown again.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm">MCP Configuration</Label>
                <pre className="adb-mono bg-zinc-950 text-zinc-300 p-4 rounded-lg text-xs overflow-x-auto border border-zinc-800">
                  <code>
                    {mcpConfig.split('\n').map((line, i) => (
                      <span key={i} className="block">
                        {line
                          .replace(/("[\w-]+")\s*:/g, '<key>$1</key>:')
                          .split(/(<key>.*?<\/key>)/)
                          .map((part, j) =>
                            part.startsWith('<key>') ? (
                              <span key={j} className="text-primary">
                                {part.replace(/<\/?key>/g, '')}
                              </span>
                            ) : part.includes('"') ? (
                              <span key={j} className="text-amber-300">
                                {part}
                              </span>
                            ) : (
                              <span key={j}>{part}</span>
                            ),
                          )}
                      </span>
                    ))}
                  </code>
                </pre>
              </div>

              {projectSlug && (
                <div className="space-y-2">
                  <Label className="text-sm">Your Project Slug</Label>
                  <p className="text-xs text-muted-foreground">
                    Use this slug when calling MCP tools to target your project:
                  </p>
                  <code className="adb-mono block bg-muted px-3 py-2.5 rounded-md text-xs text-primary">
                    {projectSlug}
                  </code>
                  <p className="text-[11px] text-muted-foreground/60">
                    Example: <code className="adb-mono">task.create</code>{' '}
                    with <code className="adb-mono">project: &quot;{projectSlug}&quot;</code>
                  </p>
                </div>
              )}

              <div className="text-xs text-muted-foreground space-y-1.5">
                <p>
                  <Badge variant="outline" className="text-[10px] mr-1.5">
                    Claude Code
                  </Badge>
                  Add to <code className="adb-mono">.mcp.json</code> in your
                  project root
                </p>
                <p>
                  <Badge variant="outline" className="text-[10px] mr-1.5">
                    Cursor
                  </Badge>
                  Add to MCP settings in Cursor preferences
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <Button onClick={() => router.push('/dashboard')} className="h-10">
                  Go to Dashboard
                </Button>
                <Button
                  variant="outline"
                  className="h-10"
                  onClick={() => router.push('/projects')}
                >
                  View Projects
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
