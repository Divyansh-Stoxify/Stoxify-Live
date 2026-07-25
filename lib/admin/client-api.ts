"use client";

type AdminFetchOptions = RequestInit & {
  retryOnUnauthorized?: boolean;
};

let refreshPromise: Promise<Response> | null = null;

export async function adminFetch(input: RequestInfo | URL, init: AdminFetchOptions = {}) {
  const { retryOnUnauthorized = true, ...requestInit } = init;
  const response = await fetch(input, {
    ...requestInit,
    cache: requestInit.cache ?? "no-store",
    credentials: requestInit.credentials ?? "same-origin",
  });

  if (!retryOnUnauthorized || response.status !== 401) {
    return response;
  }

  if (!refreshPromise) {
    refreshPromise = fetch("/api/admin/refresh", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
    }).finally(() => {
      refreshPromise = null;
    });
  }

  const refreshResponse = await refreshPromise;

  if (!refreshResponse.ok) {
    return response;
  }

  return fetch(input, {
    ...requestInit,
    cache: requestInit.cache ?? "no-store",
    credentials: requestInit.credentials ?? "same-origin",
  });
}
