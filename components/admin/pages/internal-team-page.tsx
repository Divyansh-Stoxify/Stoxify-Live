"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2Icon,
  FilterIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldCheckIcon,
  ShieldIcon,
  ShieldOffIcon,
  UserCheckIcon,
  UserCogIcon,
  UsersIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminFetch } from "@/lib/admin/client-api";
import { Gated } from "@/components/admin/admin-permissions-provider";
import { ChangeMemberRoleDialog } from "@/components/admin/dialogs/change-member-role-dialog";
import { ChangeUserStateDialog } from "@/components/admin/dialogs/change-user-state-dialog";
import { CreateSubAdminDialog } from "@/components/admin/dialogs/create-sub-admin-dialog";

export type InternalMemberRecord = {
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  assigned_role: string;
  state: "ACTIVE" | "SUSPENDED" | "BLOCKED";
  created_at: string;
};

function statusVariant(value: string): "default" | "secondary" | "destructive" | "outline" {
  if (/blocked/i.test(value)) return "destructive";
  if (/suspended/i.test(value)) return "outline";
  if (/active/i.test(value)) return "default";
  return "secondary";
}

export function InternalTeamPage() {
  const [members, setMembers] = useState<InternalMemberRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMembers = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await adminFetch("/api/admin/internal-team");
      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        const list = Array.isArray(data.members)
          ? (data.members as InternalMemberRecord[])
          : Array.isArray(data.users)
          ? (data.users as InternalMemberRecord[])
          : Array.isArray(data.items)
          ? (data.items as InternalMemberRecord[])
          : Array.isArray(data)
          ? (data as InternalMemberRecord[])
          : [];
        setMembers(list);
      } else {
        setMembers([]);
      }
    } catch {
      setMembers([]);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  // Filtered Members List
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.assigned_role && m.assigned_role.toLowerCase().includes(q)) ||
        (m.user_id && m.user_id.toLowerCase().includes(q));

      const matchesState =
        filterState === "all" || (m.state && m.state.toLowerCase() === filterState.toLowerCase());

      return matchesSearch && matchesState;
    });
  }, [members, search, filterState]);

  const hasMembers = members.length > 0;
  const activeCount = hasMembers ? members.filter((m) => m.state === "ACTIVE").length : "—";
  const adminCount = hasMembers ? members.filter((m) => m.assigned_role && /admin|founder/i.test(m.assigned_role)).length : "—";
  const blockedCount = hasMembers ? members.filter((m) => m.state === "BLOCKED").length : "—";

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-normal text-muted-foreground uppercase">
            INTERNAL ACCESS & GOVERNANCE
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Internal Team</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Internal team accounts, sub-admins, and permission role assignments for platform governance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Gated power="PWR_ADMIN_USER_ROLE_ASSIGN">
            <CreateSubAdminDialog
              refresh={fetchMembers}
              trigger={
                <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90">
                  <PlusIcon className="size-4" /> New Sub-Admin
                </Button>
              }
            />
          </Gated>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchMembers}
            disabled={isRefreshing}
            className="gap-1.5"
          >
            <RefreshCwIcon className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Metric Summary Tiles Grid ──────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Team</span>
            <UsersIcon className="size-4 text-blue-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{hasMembers ? members.length : "—"}</div>
          <p className="mt-1 text-xs text-muted-foreground">Internal team accounts</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Members</span>
            <CheckCircle2Icon className="size-4 text-emerald-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{activeCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">Active sub-admin accounts</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admins / Founders</span>
            <ShieldCheckIcon className="size-4 text-purple-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{adminCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">Full permission accounts</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Blocked Members</span>
            <ShieldOffIcon className="size-4 text-destructive" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{blockedCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">Suspended internal accounts</p>
        </Card>
      </div>

      {/* ── Main Data Table Card ──────────────────────────────────────────── */}
      <Card className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
        <CardHeader className="gap-3 border-b bg-card px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base font-bold tracking-tight text-foreground">Internal Team Directory</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">Internal team members, assigned role powers, account state, and contact details</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* State Filter Dropdown */}
            <div className="flex items-center gap-1.5 border rounded-md bg-background px-2 py-1">
              <FilterIcon className="size-3.5 text-muted-foreground" />
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="bg-transparent text-xs font-medium text-foreground focus:outline-hidden"
              >
                <option value="all">All States</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="BLOCKED">BLOCKED</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, role..."
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-card hover:bg-card border-b">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">MEMBER</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">ROLE</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">STATE</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">PHONE</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">CREATED</TableHead>
                <TableHead className="w-24 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center text-xs text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2 py-4">
                      <UserCheckIcon className="size-8 text-muted-foreground/50" />
                      <p className="font-semibold text-muted-foreground">No internal team members returned from backend</p>
                      <p className="text-[11px] text-muted-foreground/80 max-w-sm">
                        Use the &ldquo;+ New Sub-Admin&rdquo; button above to register a new team member or connect backend API routes.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((m) => (
                  <TableRow key={m.user_id} className="transition-colors hover:bg-accent/40 border-b border-border/40">
                    {/* MEMBER */}
                    <TableCell className="py-3 text-xs">
                      <div>
                        <p className="font-semibold text-foreground">{m.name || "Unnamed Member"}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <span>{m.email || "—"}</span>
                          {m.user_id && <span className="font-mono opacity-70">• {m.user_id}</span>}
                        </p>
                      </div>
                    </TableCell>

                    {/* ROLE */}
                    <TableCell className="py-3 text-xs">
                      <Badge variant="outline" className="text-[10px] font-mono font-bold">
                        {m.assigned_role || "—"}
                      </Badge>
                    </TableCell>

                    {/* STATE */}
                    <TableCell className="py-3 text-xs">
                      <Badge variant={statusVariant(m.state || "")} className="font-semibold text-[10px] tracking-wide px-2 py-0.5">
                        {m.state || "—"}
                      </Badge>
                    </TableCell>

                    {/* PHONE */}
                    <TableCell className="py-3 text-xs text-muted-foreground">
                      {m.phone || "—"}
                    </TableCell>

                    {/* CREATED */}
                    <TableCell className="py-3 text-xs text-muted-foreground">
                      {m.created_at ? new Date(m.created_at).toLocaleDateString("en-IN") : "—"}
                    </TableCell>

                    {/* ACTIONS */}
                    <TableCell className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Gated power="PWR_ADMIN_USER_ROLE_ASSIGN">
                          <ChangeMemberRoleDialog
                            userId={m.user_id}
                            userLabel={m.name}
                            currentRole={m.assigned_role}
                            refresh={fetchMembers}
                            trigger={
                              <Button size="icon-sm" variant="ghost" title="Change Role">
                                <ShieldIcon className="size-3.5 text-purple-600" />
                              </Button>
                            }
                          />
                        </Gated>

                        <Gated power="PWR_USER_STATE_CHANGE">
                          <ChangeUserStateDialog
                            userId={m.user_id}
                            currentState={m.state || ""}
                            refresh={fetchMembers}
                            trigger={
                              <Button size="icon-sm" variant="ghost" title="Change State">
                                <UserCogIcon className="size-3.5 text-muted-foreground" />
                              </Button>
                            }
                          />
                        </Gated>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Table Footer */}
          <div className="flex items-center justify-between border-t bg-muted/10 px-6 py-3 text-xs text-muted-foreground">
            <span>
              Showing {filteredMembers.length} of {members.length} total team members
            </span>
            <span className="font-mono text-[11px]">Internal Governance Active</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
