import { SetPasswordForm } from "@/app/admin/set-password/set-password-form";

export default function SetPasswordPage() {
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">קביעת סיסמה</h1>
        <p className="mt-1 text-sm text-neutral-600">
          ברוך הבא לפוטואקטיב. לפני שממשיכים, צריך לקבוע סיסמה לחשבון שלך.
        </p>
      </div>
      <SetPasswordForm />
    </div>
  );
}
