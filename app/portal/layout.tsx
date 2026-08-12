import { LogoutButton } from "@/app/logout-button";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
        <span className="font-bold">פוטואקטיב</span>
        <LogoutButton />
      </header>
      <main className="mx-auto max-w-2xl p-6">{children}</main>
    </div>
  );
}
