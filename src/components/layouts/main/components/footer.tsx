'use client';

export function Footer() {
  return (
    <footer className="px-4 lg:px-6 py-4">
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>{new Date().getFullYear()} AI Dev Brain</span>
        <nav className="flex gap-4">
          <a href="#" className="hover:text-foreground transition-colors">Docs</a>
          <a href="#" className="hover:text-foreground transition-colors">Support</a>
        </nav>
      </div>
    </footer>
  );
}
