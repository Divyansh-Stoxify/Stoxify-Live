"use client";

import { useMemo, useState } from "react";
import {
  ActivityIcon,
  CandlestickChartIcon,
  CheckCircle2Icon,
  ClockIcon,
  FilterIcon,
  LayersIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
  TrendingUpIcon,
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
import { Gated } from "@/components/admin/admin-permissions-provider";
import { ConfirmActionDialog } from "@/components/admin/dialogs/confirm-action-dialog";

export type TradeRecord = {
  trade_id: string;
  symbol: string;
  analyst_name: string;
  segment: string;
  trade_type: string;
  status: "LIVE" | "CLOSED_BY_TARGET" | "CLOSED_BY_SL" | "CLOSED_BY_MANUAL";
  pnl_percent: number;
  entry_timestamp: string;
};

function statusVariant(value: string): "default" | "secondary" | "destructive" | "outline" {
  if (/sl/i.test(value)) return "destructive";
  if (/target|closed/i.test(value)) return "secondary";
  if (/live/i.test(value)) return "default";
  return "outline";
}

export function TradesPage() {
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSegment, setFilterSegment] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleDeleteTrade = (tradeId: string) => {
    setTrades((prev) => prev.filter((t) => t.trade_id !== tradeId));
  };

  // Filtered Trades List
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        t.symbol.toLowerCase().includes(q) ||
        t.analyst_name.toLowerCase().includes(q) ||
        t.segment.toLowerCase().includes(q) ||
        t.trade_id.toLowerCase().includes(q);

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "LIVE" && t.status === "LIVE") ||
        (filterStatus === "CLOSED" && t.status !== "LIVE");

      const matchesSegment =
        filterSegment === "all" || t.segment.toLowerCase() === filterSegment.toLowerCase();

      return matchesSearch && matchesStatus && matchesSegment;
    });
  }, [trades, search, filterStatus, filterSegment]);

  const hasTrades = trades.length > 0;
  const liveCount = hasTrades ? trades.filter((t) => t.status === "LIVE").length : "—";
  const closedCount = hasTrades ? trades.filter((t) => t.status !== "LIVE").length : "—";
  const avgPnl = hasTrades
    ? (trades.reduce((sum, t) => sum + (t.pnl_percent || 0), 0) / trades.length).toFixed(1)
    : "—";

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-normal text-muted-foreground uppercase">
            TRADE MONITOR & SUPERVISION
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Trades</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Read-only global feed of trade signals published by SEBI analysts across equity, options, and futures.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Trades</span>
            <CandlestickChartIcon className="size-4 text-amber-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{hasTrades ? trades.length : "—"}</div>
          <p className="mt-1 text-xs text-muted-foreground">Published trade signals</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live Trades</span>
            <ActivityIcon className="size-4 text-emerald-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{liveCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">Active market positions</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Closed Trades</span>
            <CheckCircle2Icon className="size-4 text-blue-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{closedCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">Completed positions</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg PnL %</span>
            <TrendingUpIcon className="size-4 text-emerald-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">
            {typeof avgPnl === "string" && avgPnl !== "—" ? `${avgPnl}%` : "—"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Platform average return</p>
        </Card>
      </div>

      {/* ── Main Data Table Card ──────────────────────────────────────────── */}
      <Card className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
        <CardHeader className="gap-3 border-b bg-muted/20 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base font-bold tracking-tight text-foreground">Global Trade Feed</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">Trade signals, analyst attribution, segment, PnL %, and execution timestamps</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 border rounded-md bg-background px-2 py-1">
              <FilterIcon className="size-3.5 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-xs font-medium text-foreground focus:outline-hidden"
              >
                <option value="all">All Statuses</option>
                <option value="LIVE">LIVE Positions</option>
                <option value="CLOSED">CLOSED Positions</option>
              </select>
            </div>

            {/* Segment Filter */}
            <div className="flex items-center gap-1.5 border rounded-md bg-background px-2 py-1">
              <LayersIcon className="size-3.5 text-muted-foreground" />
              <select
                value={filterSegment}
                onChange={(e) => setFilterSegment(e.target.value)}
                className="bg-transparent text-xs font-medium text-foreground focus:outline-hidden"
              >
                <option value="all">All Segments</option>
                <option value="EQUITY">EQUITY</option>
                <option value="OPTIONS">OPTIONS</option>
                <option value="FUTURES">FUTURES</option>
                <option value="COMMODITY">COMMODITY</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search symbol, analyst..."
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">TRADE SIGNAL</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">ANALYST</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">SEGMENT</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">STATUS</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">PNL %</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">ENTRY DATE</TableHead>
                <TableHead className="w-20 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-36 text-center text-xs text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2 py-4">
                      <CandlestickChartIcon className="size-8 text-muted-foreground/50" />
                      <p className="font-semibold text-muted-foreground">No trade signals to display</p>
                      <p className="text-[11px] text-muted-foreground/80 max-w-sm">
                        Trade signals published by SEBI registered analysts will appear here automatically.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTrades.map((trade) => (
                  <TableRow key={trade.trade_id} className="transition-colors hover:bg-muted/40">
                    {/* TRADE SIGNAL */}
                    <TableCell className="py-3 text-xs">
                      <div>
                        <p className="font-bold text-foreground font-mono">{trade.symbol}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <span>{trade.trade_type}</span>
                          <span className="font-mono text-[10px] text-muted-foreground/70">• {trade.trade_id}</span>
                        </p>
                      </div>
                    </TableCell>

                    {/* ANALYST */}
                    <TableCell className="py-3 text-xs font-medium">
                      {trade.analyst_name}
                    </TableCell>

                    {/* SEGMENT */}
                    <TableCell className="py-3 text-xs">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {trade.segment}
                      </Badge>
                    </TableCell>

                    {/* STATUS */}
                    <TableCell className="py-3 text-xs">
                      <Badge variant={statusVariant(trade.status)} className="font-semibold text-[10px] tracking-wide px-2 py-0.5">
                        {trade.status}
                      </Badge>
                    </TableCell>

                    {/* PNL % */}
                    <TableCell className="py-3 text-xs font-bold">
                      <span className={trade.pnl_percent >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>
                        {trade.pnl_percent >= 0 ? `+${trade.pnl_percent}%` : `${trade.pnl_percent}%`}
                      </span>
                    </TableCell>

                    {/* ENTRY DATE */}
                    <TableCell className="py-3 text-xs text-muted-foreground">
                      {trade.entry_timestamp ? new Date(trade.entry_timestamp).toLocaleDateString("en-IN") : "—"}
                    </TableCell>

                    {/* ACTIONS */}
                    <TableCell className="py-3 text-right">
                      <Gated power="PWR_ADMIN_SYSTEM_CONFIG">
                        <ConfirmActionDialog
                          title="Delete Trade Record (Danger Zone)"
                          description={`Founder Action: Delete trade signal "${trade.symbol}" (${trade.trade_id})? Type DELETE to confirm.`}
                          requireConfirmText="DELETE"
                          confirmLabel="Delete Trade"
                          destructive
                          onConfirm={() => handleDeleteTrade(trade.trade_id)}
                          trigger={
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10"
                              title="Founder Action: Delete Trade"
                            >
                              <Trash2Icon className="size-3.5" />
                            </Button>
                          }
                        />
                      </Gated>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Table Footer */}
          <div className="flex items-center justify-between border-t bg-muted/10 px-6 py-3 text-xs text-muted-foreground">
            <span>
              Showing {filteredTrades.length} of {trades.length} total trades
            </span>
            <span className="font-mono text-[11px]">Trade Monitor Active</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
