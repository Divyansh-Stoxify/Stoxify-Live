"use client";

import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { LoaderCircleIcon, UserMinusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toastError, toastNetworkError, toastSuccess } from "./_action-toast";
import { readFormResult } from "./_form-dialog";
import { adminFetch } from "@/lib/admin/client-api";

type Member = {
  user_id: string;
  name?: string | null;
  email?: string | null;
  state?: string | null;
  assigned_at?: string | null;
};

type Props = {
  roleId: string;
  roleName?: string;
  refresh: () => void;
  trigger: ReactNode;
};

/**
 * Who currently holds a role, with per-member revoke. This is the screen you
 * need before deleting a role — the backend refuses while anyone still holds it.
 */
export function RoleMembersDialog({ roleId, roleName, refresh, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const response = await adminFetch(
        `/api/admin/rbac/roles/${encodeURIComponent(roleId)}/members`
      );
      const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok) {
        setError((data.error ?? data.message ?? "Could not load members") as string);
        setMembers([]);
        return;
      }
      setMembers(Array.isArray(data.members) ? (data.members as Member[]) : []);
    } catch {
      setError("Service unavailable");
      setMembers([]);
    }
  }, [roleId]);

  // Loaded from the open handler rather than an effect — the fetch is a reaction
  // to the click, not synchronisation with an external system.
  function openWith() {
    setMembers(null);
    setOpen(true);
    void load();
  }

  async function revoke(member: Member) {
    setRevoking(member.user_id);
    try {
      const response = await adminFetch("/api/admin/rbac/revoke-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: member.user_id, role_id: roleId }),
      });
      const result = await readFormResult(response);
      if (result.ok) {
        toastSuccess(`Revoked from ${member.name ?? member.user_id}`);
        await load();
        refresh();
      } else {
        toastError(result.code, result.message);
      }
    } catch {
      toastNetworkError();
    } finally {
      setRevoking(null);
    }
  }

  return (
    <>
      <span
        style={{ display: "contents" }}
        onClick={(e) => {
          e.stopPropagation();
          openWith();
        }}
      >
        {trigger}
      </span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Members of {roleName ?? roleId}</DialogTitle>
            <DialogDescription>
              Everyone currently holding this role. Revoking removes its permissions on their next
              request.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-80 overflow-y-auto">
            {members === null && (
              <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <LoaderCircleIcon className="size-4 animate-spin" />
                Loading members...
              </p>
            )}

            {error && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            {members?.length === 0 && !error && (
              <p className="py-4 text-sm text-muted-foreground">
                Nobody holds this role. It can be deleted safely.
              </p>
            )}

            <div className="divide-y divide-border">
              {members?.map((member) => (
                <div key={member.user_id} className="flex items-center gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {member.name ?? member.email ?? member.user_id}
                    </p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {member.user_id}
                      {member.state ? ` · ${member.state}` : ""}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => revoke(member)}
                    disabled={revoking === member.user_id}
                    aria-label={`Revoke from ${member.name ?? member.user_id}`}
                  >
                    {revoking === member.user_id ? (
                      <LoaderCircleIcon className="animate-spin" />
                    ) : (
                      <UserMinusIcon />
                    )}
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
