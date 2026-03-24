import Link from "next/link";

export const metadata = {
  title: "404 — Not Found | EmberOS",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <span className="text-accent font-mono text-sm tracking-[0.3em] uppercase mb-6">
        Error 404
      </span>
      <h1 className="text-8xl md:text-[160px] font-display font-black text-text leading-none tracking-tighter mb-6">
        LOST.
      </h1>
      <p className="text-text-muted text-lg max-w-md mb-10">
        This page doesn't exist in the system. It may have been moved, deleted,
        or never initialized.
      </p>
      <Link
        href="/"
        className="px-8 py-4 bg-accent text-bg font-bold rounded-full hover:bg-accent/80 transition-colors tracking-wide uppercase text-sm"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
