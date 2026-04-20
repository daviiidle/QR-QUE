import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentShopMember } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";

const NAV = [
  { href: "/dashboard",            label: "Orders" },
  { href: "/dashboard/menu",       label: "Menu" },
  { href: "/dashboard/modifiers",  label: "Modifiers" },
  { href: "/dashboard/analytics",  label: "Analytics" },
  { href: "/dashboard/settings",   label: "Settings" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const member = await getCurrentShopMember();
  if (!member) redirect("/login");

  return (
    <div className="min-h-dvh bg-neutral-50">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6 overflow-x-auto">
            <Link href="/dashboard" className="shrink-0 font-semibold">QR QUE</Link>
            <nav className="flex gap-4 text-sm text-neutral-600">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-neutral-900">{n.label}</Link>
              ))}
            </nav>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="text-sm text-neutral-500 hover:text-neutral-800">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
    </div>
  );
}
