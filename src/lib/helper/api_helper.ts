import axios, { AxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_API,
  withCredentials: true,
});

const blackList = ["/auth/login", "/auth/register"];

api.interceptors.request.use((req) => {
  if (!blackList.some((u) => req.url?.startsWith(u))) {
    req.headers["X-Requested-With"] = "XMLHttpRequest";
  }
  return req;
});

api.interceptors.response.use(
  (res) => res.data ?? res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      console.warn("Session expired — redirecting");
      window.location.replace("/login");
    }
    return Promise.reject(err);
  }
);

class APIClient {
  get = (url: string, params?: any, config?: AxiosRequestConfig) => {
    if (params) {
      const queryString = new URLSearchParams(params as Record<string, string>).toString();
      return api.get(`${url}?${queryString}`, config);
    }
    return api.get(url, config);
  };

  create = (url: string, data?: any, config?: AxiosRequestConfig) => {
    return api.post(url, data, config);
  };

  put = (url: string, id: number | string, data: any, config?: AxiosRequestConfig) => {
    return api.put(`${url}/${id}`, data, config);
  };

  patch = (url: string, id: number | string, data: any, config?: AxiosRequestConfig) => {
    return api.patch(`${url}/${id}`, data, config);
  };

  delete = (url: string, id: number | string, config?: AxiosRequestConfig) => {
    return api.delete(`${url}/${id}`, config);
  };

  /**
   * POST + Server-Sent Events (SSE) as an async generator.
   * Usage:
   *   for await (const evt of apiClient.streamPost('/api/insights/stream', payload)) { ... }
   */
  async *streamPost<T = any>(
    url: string,
    body?: unknown,
    init?: RequestInit & {
      /** optional abort controller signal */
      signal?: AbortSignal;
      /** extra headers */
      headers?: Record<string, string>;
    }
  ): AsyncGenerator<T, void, unknown> {
    // Build absolute URL from axios baseURL + relative url
    const fullUrl = new URL(url, api.defaults.baseURL || window.location.origin).toString();

    const res = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...init?.headers,
      },
      credentials: "include", // keep cookies/session like axios.withCredentials
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: init?.signal,
    });

    if (!res.ok || !res.body) {
      throw new Error(`SSE request failed (${res.status})`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by \n\n; we only care about "data: " lines
      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const raw = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 2);

        const payload = raw
          .split("\n")
          .filter((line) => line.startsWith("data: "))
          .map((line) => line.slice(6))
          .join("");

        if (!payload) continue;

        try {
          yield JSON.parse(payload) as T;
        } catch {
          // ignore malformed chunk; backend sometimes sends keep-alives
        }
      }
    }
  }
}

export { api, APIClient };
