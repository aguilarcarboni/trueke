"use client";

import { APIResponse } from "@/lib/api";
import { fetchAPI } from "@/utils/api";
import { useEffect, useState } from "react";

const Main = () => {

  const [health, setHealth] = useState<APIResponse | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      const response = await fetchAPI("/api/health");
        setHealth(response);
      };
    checkHealth();
  }, []);

  if (!health) {
    return <div>Loading...</div>;
  }

  return <div>{health.message}</div>;
};

export default Main;
