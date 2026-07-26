"use client";

import { useMemo, useState } from "react";
import {
  EyeIcon,
  FilterIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldCheckIcon,
  ShieldOffIcon,
  SlidersHorizontalIcon,
  UserCheckIcon,
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
import { BlockUserDialog } from "@/components/admin/dialogs/block-user-dialog";
import { ChangeUserStateDialog } from "@/components/admin/dialogs/change-user-state-dialog";
import { CreateUserDialog, type NewUserData } from "@/components/admin/dialogs/create-user-dialog";
import { EditUserProfileDialog } from "@/components/admin/dialogs/edit-user-profile-dialog";
import { UserDetailCardDialog, type UserRecord } from "@/components/admin/dialogs/user-detail-card-dialog";

function statusVariant(value: string): "default" | "secondary" | "destructive" | "outline" {
  if (/blocked|rejected/i.test(value)) return "destructive";
  if (/pending|kyc_pending|suspended/i.test(value)) return "outline";
  if (/active|verified/i.test(value)) return "default";
  return "secondary";
}

export function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleAddUser = (newUserData: NewUserData) => {
    const newUser: UserRecord = {
      user_id: `USR_${Math.floor(10000 + Math.random() * 90000)}`,
      name: newUserData.name,
      email: newUserData.email,
      phone: newUserData.phone,
      user_type: newUserData.user_type,
      state: newUserData.state,
      created_at: new Date().toISOString(),
      kyc: { aadhaar_verified: false, risk_level: "Low Risk" },
      metrics: { subscriptions_count: 0, active_subscriptions_count: 0, total_spent: 0 },
    };
    setUsers((prev) => [newUser, ...prev]);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.user_id !== userId));
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.user_id.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q));

      const matchesState = filterState === "all" || u.state.toLowerCase() === filterState.toLowerCase();
      const matchesType = filterType === "all" || u.user_type.toLowerCase() === filterType.toLowerCase();

      return matchesSearch && matchesState && matchesType;
    });
  }, [users, search, filterState, filterType]);

  const hasUsers = users.length > 0;
  const activeCount = hasUsers ? users.filter((u) => /ACTIVE/i.test(u.state)).length : "—";
  const kycPendingCount = hasUsers ? users.filter((u) => /KYC_PENDING/i.test(u.state)).length : "—";
  const blockedCount = hasUsers ? users.filter((u) => /BLOCKED/i.test(u.state)).length : "—";

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-normal text-muted-foreground uppercase">
            USER MANAGEMENT
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Users</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            View full list of users, inspect complete profile cards, apply state filters, and manage account CRUD operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Create User Dialog Trigger */}
          <CreateUserDialog onSuccess={handleAddUser} />

          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-1.5"
          >
            <RefreshCwIcon className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Metric Summary Tiles Grid (Placeholders) ──────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Users</span>
            <UsersIcon className="size-4 text-blue-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{hasUsers ? users.length : "—"}</div>
          <p className="mt-1 text-xs text-muted-foreground">Registered platform traders</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Users</span>
            <UserCheckIcon className="size-4 text-emerald-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{activeCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">Active trader accounts</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">KYC Pending</span>
            <ShieldCheckIcon className="size-4 text-amber-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{kycPendingCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">Aadhaar verification queue</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Blocked Users</span>
            <ShieldOffIcon className="size-4 text-destructive" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{blockedCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">Blocked accounts</p>
        </Card>
      </div>

      {/* ── Main Data Table Card ──────────────────────────────────────────── */}
      <Card className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
        <CardHeader className="gap-3 border-b bg-muted/20 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base font-bold tracking-tight text-foreground">User Roster Directory</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">Complete user accounts with status, KYC status, and action tools</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Dropdown */}
            <div className="flex items-center gap-1.5 border rounded-md bg-background px-2 py-1">
              <FilterIcon className="size-3.5 text-muted-foreground" />
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="bg-transparent text-xs font-medium text-foreground focus:outline-hidden"
              >
                <option value="all">All States</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="KYC_PENDING">KYC_PENDING</option>
                <option value="UNVERIFIED">UNVERIFIED</option>
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
                placeholder="Search name, email, ID..."
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">USER</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">TYPE</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">STATE</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">KYC</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">CREATED</TableHead>
                <TableHead className="w-28 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center text-xs text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2 py-4">
                      <UsersIcon className="size-8 text-muted-foreground/50" />
                      <p className="font-semibold text-muted-foreground">No user records to display</p>
                      <p className="text-[11px] text-muted-foreground/80 max-w-sm">
                        Use the &ldquo;+ Add User&rdquo; button above to create user entries or connect backend routes to load records.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const isKycVerified = user.kyc?.aadhaar_verified;
                  return (
                    <TableRow key={user.user_id} className="transition-colors hover:bg-muted/40">
                      {/* USER Name & Email */}
                      <TableCell className="py-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs">
                            {user.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{user.name}</p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <span>{user.email}</span>
                              <span className="font-mono text-[10px] text-muted-foreground/70">• {user.user_id}</span>
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* TYPE */}
                      <TableCell className="py-3 text-xs">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {user.user_type}
                        </Badge>
                      </TableCell>

                      {/* STATE */}
                      <TableCell className="py-3 text-xs">
                        <Badge variant={statusVariant(user.state)} className="font-semibold text-[10px] tracking-wide px-2 py-0.5">
                          {user.state}
                        </Badge>
                      </TableCell>

                      {/* KYC */}
                      <TableCell className="py-3 text-xs">
                        {isKycVerified ? (
                          <Badge variant="default" className="bg-emerald-600 text-white text-[10px]">
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-500/40 text-[10px]">
                            Pending
                          </Badge>
                        )}
                      </TableCell>

                      {/* CREATED */}
                      <TableCell className="py-3 text-xs text-muted-foreground">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString("en-IN") : "—"}
                      </TableCell>

                      {/* ACTIONS */}
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Card Detail Modal */}
                          <UserDetailCardDialog
                            user={user}
                            onRefresh={handleRefresh}
                            onDelete={handleDeleteUser}
                            trigger={
                              <Button size="icon-sm" variant="ghost" title="View Full Details Card">
                                <EyeIcon className="size-4 text-blue-500 hover:text-blue-600" />
                              </Button>
                            }
                          />

                          <BlockUserDialog
                            userId={user.user_id}
                            currentState={user.state}
                            refresh={handleRefresh}
                            trigger={
                              <Button size="icon-sm" variant="ghost" title={/BLOCKED/i.test(user.state) ? "Unblock" : "Block"}>
                                <ShieldOffIcon className="size-4 text-muted-foreground" />
                              </Button>
                            }
                          />

                          <ChangeUserStateDialog
                            userId={user.user_id}
                            currentState={user.state}
                            refresh={handleRefresh}
                            trigger={
                              <Button size="icon-sm" variant="ghost" title="Change state">
                                <SlidersHorizontalIcon className="size-4 text-muted-foreground" />
                              </Button>
                            }
                          />

                          <EditUserProfileDialog
                            userId={user.user_id}
                            currentName={user.name}
                            currentPhone={user.phone}
                            currentProfilePicUrl={user.profile_pic_url}
                            refresh={handleRefresh}
                            trigger={
                              <Button size="icon-sm" variant="ghost" title="Edit profile">
                                <PencilIcon className="size-4 text-muted-foreground" />
                              </Button>
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Table Footer */}
          <div className="flex items-center justify-between border-t bg-muted/10 px-6 py-3 text-xs text-muted-foreground">
            <span>
              Showing {filteredUsers.length} of {users.length} total users
            </span>
            <span className="font-mono text-[11px]">User Directory Active</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
