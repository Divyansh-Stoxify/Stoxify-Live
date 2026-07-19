"use client";

import type { ReactNode } from "react";
import {
  ActivityIcon,
  ArrowUpRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircle2Icon,
  GaugeIcon,
  RefreshCwIcon,
  ShieldAlertIcon,
  SlidersHorizontalIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FilterDef, FilterPopover } from "@/components/admin/filters/filter-popover";
import { SearchInput } from "@/components/admin/filters/search-input";

export type { FilterDef };

export type AdminMetric = {
  label: string;
  value: string;
  detail: string;
};

export type AdminRow = Record<string, string>;

export type AdminPageVariant =
  | "analytics"
  | "people"
  | "queue"
  | "catalog"
  | "ledger"
  | "trades"
  | "access"
  | "security"
  | "settings"
  | "reference";

export type AdminPageConfig = {
  title: string;
  eyebrow: string;
  description: string;
  action?: string;
  actionIcon?: ReactNode;
  onAction?: () => void;
  variant?: AdminPageVariant;
  metrics: AdminMetric[];
  columns: string[];
  rows: AdminRow[];
  insights?: AdminMetric[];
  isLoading?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  // action extensions
  items?: Record<string, unknown>[];
  rowActions?: (raw: Record<string, unknown>, refresh: () => void) => ReactNode;
  primaryAction?: ReactNode;
  // search + filter
  onSearch?: (q: string) => void;
  searchQuery?: string;
  searchResetCount?: number;
  searchPlaceholder?: string;
  filters?: FilterDef[];
  filterValues?: Record<string, string>;
  onFiltersChange?: (values: Record<string, string>) => void;
  // pagination
  pagination?: {
    page: number;
    total: number;
    limit: number;
    onPageChange: (page: number) => void;
  };
};

function statusVariant(value: string): "default" | "secondary" | "destructive" | "outline" {
  if (/blocked|critical|failed|rejected|revoked|cancelled/i.test(value)) return "destructive";
  if (/pending|review|warning|paused|watch|draft|medium|high/i.test(value)) return "outline";
  if (/active|approved|live|sent|healthy|ready/i.test(value)) return "default";
  return "secondary";
}

function inferVariant(page: AdminPageConfig): AdminPageVariant {
  if (page.variant) return page.variant;
  if (/analytics/i.test(page.title)) return "analytics";
  if (/pending/i.test(page.title)) return "queue";
  if (/users|analysts|internal team/i.test(page.title)) return "people";
  if (/plans|market instruments/i.test(page.title)) return "catalog";
  if (/subscriptions/i.test(page.title)) return "ledger";
  if (/trades/i.test(page.title)) return "trades";
  if (/roles|powers|assignments/i.test(page.title)) return "access";
  if (/security|threats|logs|sessions|ip blocks/i.test(page.title)) return "security";
  if (/config/i.test(page.title)) return "settings";
  return "reference";
}

export function AdminPageLayout({ page }: { page: AdminPageConfig }) {
  const variant = inferVariant(page);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader page={page} variant={variant} />
      {variant === "analytics" && <AnalyticsLayout page={page} />}
      {variant === "people" && <PeopleLayout page={page} />}
      {variant === "queue" && <QueueLayout page={page} />}
      {variant === "catalog" && <CatalogLayout page={page} />}
      {variant === "ledger" && <LedgerLayout page={page} />}
      {variant === "trades" && <TradesLayout page={page} />}
      {variant === "access" && <AccessLayout page={page} />}
      {variant === "security" && <SecurityLayout page={page} />}
      {variant === "settings" && <SettingsLayout page={page} />}
      {variant === "reference" && <ReferenceLayout page={page} />}
    </div>
  );
}

function PageHeader({ page, variant }: { page: AdminPageConfig; variant: AdminPageVariant }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="font-mono text-[10px] tracking-normal text-muted-foreground uppercase">
          {page.eyebrow}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal text-foreground">
          {page.title}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{page.description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {variant !== "reference" && page.filters?.length ? (
          <FilterPopover
            filters={page.filters}
            values={page.filterValues ?? {}}
            onChange={page.onFiltersChange ?? (() => {})}
          />
        ) : null}
        {page.primaryAction}
        {page.action && (
          <Button disabled={page.isLoading} onClick={page.onAction}>
            {page.actionIcon}
            {page.action}
          </Button>
        )}
      </div>
    </div>
  );
}

