import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center justify-center px-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold">Not found</h1>
        <p className="mt-2 text-neutral-500">
          The page or order you're looking for doesn't exist.
        </p>
        <Link href="/" className="btn-primary mt-6 inline-flex">Home</Link>
      </div>
    </main>
  );
}
