import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold tracking-[-0.5px] text-[var(--ink)] mb-3">
          Forgot your password?
        </h1>
        <p className="text-[13px] leading-relaxed text-[var(--muted)] mb-6">
          Password reset is coming soon. In the meantime, contact us for help accessing your
          account.
        </p>
        <Link
          className="inline-block rounded-lg bg-[var(--brand)] px-5 py-2.5 text-[13.5px] font-bold text-white hover:bg-[var(--brand-dark)] transition-colors"
          href="/login"
        >
          Back to Login
        </Link>
      </div>
    </main>
  );
}
