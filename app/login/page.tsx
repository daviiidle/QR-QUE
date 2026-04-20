import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { LoginForm } from "./_components/LoginForm";

export default async function LoginPage() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm items-center px-6">
      <div className="w-full">
        <h1 className="mb-1 text-2xl font-semibold">Sign in</h1>
        <p className="mb-6 text-sm text-neutral-500">Shop owner / staff only.</p>
        <LoginForm />
      </div>
    </main>
  );
}
