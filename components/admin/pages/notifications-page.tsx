"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BellIcon,
  CheckCircle2Icon,
  ClockIcon,
  FilterIcon,
  MegaphoneIcon,
  RefreshCwIcon,
  SearchIcon,
  SendIcon,
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
import { BroadcastComposerDialog, type BroadcastData } from "@/components/admin/dialogs/broadcast-composer-dialog";

export type BroadcastRecord = {
  notification_id: string;
  title: string;
  body: string;
  target_audience: string;
  audience_size: number;
  status: "PENDING_APPROVAL" | "SENT" | "SCHEDULED" | "REJECTED";
  created_at: string;
};

function statusVariant(value: string): "default" | "secondary" | "destructive" | "outline" {
  if (/rejected/i.test(value)) return "destructive";
  if (/pending|scheduled/i.test(value)) return "outline";
  if (/sent/i.test(value)) return "default";
  return "secondary";
}

export function NotificationsPage() {
  const [broadcasts, setBroadcasts] = useState<BroadcastRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBroadcasts = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await adminFetch("/api/admin/notifications/history");
      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        const list = Array.isArray(data.notifications)
          ? (data.notifications as BroadcastRecord[])
          : Array.isArray(data.items)
          ? (data.items as BroadcastRecord[])
          : Array.isArray(data)
          ? (data as BroadcastRecord[])
          : [];
        setBroadcasts(list);
      } else {
        setBroadcasts([]);
      }
    } catch {
      setBroadcasts([]);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchBroadcasts();
  }, [fetchBroadcasts]);

  const handleAddBroadcast = (data: BroadcastData) => {
    const record: BroadcastRecord = {
      notification_id: `BRD_${Math.floor(1000 + Math.random() * 9000)}`,
      title: data.title,
      body: data.body,
      target_audience: data.target_audience,
      audience_size: data.target_audience === "ALL_USERS" ? 4250 : 1820,
      status: data.status,
      created_at: new Date().toISOString(),
    };
    setBroadcasts((prev) => [record, ...prev]);
  };

  // Filtered Broadcasts List
  const filteredBroadcasts = useMemo(() => {
    return broadcasts.filter((b) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        (b.title && b.title.toLowerCase().includes(q)) ||
        (b.target_audience && b.target_audience.toLowerCase().includes(q)) ||
        (b.notification_id && b.notification_id.toLowerCase().includes(q));

      const matchesStatus =
        filterStatus === "all" || (b.status && b.status.toLowerCase() === filterStatus.toLowerCase());

      return matchesSearch && matchesStatus;
    });
  }, [broadcasts, search, filterStatus]);

  const hasBroadcasts = broadcasts.length > 0;
  const sentCount = hasBroadcasts ? broadcasts.filter((b) => b.status === "SENT").length : "—";
  const pendingCount = hasBroadcasts ? broadcasts.filter((b) => b.status === "PENDING_APPROVAL").length : "—";
  const scheduledCount = hasBroadcasts ? broadcasts.filter((b) => b.status === "SCHEDULED").length : "—";

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-normal text-muted-foreground uppercase">
            OPERATIONS & MESSAGING
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Notifications & Broadcasts</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Compose platform broadcasts with draft editor, target segmentation, live preview, scheduling, and approval logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Gated power="PWR_NOTIFICATION_SEND_BROADCAST">
            <BroadcastComposerDialog onSuccess={handleAddBroadcast} />
          </Gated>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchBroadcasts}
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
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Broadcasts</span>
            <MegaphoneIcon className="size-4 text-blue-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{hasBroadcasts ? broadcasts.length : "—"}</div>
          <p className="mt-1 text-xs text-muted-foreground">Sent & draft broadcast logs</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sent</span>
            <CheckCircle2Icon className="size-4 text-emerald-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{sentCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">Delivered platform broadcasts</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending Approval</span>
            <ClockIcon className="size-4 text-amber-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{pendingCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">Review queue broadcasts</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scheduled</span>
            <SendIcon className="size-4 text-purple-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{scheduledCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">Scheduled future broadcasts</p>
        </Card>
      </div>

      {/* ── Main Data Table Card ──────────────────────────────────────────── */}
      <Card className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
        <CardHeader className="gap-3 border-b bg-card px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base font-bold tracking-tight text-foreground">Notification History & Broadcast Log</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">Delivered broadcasts, target audience segment, reach, and review status</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Dropdown */}
            <div className="flex items-center gap-1.5 border rounded-md bg-background px-2 py-1">
              <FilterIcon className="size-3.5 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-xs font-medium text-foreground focus:outline-hidden"
              >
                <option value="all">All Statuses</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="SENT">Sent</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, audience..."
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-card hover:bg-card border-b">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">BROADCAST TITLE</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">AUDIENCE SEGMENT</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">EST. REACH</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">STATUS</TableHead>
                <TableHead className="w-28 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">DATE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBroadcasts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-36 text-center text-xs text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2 py-4">
                      <BellIcon className="size-8 text-muted-foreground/50" />
                      <p className="font-semibold text-muted-foreground">No broadcast notifications returned from backend</p>
                      <p className="text-[11px] text-muted-foreground/80 max-w-sm">
                        Use the &ldquo;Compose Broadcast&rdquo; button above to create a notification draft or connect backend API routes.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBroadcasts.map((b) => (
                  <TableRow key={b.notification_id} className="transition-colors hover:bg-accent/40 border-b border-border/40">
                    {/* BROADCAST TITLE */}
                    <TableCell className="py-3 text-xs">
                      <div>
                        <p className="font-semibold text-foreground">{b.title}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                          <span>{b.notification_id}</span>
                        </p>
                      </div>
                    </TableCell>

                    {/* AUDIENCE SEGMENT */}
                    <TableCell className="py-3 text-xs">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {b.target_audience || "ALL_USERS"}
                      </Badge>
                    </TableCell>

                    {/* EST. REACH */}
                    <TableCell className="py-3 text-xs font-semibold text-foreground">
                      {(b.audience_size || 0).toLocaleString("en-IN")} users
                    </TableCell>

                    {/* STATUS */}
                    <TableCell className="py-3 text-xs">
                      <Badge variant={statusVariant(b.status || "SENT")} className="font-semibold text-[10px] tracking-wide px-2 py-0.5">
                        {b.status || "SENT"}
                      </Badge>
                    </TableCell>

                    {/* DATE */}
                    <TableCell className="py-3 text-right text-xs text-muted-foreground">
                      {b.created_at ? new Date(b.created_at).toLocaleDateString("en-IN") : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Table Footer */}
          <div className="flex items-center justify-between border-t bg-card px-6 py-3 text-xs text-muted-foreground">
            <span>
              Showing {filteredBroadcasts.length} of {broadcasts.length} total broadcasts
            </span>
            <span className="font-mono text-[11px]">Broadcast System Active</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
