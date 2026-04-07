import axios from "axios";
import { AnalyzeRequest, AnalyzeResponse } from "@/types/api";

const apiClient = axios.create({
  baseURL: "/api/v1", // Proxied by Vite to the backend in dev
  headers: {
    "Content-Type": "application/json",
  },
});

export const api = {
  analyzeProduct: async (payload: AnalyzeRequest): Promise<AnalyzeResponse> => {
    const response = await apiClient.post<AnalyzeResponse>("/analyze", payload);
    return response.data;
  },
  
  checkHealth: async (): Promise<{ status: string; redis: string }> => {
    const response = await apiClient.get("/health");
    return response.data;
  }
};
