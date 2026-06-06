"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { RefreshCwIcon } from "lucide-react";

import {
  AdminPageLayout,
  type AdminMetric,
  type AdminPageVariant,
  type AdminRow,
  type FilterDef,
} from "@/components/admin/admin-page-layout";
import { adminFetch } from "@/lib/admin/client-api";

export type ApiRecord = Record<string, unknown>;
export type { FilterDef };

const LIMIT = 50;

type ApiAdminPageProps = {
  endpoint: string;
  eyebrow: string;
  title: string;
  description: string;
  action?: string;
  actionIcon?: ReactNode;
  variant?: AdminPageVariant;
  columns: string[];
  collectionKeys?: string[];
  selectItems?: (data: ApiRecord) => unknown[];
  mapRow: (item: ApiRecord, index: number, data: ApiRecord) => AdminRow;
  metrics?: (data: ApiRecord, rows: AdminRow[], items: ApiRecord[]) => AdminMetric[];
  insights?: (data: ApiRecord, rows: AdminRow[], items: ApiRecord[]) => AdminMetric[];
  emptyMessage?: string;
  // action extensions
  rowActions?: (rawItem: ApiRecord, refresh: () => void) => ReactNode;
  primaryAction?: (refresh: () => void) => ReactNode;
  // search + filter
  searchable?: boolean;
  searchPlaceholder?: string;
  filters?: FilterDef[];
  // pagination
  paginated?: boolean;
};

type ApiState = {
  data: ApiRecord | null;
  error: string | null;
  loadedFor: string;
};

