"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeftIcon, AtSignIcon, ShieldCheckIcon } from "lucide-react";

import { AuthDivider } from "@/components/auth-divider";
import { FloatingPaths } from "@/components/floating-paths";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import type { AdminDeviceFingerprint } from "@/lib/admin/device-fingerprint";
import { collectAdminDeviceFingerprint, describeAdminDevice } from "@/lib/admin/device-fingerprint";
import { useAdminStore } from "@/lib/admin/store";
import type { AdminSessionPayload } from "@/lib/admin/session-shared";

type LoginStep = "request" | "verify";

export function AdminLoginPage() {
  const router = useRouter();
  const setSession = useAdminStore((state) => state.setSession);
  const [step, setStep] = useState<LoginStep>("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [device, setDevice] = useState<AdminDeviceFingerprint | null>(null);
  const [isPending, setIsPending] = useState(false);
  const normalizedEmail = email.trim().toLowerCase();
  const canSubmit = useMemo(() => {
    if (step === "request") {
      return Boolean(normalizedEmail);
    }
    return /^\d{6}$/.test(otp.trim());
  }, [normalizedEmail, otp, step]);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCooldown((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) {
      return;
    }

    setError("");
    setIsPending(true);

    try {
      const activeDevice = device ?? (await collectAdminDeviceFingerprint());
      setDevice(activeDevice);

      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          action: step === "request" ? "request_otp" : "verify_otp",
          device_fingerprint: activeDevice,
          device_id: activeDevice.device_id,
          device_name: describeAdminDevice(activeDevice),
          device_type: activeDevice.device_type,
          email: normalizedEmail,
          otp: step === "verify" ? otp.trim() : undefined,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as AdminSessionPayload & {
        challenge?: "otp";
      };

      if (!response.ok) {
        setError(data.error || data.code || "Unable to sign in.");
        return;
      }

      if (step === "request") {
        setStep("verify");
        setOtp("");
        setCooldown(60);
        return;
      }

      if (!data.ok) {
        setError(data.error || data.code || "Unable to sign in.");
        return;
      }

      setSession(data);
      router.replace(data.redirectTo ?? "/admin");
    } catch {
      setError("Unable to reach the auth service.");
    } finally {
      setIsPending(false);
    }
  }

  async function onResend() {
    if (isPending || cooldown > 0) {
      return;
    }

    setError("");
    setIsPending(true);

    try {
      const activeDevice = device ?? (await collectAdminDeviceFingerprint());
      setDevice(activeDevice);

      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          action: "request_otp",
          device_fingerprint: activeDevice,
          device_id: activeDevice.device_id,
          device_name: describeAdminDevice(activeDevice),
          device_type: activeDevice.device_type,
          email: normalizedEmail,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };

      if (!response.ok) {
        setError(data.error || data.code || "Unable to resend code.");
        return;
      }

      setCooldown(60);
    } catch {
      setError("Unable to reach the auth service.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background lg:grid lg:grid-cols-2">
      <section className="relative hidden min-h-screen flex-col border-r border-r-[#d8dde3] bg-secondary p-10 lg:flex">
        <Logo className="mr-auto" />
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
        <div className="relative z-10 mt-auto max-w-md">
          <div className="mb-4 inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium">
            <ShieldCheckIcon data-icon="inline-start" />
            Admin access
          </div>
          <h1 className="text-3xl font-bold tracking-wide">Stoxify Control Console</h1>
          <p className="mt-3 text-muted-foreground">
            Sign in with your admin email. Authentication stays on the current backend flow and the
            admin session is granted only after the RBAC gate passes.
          </p>
        </div>
      </section>

      <section className="relative flex min-h-screen flex-col justify-center px-6 py-10">
        <Button
          className="absolute left-5 top-7"
          variant="ghost"
          render={<Link href="/" />}
          nativeButton={false}
        >
          Back home
        </Button>

        <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
          <Logo className="lg:hidden" />
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold tracking-wide">
              {step === "request" ? "Admin Login" : "Enter Verification Code"}
            </h2>
            <p className="text-base text-muted-foreground">
              {step === "request"
                ? "Use your admin email to receive a one-time sign-in code."
                : `Enter the 6-digit code sent to ${normalizedEmail}.`}
            </p>
          </div>

          <AuthDivider>SECURE SIGN IN</AuthDivider>

          <form aria-busy={isPending} className="flex flex-col gap-3" onSubmit={onSubmit}>
            {step === "request" ? (
              <InputGroup>
                <InputGroupInput
                  autoComplete="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@stoxify.com"
                  type="email"
                  value={email}
                />
                <InputGroupAddon align="inline-start">
                  <AtSignIcon />
                </InputGroupAddon>
              </InputGroup>
            ) : (
              <>
                <Input
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6-digit code"
                  value={otp}
                />

                <div className="flex items-center justify-between text-sm">
                  <Button
                    className="px-0"
                    disabled={isPending}
                    onClick={() => {
                      setStep("request");
                      setOtp("");
                      setError("");
                    }}
                    type="button"
                    variant="link"
                  >
                    <ArrowLeftIcon className="size-4" />
                    Change email
                  </Button>

                  <Button
                    className="px-0"
                    disabled={isPending || cooldown > 0}
                    onClick={onResend}
                    type="button"
                    variant="link"
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                  </Button>
                </div>
              </>
            )}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button className="w-full" disabled={!canSubmit || isPending} type="submit">
              {isPending
                ? step === "request"
                  ? "Sending code..."
                  : "Verifying..."
                : step === "request"
                  ? "Send code"
                  : "Verify and sign in"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
