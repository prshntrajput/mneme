import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="max-w-2xl text-center">
        <h1 className="mb-4 text-5xl font-bold tracking-tight">Mneme</h1>
        <p className="mb-2 text-xl text-gray-500">Close every tab. Forget nothing.</p>
        <p className="mb-8 text-gray-400">
          Your AI memory layer for the browser — automatically captures, understands, and recalls
          everything you browse.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/login"
            className="bg-foreground text-background rounded-lg px-6 py-3 font-medium transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
          <Link
            href="/library"
            className="border-foreground/20 hover:border-foreground/50 rounded-lg border px-6 py-3 font-medium transition-colors"
          >
            Open dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
