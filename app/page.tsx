import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-bold tracking-tight">QR QUE</h1>
      <p className="mt-3 text-lg text-neutral-600">
        Scan-to-order bubble tea. No app. No line.
      </p>
      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        <Link href="/dashboard" className="card hover:border-brand-400">
          <div className="font-semibold">I run a shop</div>
          <div className="text-sm text-neutral-600">Manage menu & orders</div>
        </Link>
        <div className="card">
          <div className="font-semibold">Customer?</div>
          <div className="text-sm text-neutral-600">Scan the QR at the counter.</div>
        </div>
      </div>
    </main>
  );
}
