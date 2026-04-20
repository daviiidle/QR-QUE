"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

const LoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(200),
});

export async function loginAction(_prev: { error?: string } | null, formData: FormData) {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const sb = await supabaseServer();
  const { error } = await sb.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function logoutAction() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect("/login");
}