function buildUrl(base: string, extra: Record<string, string>) {
  const [path, existing] = base.split("?");
  const params = new URLSearchParams(existing ?? "");
  for (const [k, v] of Object.entries(extra)) {
    if (v) params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

function readHashQuery() {
  if (typeof window === "undefined") return new URLSearchParams();
  const hash = window.location.hash;
  const [, qs] = hash.split("?");
  return new URLSearchParams(qs ?? "");
}

function writeHashQuery(params: URLSearchParams) {
  if (typeof window === "undefined") return;
  const [pathPart] = window.location.hash.replace(/^#\/?/, "dashboard").split("?");
  const qs = params.toString();
  window.history.replaceState(null, "", `#/${pathPart}${qs ? "?" + qs : ""}`);
}

export function ApiAdminPage({
  endpoint,
  eyebrow,
  title,
  description,
  action = "Refresh",
  actionIcon = <RefreshCwIcon />,
  variant,
  columns,
  collectionKeys,
  selectItems,
  mapRow,
  metrics,
  insights,
  emptyMessage,
  rowActions,
  primaryAction,
  searchable = false,
  searchPlaceholder,
  filters,
  paginated = false,
}: ApiAdminPageProps) {
  const [state, setState] = useState<ApiState>({ data: null, error: null, loadedFor: "" });
  const [reloadKey, setReloadKey] = useState(0);

  // Lazy-init from URL hash — no mount effect needed
  const [searchResetCount, setSearchResetCount] = useState(0);
  const [search, setSearch] = useState<string>(() => {
    if (!searchable) return "";
    return readHashQuery().get("q") ?? "";
  });
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() => {
    if (!filters?.length) return {};
    const params = readHashQuery();
    const vals: Record<string, string> = {};
    for (const f of filters) {
      const v = params.get(f.key);
      if (v) vals[f.key] = v;
    }
    return vals;
  });
  const [currentPage, setCurrentPage] = useState<number>(() => {
    if (!paginated) return 1;
    const pageParam = Number(readHashQuery().get("page") ?? 1);
    return pageParam > 1 ? pageParam : 1;
  });

  // Keep hash in sync — skip the very first render
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (searchable && search) params.set("q", search);
    for (const [k, v] of Object.entries(filterValues)) {
      if (v) params.set(k, v);
    }
    if (paginated && currentPage > 1) {
      params.set("page", String(currentPage));
    }
    writeHashQuery(params);
  }, [search, filterValues, currentPage, searchable, paginated]);

  const effectiveEndpoint = useMemo(() => {
    const extra: Record<string, string> = {};
    if (searchable && search) extra.q = search;
    for (const [k, v] of Object.entries(filterValues)) {
      if (v) extra[k] = v;
    }
    if (paginated) {
      extra.page = String(currentPage);
      extra.limit = String(LIMIT);
    }
    return buildUrl(endpoint, extra);
  }, [endpoint, search, filterValues, currentPage, searchable, paginated]);

  // Derive isLoading — true until state reflects the current request
  const currentKey = `${effectiveEndpoint}|${reloadKey}`;
  const isLoading = state.loadedFor !== currentKey;

  useEffect(() => {
    let isActive = true;

    void (async () => {
      try {
        const response = await adminFetch(effectiveEndpoint);
        const payload = (await response.json().catch(() => ({}))) as ApiRecord;

        if (!response.ok) {
          throw new Error(readError(payload) ?? `Request failed with ${response.status}`);
        }

        if (isActive) setState({ data: payload, error: null, loadedFor: currentKey });
      } catch (error) {
        if (isActive) {
          setState({
            data: null,
            error: error instanceof Error ? error.message : "Unable to load backend data.",
            loadedFor: currentKey,
          });
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [currentKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setCurrentPage(1);
    if (!q) setSearchResetCount((c) => c + 1);
  }, []);

  const handleFiltersChange = useCallback((vals: Record<string, string>) => {
    setFilterValues(vals);
    setCurrentPage(1);
  }, []);

  const data = useMemo(() => state.data ?? {}, [state.data]);
  const items = useMemo(
    () => normalizeItems(selectItems ? selectItems(data) : pickCollection(data, collectionKeys)),
    [collectionKeys, data, selectItems]
  );
  const rows = useMemo(
    () => items.map((item, index) => mapRow(item, index, data)),
    [data, items, mapRow]
  );

  const total = useMemo(
    () => asNumber(data.total) ?? asNumber(data.count) ?? rows.length,
    [data, rows.length]
  );

  const pageMetrics = useMemo(() => {
    if (isLoading) return loadingMetrics(title);
    if (state.error) return errorMetrics(state.error);
    return metrics ? metrics(data, rows, items) : defaultMetrics(data, rows);
  }, [data, isLoading, items, metrics, rows, state.error, title]);

  const pageInsights = useMemo(() => {
    if (!state.data || state.error || isLoading || !insights) return undefined;
    return insights(data, rows, items);
  }, [data, insights, isLoading, items, rows, state.data, state.error]);

  return (
    <AdminPageLayout
      page={{
        eyebrow,
        title,
        description,
        action,
        actionIcon,
        onAction: refresh,
        variant,
        metrics: pageMetrics,
        columns,
        rows,
        items,
        insights: pageInsights,
        isLoading: isLoading,
        errorMessage: state.error ?? undefined,
        emptyMessage,
        rowActions,
        primaryAction: primaryAction ? primaryAction(refresh) : undefined,
        onSearch: searchable ? handleSearch : undefined,
        searchQuery: search,
        searchResetCount: searchable ? searchResetCount : undefined,
        searchPlaceholder: searchable ? searchPlaceholder : undefined,
        filters: filters?.length ? filters : undefined,
        filterValues,
        onFiltersChange: filters?.length ? handleFiltersChange : undefined,
        pagination: paginated
          ? {
              page: currentPage,
              total,
              limit: LIMIT,
              onPageChange: (p) => setCurrentPage(p),
            }
          : undefined,
      }}
    />
  );
}

function readError(data: ApiRecord) {
  return asText(data.message) ?? asText(data.error) ?? asText(data.code);
}

function loadingMetrics(title: string): AdminMetric[] {
  return [
    { label: "Source", value: "Loading", detail: title },
    { label: "Rows", value: "-", detail: "Waiting for backend response" },
    { label: "Status", value: "Pending", detail: "API request in progress" },
    { label: "Mode", value: "Live", detail: "Backend records only" },
  ];
}

function errorMetrics(error: string): AdminMetric[] {
  return [
    { label: "Source", value: "API error", detail: error },
    { label: "Rows", value: "0", detail: "Nothing rendered without backend data" },
    { label: "Status", value: "Failed", detail: "Check auth, powers, or service health" },
    { label: "Mode", value: "Live", detail: "Backend required" },
  ];
}

function defaultMetrics(data: ApiRecord, rows: AdminRow[]): AdminMetric[] {
  return [
    {
      label: "Total",
      value: formatNumber(totalFrom(data, rows.length)),
      detail: "Backend reported total",
    },
    { label: "Loaded", value: formatNumber(rows.length), detail: "Rows in current response" },
    { label: "Page", value: asText(data.page) ?? "1", detail: "Current backend page" },
    {
      label: "Limit",
      value: asText(data.limit ?? data.offset) ?? "-",
      detail: "Backend pagination",
    },
  ];
}

function pickCollection(data: ApiRecord, keys?: string[]) {
  const candidates = keys ?? [
    "users",
    "analysts",
    "members",
    "plans",
    "subscriptions",
    "trades",
    "notifications",
    "instruments",
    "roles",
    "powers",
    "sessions",
    "logs",
    "ip_blocks",
    "blocks",
    "config",
    "items",
  ];

  for (const key of candidates) {
    const value = data[key];
    if (Array.isArray(value)) return value;
  }

  if (Array.isArray(data)) return data;
  return [];
}

function normalizeItems(items: unknown[]) {
  return items.map((item) => (isRecord(item) ? item : { value: item }));
}

function isRecord(value: unknown): value is ApiRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function asText(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return undefined;
}

export function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function nested(record: ApiRecord, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!isRecord(current)) return undefined;
    return current[key];
  }, record);
}

export function field(record: ApiRecord, paths: string[], fallback = "-") {
  for (const path of paths) {
    const value = asText(nested(record, path));
    if (value) return value;
  }
  return fallback;
}

export function numberField(record: ApiRecord, paths: string[], fallback = 0) {
  for (const path of paths) {
    const value = asNumber(nested(record, path));
    if (value !== undefined) return value;
  }
  return fallback;
}

export function formatNumber(value: unknown) {
  const number = asNumber(value);
  return number === undefined ? "-" : new Intl.NumberFormat("en-IN").format(number);
}

export function formatCurrency(value: unknown) {
  const number = asNumber(value);
  if (number === undefined) return "-";
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(number);
}

export function formatPercent(value: unknown) {
  const number = asNumber(value);
  return number === undefined ? "-" : `${number.toFixed(number % 1 === 0 ? 0 : 2)}%`;
}

export function formatDate(value: unknown) {
  const text = asText(value);
  if (!text) return "-";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatList(value: unknown) {
  if (Array.isArray(value))
    return (
      value
        .map((item) => asText(item))
        .filter(Boolean)
        .join(", ") || "-"
    );
  return asText(value) ?? "-";
}

export function stateLabel(value: unknown) {
  return (asText(value) ?? "-").replaceAll("_", " ");
}

export function totalFrom(data: ApiRecord, fallback = 0) {
  return asNumber(data.total) ?? asNumber(data.count) ?? fallback;
}

export function countRows(rows: AdminRow[], column: string, matcher: RegExp) {
  return rows.filter((row) => matcher.test(row[column] ?? "")).length;
}

export function metric(label: string, value: unknown, detail: string): AdminMetric {
  return { label, value: asText(value) ?? formatNumber(value), detail };
}
