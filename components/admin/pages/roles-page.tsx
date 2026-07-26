"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2Icon,
  FilterIcon,
  KeyRoundIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UserMinusIcon,
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
import { CreateEditRoleDialog } from "@/components/admin/dialogs/create-edit-role-dialog";
import { DeleteRoleDialog } from "@/components/admin/dialogs/delete-role-dialog";
import { RoleMembersDialog } from "@/components/admin/dialogs/role-members-dialog";

export type RoleRecord = {
  role_id: string;
  role_name: string;
  description: string;
  powers_count: number;
  is_system_role: boolean;
  created_at?: string;
};

export function RolesPage() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRoles = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await adminFetch("/api/admin/rbac/roles");
      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        const list = Array.isArray(data.roles)
          ? (data.roles as RoleRecord[])
          : Array.isArray(data.items)
          ? (data.items as RoleRecord[])
          : Array.isArray(data)
          ? (data as RoleRecord[])
          : [];
        setRoles(list);
      } else {
        setRoles([]);
      }
    } catch {
      setRoles([]);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchRoles();
  }, [fetchRoles]);

  const handleDeleteRole = (roleId: string) => {
    setRoles((prev) => prev.filter((r) => r.role_id !== roleId));
  };

  // Filtered Roles List
  const filteredRoles = useMemo(() => {
    return roles.filter((r) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        (r.role_name && r.role_name.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.role_id && r.role_id.toLowerCase().includes(q));

      const matchesType =
        filterType === "all" ||
        (filterType === "system" && r.is_system_role) ||
        (filterType === "custom" && !r.is_system_role);

      return matchesSearch && matchesType;
    });
  }, [roles, search, filterType]);

  const hasRoles = roles.length > 0;
  const systemCount = hasRoles ? roles.filter((r) => r.is_system_role).length : "—";
  const customCount = hasRoles ? roles.filter((r) => !r.is_system_role).length : "—";
  const totalPowersCount = hasRoles
    ? roles.reduce((sum, r) => sum + (r.powers_count || 0), 0)
    : "—";

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-normal text-muted-foreground uppercase">
            ROLE-BASED ACCESS CONTROL (RBAC)
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Roles & Access</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            List of platform roles, system-protected roles (FOUNDER, ADMIN), custom sub-admin role creation, and assigned power checklists.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Gated power="PWR_ADMIN_ROLE_MANAGE">
            <CreateEditRoleDialog
              mode="create"
              refresh={fetchRoles}
              trigger={
                <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90">
                  <PlusIcon className="size-4" /> Create Role
                </Button>
              }
            />
          </Gated>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchRoles}
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
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Roles</span>
            <KeyRoundIcon className="size-4 text-purple-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{hasRoles ? roles.length : "—"}</div>
          <p className="mt-1 text-xs text-muted-foreground">Platform access roles</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">System Roles</span>
            <ShieldCheckIcon className="size-4 text-emerald-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{systemCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">Protected system roles</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Custom Roles</span>
            <UsersIcon className="size-4 text-blue-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{customCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">Sub-admin custom roles</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assigned Powers</span>
            <CheckCircle2Icon className="size-4 text-amber-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{totalPowersCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">Total mapped power grants</p>
        </Card>
      </div>

      {/* ── Main Data Table Card ──────────────────────────────────────────── */}
      <Card className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
        <CardHeader className="gap-3 border-b bg-card px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base font-bold tracking-tight text-foreground">RBAC Role Registry</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">Role definitions, description, permission power count, and protection status</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Type Filter */}
            <div className="flex items-center gap-1.5 border rounded-md bg-background px-2 py-1">
              <FilterIcon className="size-3.5 text-muted-foreground" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-transparent text-xs font-medium text-foreground focus:outline-hidden"
              >
                <option value="all">All Types</option>
                <option value="system">System Protected</option>
                <option value="custom">Custom Roles</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search role name, powers..."
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-card hover:bg-card border-b">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">ROLE</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">DESCRIPTION</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">POWERS</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">TYPE</TableHead>
                <TableHead className="w-28 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-36 text-center text-xs text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2 py-4">
                      <KeyRoundIcon className="size-8 text-muted-foreground/50" />
                      <p className="font-semibold text-muted-foreground">No access roles returned from backend</p>
                      <p className="text-[11px] text-muted-foreground/80 max-w-sm">
                        Use the &ldquo;Create Role&rdquo; button above to define a new custom sub-admin role or ensure backend RBAC service is active.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((r) => (
                  <TableRow key={r.role_id} className="transition-colors hover:bg-accent/40 border-b border-border/40">
                    {/* ROLE */}
                    <TableCell className="py-3 text-xs">
                      <div>
                        <p className="font-semibold text-foreground">{r.role_name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{r.role_id}</p>
                      </div>
                    </TableCell>

                    {/* DESCRIPTION */}
                    <TableCell className="py-3 text-xs text-muted-foreground">
                      {r.description || "—"}
                    </TableCell>

                    {/* POWERS */}
                    <TableCell className="py-3 text-xs font-bold text-foreground">
                      {r.powers_count || 0} powers
                    </TableCell>

                    {/* TYPE */}
                    <TableCell className="py-3 text-xs">
                      <Badge
                        variant={r.is_system_role ? "default" : "outline"}
                        className={`font-semibold text-[10px] ${r.is_system_role ? "bg-purple-600 text-white" : ""}`}
                      >
                        {r.is_system_role ? "System Protected" : "Custom Role"}
                      </Badge>
                    </TableCell>

                    {/* ACTIONS */}
                    <TableCell className="py-3 text-right text-xs">
                      <div className="flex items-center justify-end gap-1">
                        <Gated power="PWR_ADMIN_ROLE_MANAGE">
                          <RoleMembersDialog
                            roleId={r.role_id}
                            roleName={r.role_name}
                            refresh={fetchRoles}
                            trigger={
                              <Button size="icon-sm" variant="ghost" title="View Assigned Members">
                                <UsersIcon className="size-3.5 text-blue-500" />
                              </Button>
                            }
                          />
                        </Gated>

                        <Gated power="PWR_ADMIN_ROLE_MANAGE">
                          <CreateEditRoleDialog
                            mode="edit"
                            roleId={r.role_id}
                            currentName={r.role_name}
                            currentDescription={r.description}
                            isSystemRole={r.is_system_role}
                            refresh={fetchRoles}
                            trigger={
                              <Button size="icon-sm" variant="ghost" title="Edit Role Checklist">
                                <PencilIcon className="size-3.5 text-muted-foreground" />
                              </Button>
                            }
                          />
                        </Gated>

                        {!r.is_system_role && (
                          <Gated power="PWR_ADMIN_ROLE_MANAGE">
                            <DeleteRoleDialog
                              roleId={r.role_id}
                              roleName={r.role_name}
                              refresh={fetchRoles}
                              trigger={
                                <Button size="icon-sm" variant="ghost" title="Delete Custom Role">
                                  <Trash2Icon className="size-3.5 text-destructive" />
                                </Button>
                              }
                            />
                          </Gated>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Table Footer */}
          <div className="flex items-center justify-between border-t bg-card px-6 py-3 text-xs text-muted-foreground">
            <span>
              Showing {filteredRoles.length} of {roles.length} total roles
            </span>
            <span className="font-mono text-[11px]">RBAC Active</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
