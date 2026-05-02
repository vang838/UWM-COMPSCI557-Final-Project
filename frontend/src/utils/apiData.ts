export function unwrapApiData<T>(response: unknown): T {
    const maybeResponse = response as { data?: T };
    return maybeResponse?.data ?? (response as T);
}

export function normalizeApiList<T>(response: unknown): T[] {
    const data = unwrapApiData<any>(response);

    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.results)) {
        return data.results;
    }

    return [];
}

export async function safeApiCall<T>(
    request: () => Promise<unknown>,
    fallback: T
): Promise<T> {
    try {
        const response = await request();
        return unwrapApiData<T>(response);
    } catch (error: any) {
      console.error("API fetch failed:", {
        message: error?.message,
        code: error?.code,
        url: error?.config?.url,
        baseURL: error?.config?.baseURL,
        method: error?.config?.method,
      });

      setError(error?.message || "Failed to fetch data");
    }
}