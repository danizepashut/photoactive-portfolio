import Link from "next/link";
import { LogoutButton } from "@/app/logout-button";

const NAV = [
  { href: "/admin", label: "דשבורד" },
  { href: "/admin/students", label: "תלמידים" },
  { href: "/admin/team", label: "צוות" },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
        <nav className="flex items-center gap-5">
          <span className="font-bold">פוטואקטיב · ניהול</span>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-neutral-600 hover:text-neutral-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <LogoutButton />
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
