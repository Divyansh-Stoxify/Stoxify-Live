"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  FilterIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  ShieldOffIcon,
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

export type SecurityIncidentRecord = {
  log_id: string;
  incident_type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  user_id: string;
  ip_address: string;
  request_url: string;
  timestamp: string;
};

function severityVariant(value: string): "default" | "secondary" | "destructive" | "outline" {
  if (/critical|high/i.test(value)) return "destructive";
  if (/medium/i.test(value)) return "outline";
  return "secondary";
}

export function SecurityOverviewPage() {
  const [incidents, setIncidents] = useState<SecurityIncidentRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Filtered Incidents List
  const filteredIncidents = useMemo(() => {
    return incidents.filter((i) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        i.incident_type.toLowerCase().includes(q) ||
        i.user_id.toLowerCase().includes(q) ||
        i.ip_address.toLowerCase().includes(q) ||
        i.request_url.toLowerCase().includes(q);

      const matchesSeverity =
        filterSeverity === "all" || i.severity.toLowerCase() === filterSeverity.toLowerCase();

      return matchesSearch && matchesSeverity;
    });
  }, [incidents, search, filterSeverity]);

  const hasIncidents = incidents.length > 0;
  const criticalCount = hasIncidents ? incidents.filter((i) => i.severity === "CRITICAL").length : "—";
  const highCount = hasIncidents ? incidents.filter((i) => i.severity === "HIGH").length : "—";
  const activeIpBlocks = hasIncidents ? incidents.filter((i) => /blocked/i.test(i.incident_type)).length : "—";

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-normal text-muted-foreground uppercase">
            SECURITY & THREAT AUDIT
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Security Overview</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Threat summary, active investigation cases, IP blocklist, and authentication incident logs.
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
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Incidents</span>
            <ShieldAlertIcon className="size-4 text-amber-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{hasIncidents ? incidents.length : "—"}</div>
          <p className="mt-1 text-xs text-muted-foreground">Security event log stream</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Critical Threats</span>
            <AlertTriangleIcon className="size-4 text-destructive" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{criticalCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">High urgency security events</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">High Severity</span>
            <ShieldOffIcon className="size-4 text-amber-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{highCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">Investigative threat incidents</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active IP Blocks</span>
            <ShieldCheckIcon className="size-4 text-emerald-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{activeIpBlocks}</div>
          <p className="mt-1 text-xs text-muted-foreground">Enforced security blocklist</p>
        </Card>
      </div>

      {/* ── Main Data Table Card ──────────────────────────────────────────── */}
      <Card className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
        <CardHeader className="gap-3 border-b bg-muted/20 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base font-bold tracking-tight text-foreground">Recent Security Incidents Stream</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">Auth security signals, request URLs, IP addresses, and severity classification</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Severity Filter */}
            <div className="flex items-center gap-1.5 border rounded-md bg-background px-2 py-1">
              <FilterIcon className="size-3.5 text-muted-foreground" />
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="bg-transparent text-xs font-medium text-foreground focus:outline-hidden"
              >
                <option value="all">All Severities</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search incident, user, IP..."
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">INCIDENT SIGNAL</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">SEVERITY</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">USER / TARGET</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">IP ADDRESS</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">REQUEST URL</TableHead>
                <TableHead className="w-28 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">TIMESTAMP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncidents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center text-xs text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2 py-4">
                      <ShieldCheckIcon className="size-8 text-muted-foreground/50" />
                      <p className="font-semibold text-muted-foreground">No recent security incidents returned</p>
                      <p className="text-[11px] text-muted-foreground/80 max-w-sm">
                        Authentication and security incident logs will stream here automatically when reported by security microservices.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredIncidents.map((i) => (
                  <TableRow key={i.log_id} className="transition-colors hover:bg-muted/40">
                    {/* INCIDENT SIGNAL */}
                    <TableCell className="py-3 text-xs">
                      <div>
                        <p className="font-bold text-foreground font-mono">{i.incident_type}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{i.log_id}</p>
                      </div>
                    </TableCell>

                    {/* SEVERITY */}
                    <TableCell className="py-3 text-xs">
                      <Badge variant={severityVariant(i.severity)} className="font-semibold text-[10px] tracking-wide px-2 py-0.5">
                        {i.severity}
                      </Badge>
                    </TableCell>

                    {/* USER / TARGET */}
                    <TableCell className="py-3 text-xs font-medium">
                      {i.user_id}
                    </TableCell>

                    {/* IP ADDRESS */}
                    <TableCell className="py-3 text-xs font-mono font-medium">
                      {i.ip_address}
                    </TableCell>

                    {/* REQUEST URL */}
                    <TableCell className="py-3 text-xs font-mono text-muted-foreground">
                      {i.request_url}
                    </TableCell>

                    {/* TIMESTAMP */}
                    <TableCell className="py-3 text-right text-xs text-muted-foreground">
                      {i.timestamp ? new Date(i.timestamp).toLocaleTimeString("en-IN") : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Table Footer */}
          <div className="flex items-center justify-between border-t bg-muted/10 px-6 py-3 text-xs text-muted-foreground">
            <span>
              Showing {filteredIncidents.length} of {incidents.length} total incidents
            </span>
            <span className="font-mono text-[11px]">Security Overview Active</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
