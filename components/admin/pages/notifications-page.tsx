"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BellIcon,
  CheckCircle2Icon,
  MegaphoneIcon,
  RefreshCwIcon,
  SearchIcon,
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
import { BroadcastComposerDialog } from "@/components/admin/dialogs/broadcast-composer-dialog";

/**
 * One row per broadcast, as returned by GET /notifications/history — the
 * notification-service aggregates the per-recipient rows by broadcast_id.
 * Broadcasts send immediately, so every record here has already gone out;
 * there is no draft/approval/scheduled state in the backend.
 */
export type BroadcastRecord = {
  broadcast_id: string;
  type: string;
  title: string;
  message: string;
  sent_by: string;
  sent_at: string;
  recipients: number;
  read_count: number;
};

export function NotificationsPage() {
  const [broadcasts, setBroadcasts] = useState<BroadcastRecord[]>([]);
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchBroadcasts = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await adminFetch("/api/admin/notifications/history");
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

      if (!res.ok) {
        setBroadcasts([]);
        setLoadError(
          (data.error as string) ?? (data.message as string) ?? `Request failed (${res.status})`
        );
        return;
      }

      // The service replies { broadcasts, total, page, limit }.
      const list = Array.isArray(data.broadcasts)
        ? (data.broadcasts as BroadcastRecord[])
        : Array.isArray(data.items)
          ? (data.items as BroadcastRecord[])
          : Array.isArray(data)
            ? (data as BroadcastRecord[])
            : [];
      setBroadcasts(list);
      setLoadError(null);
    } catch (err) {
      setBroadcasts([]);
      setLoadError(err instanceof Error ? err.message : "Unable to reach the notification service");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchBroadcasts();
  }, [fetchBroadcasts]);

  const filteredBroadcasts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return broadcasts;
    return broadcasts.filter(
      (b) =>
        b.title?.toLowerCase().includes(q) ||
        b.message?.toLowerCase().includes(q) ||
        b.sent_by?.toLowerCase().includes(q) ||
        b.broadcast_id?.toLowerCase().includes(q)
    );
  }, [broadcasts, search]);

  const hasBroadcasts = broadcasts.length > 0;
  const totalRecipients = broadcasts.reduce((sum, b) => sum + (b.recipients || 0), 0);
  const totalReads = broadcasts.reduce((sum, b) => sum + (b.read_count || 0), 0);
  const readRate = totalRecipients > 0 ? Math.round((totalReads / totalRecipients) * 100) : 0;
  const lastSent = hasBroadcasts
    ? broadcasts
        .map((b) => b.sent_at)
        .filter(Boolean)
        .sort()
        .at(-1)
    : undefined;

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
            Send a platform-wide notification to a user segment and review what has already gone out.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Gated power="PWR_NOTIFICATION_SEND_BROADCAST">
            <BroadcastComposerDialog onSuccess={fetchBroadcasts} />
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
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Broadcasts Sent</span>
            <MegaphoneIcon className="size-4 text-blue-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">
            {hasBroadcasts ? broadcasts.length : "—"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Delivered platform broadcasts</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Reach</span>
            <UsersIcon className="size-4 text-emerald-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">
            {hasBroadcasts ? totalRecipients.toLocaleString("en-IN") : "—"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Notifications delivered across all sends</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Read Rate</span>
            <CheckCircle2Icon className="size-4 text-amber-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">
            {hasBroadcasts ? `${readRate}%` : "—"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {hasBroadcasts ? `${totalReads.toLocaleString("en-IN")} of ${totalRecipients.toLocaleString("en-IN")} opened` : "Opened by recipients"}
          </p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Broadcast</span>
            <BellIcon className="size-4 text-purple-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">
            {lastSent ? new Date(lastSent).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Most recent platform send</p>
        </Card>
      </div>

      {/* ── Main Data Table Card ──────────────────────────────────────────── */}
      <Card className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
        <CardHeader className="gap-3 border-b bg-card px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base font-bold tracking-tight text-foreground">Notification History & Broadcast Log</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">Delivered broadcasts, reach, read counts, and sender</p>
          </div>

          <div className="relative w-full md:w-64">
            <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, message, sender..."
              className="h-8 pl-8 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-card hover:bg-card border-b">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">BROADCAST</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">SENT BY</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">REACH</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">READ</TableHead>
                <TableHead className="w-28 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">DATE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBroadcasts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-36 text-center text-xs text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2 py-4">
                      <BellIcon className="size-8 text-muted-foreground/50" />
                      <p className="font-semibold text-muted-foreground">
                        {loadError
                          ? "Couldn't load broadcast history"
                          : search
                            ? "No broadcasts match your search"
                            : "No broadcasts sent yet"}
                      </p>
                      <p className="text-[11px] text-muted-foreground/80 max-w-sm">
                        {loadError ?? "Use “Compose Broadcast” to send a platform-wide notification."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBroadcasts.map((b) => {
                  const rate = b.recipients > 0 ? Math.round((b.read_count / b.recipients) * 100) : 0;
                  return (
                    <TableRow key={b.broadcast_id} className="transition-colors hover:bg-accent/40 border-b border-border/40">
                      {/* BROADCAST */}
                      <TableCell className="py-3 text-xs">
                        <div className="max-w-md">
                          <p className="font-semibold text-foreground">{b.title}</p>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">{b.message}</p>
                          <p className="text-[11px] text-muted-foreground/70 font-mono">{b.broadcast_id}</p>
                        </div>
                      </TableCell>

                      {/* SENT BY */}
                      <TableCell className="py-3 text-xs">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {b.sent_by || "—"}
                        </Badge>
                      </TableCell>

                      {/* REACH */}
                      <TableCell className="py-3 text-xs font-semibold text-foreground">
                        {(b.recipients || 0).toLocaleString("en-IN")} users
                      </TableCell>

                      {/* READ */}
                      <TableCell className="py-3 text-xs">
                        <span className="font-semibold text-foreground">{(b.read_count || 0).toLocaleString("en-IN")}</span>
                        <span className="text-muted-foreground"> ({rate}%)</span>
                      </TableCell>

                      {/* DATE */}
                      <TableCell className="py-3 text-right text-xs text-muted-foreground">
                        {b.sent_at ? new Date(b.sent_at).toLocaleDateString("en-IN") : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Table Footer */}
          <div className="flex items-center justify-between border-t bg-card px-6 py-3 text-xs text-muted-foreground">
            <span>
              Showing {filteredBroadcasts.length} of {broadcasts.length} total broadcasts
            </span>
            <span className="font-mono text-[11px]">Sends are immediate — no approval queue</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
