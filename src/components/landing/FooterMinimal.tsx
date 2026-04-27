export function FooterMinimal() {
  return (
    <footer className="bg-white border-t border-floatchat-border text-xs text-floatchat-inkMuted py-6">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row gap-4 md:gap-8 items-center justify-between">
        <div className="flex gap-4">
          <a className="hover:text-floatchat-primary" href="/about">About</a>
          <a className="hover:text-floatchat-primary" href="/docs">Docs</a>
          <a className="hover:text-floatchat-primary" href="https://github.com/">GitHub</a>
        </div>
        <div className="opacity-70">© {new Date().getFullYear()} FloatChat Prototype</div>
      </div>
    </footer>
  );
}
