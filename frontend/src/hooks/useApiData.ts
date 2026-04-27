import { useState, useEffect } from "react";

interface ApiResponse<T> {
  data: T;
  status?: number;
  message?: string;
}

export const useApiData = <T>(apiCall: () => Promise<ApiResponse<T>>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiCall();
        setData(response.data);
      }

      catch (err) {
        setError("Failed to load data");
        console.error(err);
      }

      finally { setLoading(false); }
    };

    fetchData();
  }, [apiCall]);

  return { data, loading, error };
};