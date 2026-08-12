import { LoginForm } from "@/app/login/login-form";

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "ההתחברות נכשלה. נסה שוב.",
  auth_failed: "ההתחברות נכשלה. נסה שוב.",
  no_profile: "לחשבון הזה אין עדיין הרשאה במערכת. פנה למנהל.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">התחברות</h1>
        <p className="mt-2 text-sm text-neutral-600">פוטואקטיב, תיקי עבודות</p>
      </div>
      {error && ERROR_MESSAGES[error] && (
        <p className="text-center text-sm text-red-600">
          {ERROR_MESSAGES[error]}
        </p>
      )}
      <LoginForm />
    </main>
  );
}
