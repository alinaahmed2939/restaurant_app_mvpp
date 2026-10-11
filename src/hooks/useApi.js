// src/hooks/useApi.js
// Custom hook: loads data from the server and returns data, loading, error, refetch.

import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "../api/client";

export default function useApi(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // silent = true is used by pull-to-refresh (no full-screen spinner)
  const refetch = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const result = await apiRequest(path);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [path]
  );

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}