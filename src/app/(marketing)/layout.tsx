import { ReactNode } from 'react';
import Link from 'next/link';
import { Brain } from 'lucide-react';

export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full w-full flex-col bg-background">
      {/* Navbar */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/30 bg-background/70 backdrop-blur-2xl backdrop-saturate-150">
        <nav className="mx-auto flex h-14 max-w-[980px] items-center justify-between px-6 lg:px-4">
          <a
            href="#"
            className="flex items-center gap-2 transition-opacity hover:opacity-70"
          >
            <Brain className="size-5 text-foreground" />
            <span className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
              AI Dev Brain
            </span>
          </a>

          <div className="hidden items-center gap-7 text-xs text-muted-foreground/80 md:flex">
            <a
              href="#features"
              className="transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="transition-colors hover:text-foreground"
            >
              How It Works
            </a>
            <a
              href="#mcp"
              className="transition-colors hover:text-foreground"
            >
              MCP
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/signin"
              className="text-xs text-muted-foreground/80 transition-colors hover:text-foreground"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-80"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/20">
        <div className="mx-auto max-w-[980px] px-6 py-5 lg:px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-muted-foreground/50">
              &copy; {new Date().getFullYear()} AI Dev Brain. Built for
              developers who ship with AI.
            </p>
            <div className="flex items-center gap-5 text-xs text-muted-foreground/50">
              <Link
                href="/signin"
                className="transition-colors hover:text-foreground"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="transition-colors hover:text-foreground"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