function AnalyticsLayout({ page }: { page: AdminPageConfig }) {
  return (
    <>
      <div className="grid gap-px bg-border p-px lg:grid-cols-[1.2fr_2fr]">
        <FeatureMetric metric={page.metrics[0]} />
        <div className="grid gap-px bg-border sm:grid-cols-3">
          {page.metrics.slice(1).map((metric) => (
            <MetricTile metric={metric} key={metric.label} />
          ))}
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <DataPanel page={page} subtitle="Segment performance" />
        {page.insights?.length ? (
          <SignalPanel items={page.insights} />
        ) : (
          <StackedMetrics metrics={page.metrics} />
        )}
      </div>
    </>
  );
}

function PeopleLayout({ page }: { page: AdminPageConfig }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[0.78fr_1.5fr]">
      <div className="grid gap-px bg-border p-px sm:grid-cols-2 xl:grid-cols-1">
        {page.metrics.map((metric) => (
          <MetricTile metric={metric} key={metric.label} />
        ))}
      </div>
      <DataPanel page={page} subtitle="Operational roster" />
    </div>
  );
}

function QueueLayout({ page }: { page: AdminPageConfig }) {
  return (
    <>
      <div className="grid gap-3 lg:grid-cols-3">
        {page.rows.length > 0 ? (
          page.rows.map((row, index) => (
            <ReviewCard
              key={`${row.Applicant ?? row.User ?? row.Role ?? row.Signal ?? "item"}-${index}`}
              row={row}
              rawItem={page.items?.[index]}
              rowActions={page.rowActions}
              refresh={page.onAction}
            />
          ))
        ) : (
          <EmptyState page={page} />
        )}
      </div>
      <div className="grid gap-px bg-border p-px sm:grid-cols-2 xl:grid-cols-4">
        {page.metrics.map((metric) => (
          <MetricTile metric={metric} key={metric.label} />
        ))}
      </div>
    </>
  );
}

function CatalogLayout({ page }: { page: AdminPageConfig }) {
  return (
    <>
      <div className="grid gap-px bg-border p-px sm:grid-cols-2 xl:grid-cols-4">
        {page.metrics.map((metric) => (
          <MetricTile metric={metric} key={metric.label} compact />
        ))}
      </div>
      <DataPanel page={page} subtitle="Catalog and availability" />
    </>
  );
}

function LedgerLayout({ page }: { page: AdminPageConfig }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.5fr_0.7fr]">
      <DataPanel page={page} subtitle="Subscription ledger" />
      <StackedMetrics metrics={page.metrics} />
    </div>
  );
}

function TradesLayout({ page }: { page: AdminPageConfig }) {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {page.metrics.map((metric, index) => (
          <TradePulse metric={metric} emphasis={index === 0} key={metric.label} />
        ))}
      </div>
      <DataPanel page={page} subtitle="Trade supervision" />
    </>
  );
}

function AccessLayout({ page }: { page: AdminPageConfig }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[0.65fr_1.55fr]">
      <AccessRail metrics={page.metrics} />
      <DataPanel page={page} subtitle="Role-based access control" />
    </div>
  );
}

function SecurityLayout({ page }: { page: AdminPageConfig }) {
  return (
    <>
      <div className="grid gap-px bg-border p-px lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
        {page.metrics.map((metric, index) => (
          <SecurityMetric metric={metric} raised={index === 0} key={metric.label} />
        ))}
      </div>
      <DataPanel page={page} subtitle="Investigation queue" />
    </>
  );
}

function SettingsLayout({ page }: { page: AdminPageConfig }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
      <DataPanel page={page} subtitle="Runtime keys" />
      <StackedMetrics metrics={page.insights?.length ? page.insights : page.metrics} />
    </div>
  );
}

function ReferenceLayout({ page }: { page: AdminPageConfig }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[0.8fr_1.4fr]">
      <StackedMetrics metrics={page.metrics} />
      <DataPanel page={page} subtitle="Backend surface map" />
    </div>
  );
}

