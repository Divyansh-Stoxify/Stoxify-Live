"use client";

type AdminFetchOptions = RequestInit & {
  retryOnUnauthorized?: boolean;
};

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

  const refreshResponse = await fetch("/api/admin/refresh", {
    method: "POST",
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!refreshResponse.ok) {
    return response;
  }

  return fetch(input, {
    ...requestInit,
    cache: requestInit.cache ?? "no-store",
    credentials: requestInit.credentials ?? "same-origin",
  });
}
