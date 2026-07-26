"use client";

import { useMemo, useState } from "react";
import {
  AwardIcon,
  CheckIcon,
  ClockIcon,
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
  XIcon,
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
import { BlockAnalystDialog } from "@/components/admin/dialogs/block-analyst-dialog";
import { ChangeAnalystStateDialog } from "@/components/admin/dialogs/change-analyst-state-dialog";
import { CreateAnalystDialog, type NewAnalystData } from "@/components/admin/dialogs/create-analyst-dialog";
import { EditAnalystProfileDialog } from "@/components/admin/dialogs/edit-analyst-profile-dialog";
import { VerifyAnalystDialog } from "@/components/admin/dialogs/verify-analyst-dialog";
import { RejectAnalystDialog } from "@/components/admin/dialogs/reject-analyst-dialog";
import { AnalystDetailCardDialog, type AnalystRecord } from "@/components/admin/dialogs/analyst-detail-card-dialog";

function statusVariant(value: string): "default" | "secondary" | "destructive" | "outline" {
  if (/blocked|rejected/i.test(value)) return "destructive";
  if (/pending|verification|suspended/i.test(value)) return "outline";
  if (/active|verified/i.test(value)) return "default";
  return "secondary";
}

export function AnalystsPage() {
  const [analysts, setAnalysts] = useState<AnalystRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");
  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleAddAnalyst = (newAnalystData: NewAnalystData) => {
    const newAnalyst: AnalystRecord = {
      user_id: `ANL_${Math.floor(10000 + Math.random() * 90000)}`,
      name: newAnalystData.name,
      email: newAnalystData.email,
      phone: newAnalystData.phone,
      sebi_license_number: newAnalystData.sebi_license_number,
      experience_years: newAnalystData.experience_years,
      specialization: newAnalystData.specialization,
      state: newAnalystData.state,
      created_at: new Date().toISOString(),
      performance: {
        average_pnl_percent: 15.0,
        win_rate: 70.0,
        trades_count: 0,
        active_plans_count: 0,
      },
    };
    setAnalysts((prev) => [newAnalyst, ...prev]);
  };

  const handleDeleteAnalyst = (analystId: string) => {
    setAnalysts((prev) => prev.filter((a) => a.user_id !== analystId));
  };

  const handleApproveAnalyst = (analystId: string) => {
    setAnalysts((prev) =>
      prev.map((a) => (a.user_id === analystId ? { ...a, state: "ACTIVE" } : a))
    );
  };

  const handleRejectAnalyst = (analystId: string) => {
    setAnalysts((prev) =>
      prev.map((a) => (a.user_id === analystId ? { ...a, state: "REJECTED" } : a))
    );
  };

  // Pending verification applications queue
  const pendingQueue = useMemo(() => {
    return analysts.filter((a) => /PENDING|ONGOING/i.test(a.state));
  }, [analysts]);

  // Filtered Analysts List
  const filteredAnalysts = useMemo(() => {
    const targetList = activeTab === "pending" ? pendingQueue : analysts;
    return targetList.filter((a) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.user_id.toLowerCase().includes(q) ||
        (a.sebi_license_number && a.sebi_license_number.toLowerCase().includes(q));

      const matchesState =
        filterState === "all" || a.state.toLowerCase() === filterState.toLowerCase();

      return matchesSearch && matchesState;
    });
  }, [analysts, pendingQueue, activeTab, search, filterState]);

  const hasAnalysts = analysts.length > 0;
  const activeCount = hasAnalysts ? analysts.filter((a) => /ACTIVE/i.test(a.state)).length : "—";
  const pendingCount = hasAnalysts ? pendingQueue.length : "—";
  const blockedCount = hasAnalysts ? analysts.filter((a) => /BLOCKED/i.test(a.state)).length : "—";

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-normal text-muted-foreground uppercase">
            ANALYST OPERATIONS & APPROVALS
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Analysts Panel</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Review analyst profiles, approve pending SEBI verification applications, inspect performance cards, and execute CRUD controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Create Analyst Dialog Trigger */}
          <CreateAnalystDialog onSuccess={handleAddAnalyst} />

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
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Analysts</span>
            <UserCheckIcon className="size-4 text-emerald-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{hasAnalysts ? analysts.length : "—"}</div>
          <p className="mt-1 text-xs text-muted-foreground">Platform registered analysts</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SEBI Verified</span>
            <ShieldCheckIcon className="size-4 text-emerald-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{activeCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">Active & verified analysts</p>
        </Card>

        <Card
          onClick={() => setActiveTab("pending")}
          className={`rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm cursor-pointer ${
            pendingQueue.length > 0 ? "ring-2 ring-amber-500/50 bg-amber-500/5" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending Approvals</span>
            <ClockIcon className="size-4 text-amber-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
            {pendingCount}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Applications waiting for review</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Blocked Analysts</span>
            <ShieldOffIcon className="size-4 text-destructive" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{blockedCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">Blocked analyst accounts</p>
        </Card>
      </div>

      {/* ── Integrated Navigation Tabs ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all ${
            activeTab === "all"
              ? "border-b-2 border-primary text-foreground bg-muted/40"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All Analysts Directory
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg flex items-center gap-2 transition-all ${
            activeTab === "pending"
              ? "border-b-2 border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>Approve Analyst Reviews Queue</span>
          {pendingQueue.length > 0 && (
            <Badge variant="outline" className="bg-amber-500 text-white font-bold text-[10px] px-1.5 py-0">
              {pendingQueue.length}
            </Badge>
          )}
        </button>
      </div>

      {/* ── Main Data Table Card ──────────────────────────────────────────── */}
      <Card className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
        <CardHeader className="gap-3 border-b bg-muted/20 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base font-bold tracking-tight text-foreground">
              {activeTab === "pending" ? "Pending Analyst Approvals Queue" : "Analyst Directory & Performance"}
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {activeTab === "pending"
                ? "Review pending SEBI license applications and approve or reject verification requests"
                : "SEBI registered analysts, experience, average PnL %, and control tools"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* State Filter Dropdown */}
            {activeTab === "all" && (
              <div className="flex items-center gap-1.5 border rounded-md bg-background px-2 py-1">
                <FilterIcon className="size-3.5 text-muted-foreground" />
                <select
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  className="bg-transparent text-xs font-medium text-foreground focus:outline-hidden"
                >
                  <option value="all">All States</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PENDING">PENDING</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="BLOCKED">BLOCKED</option>
                </select>
              </div>
            )}

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, SEBI license..."
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">ANALYST</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">STATE</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">SEBI LICENSE</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">SPECIALIZATION</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">AVG PNL %</TableHead>
                <TableHead className="w-36 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">
                  {activeTab === "pending" ? "APPROVE / REJECT" : "ACTIONS"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAnalysts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center text-xs text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2 py-4">
                      <UserCheckIcon className="size-8 text-muted-foreground/50" />
                      <p className="font-semibold text-muted-foreground">
                        {activeTab === "pending" ? "No pending analyst applications waiting for review" : "No analyst records to display"}
                      </p>
                      <p className="text-[11px] text-muted-foreground/80 max-w-sm">
                        Use the &ldquo;+ Add Analyst&rdquo; button above to register analyst entries or connect backend routes to load records.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAnalysts.map((analyst) => {
                  const isPending = /PENDING|ONGOING/i.test(analyst.state);
                  const specs = Array.isArray(analyst.specialization) ? analyst.specialization : [];
                  const pnl = analyst.performance?.average_pnl_percent;

                  return (
                    <TableRow key={analyst.user_id} className="transition-colors hover:bg-muted/40">
                      {/* ANALYST Name & Email */}
                      <TableCell className="py-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                            {analyst.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{analyst.name}</p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <span>{analyst.email}</span>
                              <span className="font-mono text-[10px] text-muted-foreground/70">• {analyst.user_id}</span>
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* STATE */}
                      <TableCell className="py-3 text-xs">
                        <Badge variant={statusVariant(analyst.state)} className="font-semibold text-[10px] tracking-wide px-2 py-0.5">
                          {analyst.state}
                        </Badge>
                      </TableCell>

                      {/* SEBI LICENSE */}
                      <TableCell className="py-3 text-xs font-mono font-medium">
                        {analyst.sebi_license_number || (
                          <span className="text-amber-600 dark:text-amber-400 text-[11px]">PENDING</span>
                        )}
                      </TableCell>

                      {/* SPECIALIZATION */}
                      <TableCell className="py-3 text-xs">
                        <div className="flex flex-wrap gap-1">
                          {specs.slice(0, 2).map((spec) => (
                            <Badge key={spec} variant="secondary" className="text-[10px] px-1.5 py-0">
                              {spec}
                            </Badge>
                          ))}
                          {specs.length > 2 && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              +{specs.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* AVG PNL % */}
                      <TableCell className="py-3 text-xs font-bold">
                        {typeof pnl === "number" ? (
                          <span className={pnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>
                            {pnl >= 0 ? `+${pnl}%` : `${pnl}%`}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>

                      {/* ACTIONS / APPROVAL BUTTONS */}
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Card Detail Modal */}
                          <AnalystDetailCardDialog
                            analyst={analyst}
                            onRefresh={handleRefresh}
                            onDelete={handleDeleteAnalyst}
                            trigger={
                              <Button size="icon-sm" variant="ghost" title="View Analyst Details Card">
                                <EyeIcon className="size-4 text-emerald-600 hover:text-emerald-700" />
                              </Button>
                            }
                          />

                          {/* Approval / Verify Button */}
                          {isPending && (
                            <>
                              <VerifyAnalystDialog
                                analystId={analyst.user_id}
                                refresh={() => {
                                  handleApproveAnalyst(analyst.user_id);
                                  handleRefresh();
                                }}
                                trigger={
                                  <Button size="sm" variant="default" className="gap-1 h-7 text-xs bg-emerald-600 hover:bg-emerald-700">
                                    <CheckIcon className="size-3.5" /> Approve
                                  </Button>
                                }
                              />

                              <RejectAnalystDialog
                                analystId={analyst.user_id}
                                refresh={() => {
                                  handleRejectAnalyst(analyst.user_id);
                                  handleRefresh();
                                }}
                                trigger={
                                  <Button size="sm" variant="destructive" className="gap-1 h-7 text-xs">
                                    <XIcon className="size-3.5" /> Reject
                                  </Button>
                                }
                              />
                            </>
                          )}

                          {!isPending && (
                            <>
                              <BlockAnalystDialog
                                analystId={analyst.user_id}
                                currentState={analyst.state}
                                refresh={handleRefresh}
                                trigger={
                                  <Button size="icon-sm" variant="ghost" title={/BLOCKED/i.test(analyst.state) ? "Unblock" : "Block"}>
                                    <ShieldOffIcon className="size-4 text-muted-foreground" />
                                  </Button>
                                }
                              />

                              <ChangeAnalystStateDialog
                                analystId={analyst.user_id}
                                currentState={analyst.state}
                                refresh={handleRefresh}
                                trigger={
                                  <Button size="icon-sm" variant="ghost" title="Change state">
                                    <SlidersHorizontalIcon className="size-4 text-muted-foreground" />
                                  </Button>
                                }
                              />

                              <EditAnalystProfileDialog
                                analystId={analyst.user_id}
                                currentName={analyst.name}
                                currentPhone={analyst.phone}
                                currentProfilePicUrl={analyst.profile_pic_url}
                                currentExperienceYears={analyst.experience_years}
                                currentSpecialization={specs}
                                refresh={handleRefresh}
                                trigger={
                                  <Button size="icon-sm" variant="ghost" title="Edit profile">
                                    <PencilIcon className="size-4 text-muted-foreground" />
                                  </Button>
                                }
                              />
                            </>
                          )}
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
              Showing {filteredAnalysts.length} of {analysts.length} total analysts
            </span>
            <span className="font-mono text-[11px]">Analyst Approval Roster</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