function FeatureMetric({ metric }: { metric?: AdminMetric }) {
  if (!metric) return null;
  return (
    <div className="flex min-h-44 flex-col justify-between bg-foreground p-5 text-background">
      <div className="flex items-center justify-between">
        <span className="text-xs opacity-70">{metric.label}</span>
        <GaugeIcon className="size-4 opacity-70" />
      </div>
      <div>
        <div className="text-4xl font-semibold">{metric.value}</div>
        <p className="mt-2 text-sm opacity-70">{metric.detail}</p>
      </div>
    </div>
  );
}

function MetricTile({ metric, compact = false }: { metric: AdminMetric; compact?: boolean }) {
  return (
    <div className="bg-background p-4">
      <p className="text-xs text-muted-foreground">{metric.label}</p>
      <div className={compact ? "mt-3 text-xl font-semibold" : "mt-5 text-2xl font-semibold"}>
        {metric.value}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
    </div>
  );
}

function StackedMetrics({ metrics }: { metrics: AdminMetric[] }) {
  return (
    <div className="grid gap-px bg-border p-px">
      {metrics.map((metric) => (
        <MetricTile metric={metric} key={metric.label} />
      ))}
    </div>
  );
}

function TradePulse({ metric, emphasis }: { metric: AdminMetric; emphasis?: boolean }) {
  return (
    <div className={emphasis ? "bg-foreground p-4 text-background" : "border bg-background p-4"}>
      <div className="flex items-center justify-between">
        <p className="text-xs opacity-70">{metric.label}</p>
        <ActivityIcon className="size-4 opacity-70" />
      </div>
      <div className="mt-6 text-2xl font-semibold">{metric.value}</div>
      <p className="mt-1 text-xs opacity-70">{metric.detail}</p>
    </div>
  );
}

function SecurityMetric({ metric, raised }: { metric: AdminMetric; raised?: boolean }) {
  return (
    <div className={raised ? "bg-destructive/10 p-4" : "bg-background p-4"}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{metric.label}</p>
        <ShieldAlertIcon className="size-4 text-muted-foreground" />
      </div>
      <div className="mt-5 text-2xl font-semibold">{metric.value}</div>
      <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
    </div>
  );
}

