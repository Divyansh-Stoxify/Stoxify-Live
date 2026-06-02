"use client";

import { useState } from "react";
import {
  ShieldIcon,
  UserIcon,
  KeyRoundIcon,
  LogOutIcon,
  MonitorSmartphoneIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminStore } from "@/lib/admin/store";
import { adminFetch } from "@/lib/admin/client-api";

export function ProfilePage() {
  const user = useAdminStore((state) => state.user);
  const roles = useAdminStore((state) => state.roles);
  const powers = useAdminStore((state) => state.powers);
  const isLoading = useAdminStore((state) => state.isLoading);
  const isHydrated = useAdminStore((state) => state.isHydrated);

  const [revokeState, setRevokeState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const loading = !isHydrated || isLoading;

  async function handleSignOutEverywhere() {
    setRevokeState("loading");
    try {
      const sessionsRes = await adminFetch("/api/admin/security/sessions");
      if (!sessionsRes.ok) throw new Error("Failed to load sessions");
      const sessionsData = (await sessionsRes.json()) as {
        sessions?: Array<{ session_id?: string; _id?: string }>;
      };
      const sessions = sessionsData.sessions ?? [];

      await Promise.allSettled(
        sessions.map((s) => {
          const id = s.session_id ?? s._id;
          if (!id) return Promise.resolve();
          return adminFetch(`/api/admin/security/sessions/${id}/revoke`, { method: "POST" });
        })
      );

      setRevokeState("done");
    } catch {
      setRevokeState("error");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <UserIcon className="size-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="font-semibold text-lg">My Profile</h1>
          <p className="text-muted-foreground text-sm">
            Your admin session details and granted access.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ProfileRow label="Name" value={loading ? undefined : (user?.name ?? "—")} />
          <ProfileRow label="Email" value={loading ? undefined : (user?.email ?? "—")} />
          <ProfileRow label="User ID" value={loading ? undefined : (user?.user_id ?? "—")} mono />
          <ProfileRow label="Type" value={loading ? undefined : (user?.user_type ?? "—")} />
          <ProfileRow label="State" value={loading ? undefined : (user?.state ?? "—")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <KeyRoundIcon className="size-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Roles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-wrap gap-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-5 w-20 rounded-full" />
              ))}
            </div>
          ) : roles.length === 0 ? (
            <p className="text-muted-foreground text-sm">No roles assigned.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <Badge key={role} variant="outline">
                  {role}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <ShieldIcon className="size-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Powers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-5 w-32 rounded-full" />
              ))}
            </div>
          ) : powers.length === 0 ? (
            <p className="text-muted-foreground text-sm">No powers granted.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {powers.map((power) => (
                <Badge key={power} variant="secondary" className="font-mono text-xs">
                  {power}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="outline"
          onClick={() => {
            window.location.hash = "security-sessions";
          }}
        >
          <MonitorSmartphoneIcon className="size-4" />
          Manage devices
        </Button>
        <Button
          variant="destructive"
          disabled={revokeState === "loading" || revokeState === "done"}
          onClick={handleSignOutEverywhere}
        >
          <LogOutIcon className="size-4" />
          {revokeState === "loading"
            ? "Signing out…"
            : revokeState === "done"
              ? "Signed out everywhere"
              : revokeState === "error"
                ? "Retry sign out everywhere"
                : "Sign out everywhere"}
        </Button>
      </div>
      {revokeState === "error" && (
        <p className="text-destructive text-sm">
          Failed to revoke sessions. Try again or contact a FOUNDER admin.
        </p>
      )}
    </div>
  );
}

function ProfileRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | undefined;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <span className="shrink-0 text-muted-foreground text-sm">{label}</span>
      {value === undefined ? (
        <Skeleton className="h-4 w-32" />
      ) : (
        <span className={`text-right text-sm ${mono ? "font-mono" : ""}`}>{value}</span>
      )}
    </div>
  );
}
