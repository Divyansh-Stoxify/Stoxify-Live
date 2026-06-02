"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { AtSignIcon, LockKeyholeIcon, ShieldCheckIcon } from "lucide-react";

import { AuthDivider } from "@/components/auth-divider";
import { FloatingPaths } from "@/components/floating-paths";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  collectAdminDeviceFingerprint,
  describeAdminDevice,
} from "@/lib/admin/device-fingerprint";
import { useAdminStore } from "@/lib/admin/store";
import type { AdminSessionPayload } from "@/lib/admin/session-shared";

export function AdminLoginPage() {
  const router = useRouter();
  const setSession = useAdminStore((state) => state.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const canSubmit = useMemo(() => email.trim() && password.trim(), [email, password]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) {
      return;
    }

    setError("");
    setIsPending(true);

    try {
      const device = await collectAdminDeviceFingerprint();
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_fingerprint: device,
          device_id: device.device_id,
          device_name: describeAdminDevice(device),
          device_type: device.device_type,
          email: email.trim(),
          password,
        }),
      });
      const data = (await response.json()) as AdminSessionPayload;

      if (!response.ok || !data.ok) {
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
            Sign in with an existing Stoxify admin account. Authentication is routed through the
            current backend auth service.
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
            <h2 className="text-2xl font-bold tracking-wide">Admin Login</h2>
            <p className="text-base text-muted-foreground">
              Use your existing Stoxify credentials.
            </p>
          </div>

          <AuthDivider>SECURE SIGN IN</AuthDivider>

          <form aria-busy={isPending} className="flex flex-col gap-3" onSubmit={onSubmit}>
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

            <InputGroup>
              <InputGroupInput
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                type="password"
                value={password}
              />
              <InputGroupAddon align="inline-start">
                <LockKeyholeIcon />
              </InputGroupAddon>
            </InputGroup>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button className="w-full" disabled={!canSubmit || isPending} type="submit">
              {isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