function AccessRail({ metrics }: { metrics: AdminMetric[] }) {
  return (
    <div className="grid gap-px bg-border p-px">
      {metrics.map((metric, index) => (
        <div className="bg-background p-4" key={metric.label}>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center border">
              {index === 0 ? (
                <CheckCircle2Icon className="size-3.5" />
              ) : (
                <SlidersHorizontalIcon className="size-3.5" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">{metric.label}</p>
          </div>
          <div className="mt-4 text-2xl font-semibold">{metric.value}</div>
          <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
        </div>
      ))}
    </div>
  );
}

function ReviewCard({
  row,
  rawItem,
  rowActions,
  refresh,
}: {
  row: AdminRow;
  rawItem?: Record<string, unknown>;
  rowActions?: (raw: Record<string, unknown>, refresh: () => void) => ReactNode;
  refresh?: () => void;
}) {
  const title = row.Applicant ?? row.User ?? row.Role ?? "Review item";
  const status = row.State ?? row.Status ?? "Review";
  const details = Object.entries(row).filter(
    ([key]) => key !== "Applicant" && key !== "User" && key !== "Role"
  );

  return (
    <Card className="rounded-none bg-background shadow-none ring-1 ring-border">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-sm">{title}</CardTitle>
          <Badge variant={statusVariant(status)}>{status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {details.slice(0, 3).map(([key, value]) => (
          <div className="flex items-center justify-between gap-3 text-xs" key={key}>
            <span className="text-muted-foreground">{key}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
        {rowActions && rawItem ? rowActions(rawItem, refresh ?? (() => {})) : null}
      </CardContent>
    </Card>
  );
}

function SignalPanel({ items }: { items: AdminMetric[] }) {
  return (
    <div className="grid gap-px bg-border p-px">
      {items.map((item) => (
        <div className="bg-background p-4" key={item.label}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{item.label}</p>
            <ArrowUpRightIcon className="size-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-lg font-semibold">{item.value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
        </div>
      ))}
    </div>
  );
}

function DataPanel({ page, subtitle }: { page: AdminPageConfig; subtitle: string }) {
  const hasActions = !!page.rowActions;
  const { pagination } = page;
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1;

  return (
    <Card className="rounded-none bg-background shadow-none ring-1 ring-border">
      <CardHeader className="gap-3 border-b pb-4 md:grid-cols-[1fr_auto]">
        <div>
          <CardTitle>{page.title}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex w-full items-center gap-2 md:w-80">
          {page.onSearch ? (
            <SearchInput
              key={page.searchResetCount ?? 0}
              onSearch={page.onSearch}
              initialValue={page.searchQuery ?? ""}
              placeholder={page.searchPlaceholder ?? "Search"}
              isLoading={page.isLoading}
            />
          ) : (
            <div className="w-full" />
          )}
          <Button
            aria-label="Refresh"
            disabled={page.isLoading}
            onClick={page.onAction}
            size="icon-sm"
            variant="outline"
          >
            <RefreshCwIcon />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {page.columns.map((column) => (
                <TableHead key={column}>{column}</TableHead>
              ))}
              {hasActions && <TableHead className="w-20 text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.errorMessage ? (
              <TableRow>
                <TableCell
                  className="h-24 text-sm text-destructive"
                  colSpan={page.columns.length + (hasActions ? 1 : 0)}
                >
                  {page.errorMessage}
                </TableCell>
              </TableRow>
            ) : page.isLoading ? (
              <TableRow>
                <TableCell
                  className="h-24 text-sm text-muted-foreground"
                  colSpan={page.columns.length + (hasActions ? 1 : 0)}
                >
                  Loading backend data...
                </TableCell>
              </TableRow>
            ) : page.rows.length === 0 ? (
              <TableRow>
                <TableCell
                  className="h-24 text-sm text-muted-foreground"
                  colSpan={page.columns.length + (hasActions ? 1 : 0)}
                >
                  <EmptyCell page={page} />
                </TableCell>
              </TableRow>
            ) : (
              page.rows.map((row, index) => (
                <TableRow key={`${page.title}-${index}`}>
                  {page.columns.map((column) => {
                    const value = row[column] ?? "-";
                    const isState =
                      /state|status|severity|trend|kyc/i.test(column) ||
                      /active|blocked|pending|critical|high|sent|healthy|watch|paused|draft|review/i.test(
                        value
                      );
                    return (
                      <TableCell key={column}>
                        {isState ? <Badge variant={statusVariant(value)}>{value}</Badge> : value}
                      </TableCell>
                    );
                  })}
                  {hasActions && (
                    <TableCell className="text-right">
                      {page.rowActions!(page.items?.[index] ?? {}, page.onAction ?? (() => {}))}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {pagination && (
          <div className="flex items-center justify-between border-t px-4 py-2">
            <span className="text-xs text-muted-foreground">
              Page {pagination.page} of {totalPages} &mdash; {pagination.total} total
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="icon-sm"
                variant="outline"
                disabled={pagination.page <= 1 || page.isLoading}
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                aria-label="Previous page"
              >
                <ChevronLeftIcon />
              </Button>
              <Button
                size="icon-sm"
                variant="outline"
                disabled={pagination.page >= totalPages || page.isLoading}
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                aria-label="Next page"
              >
                <ChevronRightIcon />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ page }: { page: AdminPageConfig }) {
  return (
    <div className="border bg-background p-4 text-sm text-muted-foreground lg:col-span-3">
      {page.errorMessage ?? page.emptyMessage ?? "No backend records returned."}
    </div>
  );
}

function EmptyCell({ page }: { page: AdminPageConfig }) {
  const isFiltered = Boolean(
    page.searchQuery || Object.values(page.filterValues ?? {}).some(Boolean)
  );
  if (isFiltered) {
    return (
      <div className="flex flex-col gap-2">
        <span>No records match the current filters or search.</span>
        {page.onFiltersChange && (
          <button
            type="button"
            className="w-fit text-xs underline underline-offset-2 hover:text-foreground"
            onClick={() => {
              page.onFiltersChange?.({});
              page.onSearch?.("");
            }}
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }
  return <span>{page.emptyMessage ?? "No backend records returned."}</span>;
}
