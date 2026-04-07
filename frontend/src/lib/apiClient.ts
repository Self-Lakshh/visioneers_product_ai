import axios from "axios";
import { AnalyzeRequest, AnalyzeResponse } from "@/types/api";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const apiClient = axios.create({
  baseURL: `${baseURL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

export const api = {
  analyzeProduct: async (payload: AnalyzeRequest): Promise<AnalyzeResponse> => {
    const response = await apiClient.post<AnalyzeResponse>("/analyze", payload);
    return response.data;
  },

  // Premium Streaming Handler (with Tracing)
  streamAnalyzeProduct: async (
    payload: AnalyzeRequest, 
    onChunk: (chunk: any) => void
  ): Promise<void> => {
    console.log("STREAMING START: Initiating fetch to", `${baseURL}/api/v1/analyze`);
    
    const response = await fetch(`${baseURL}/api/v1/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("STREAMING ERROR: Fetch failed", response.status);
      throw new Error(`Connection failed (${response.status}). Please check if backend is running.`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      console.error("STREAMING ERROR: Body reader not available");
      return;
    }

    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        console.log("STREAMING COMPLETE: Reader finished.");
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.startsWith("data: ")) {
          try {
            const jsonText = trimmed.replace("data: ", "").trim();
            if (!jsonText) continue;
            const chunk = JSON.parse(jsonText);
            console.log("STREAMING CHUNK RECEIVED:", chunk.stage || "progress", chunk);
            onChunk(chunk);
          } catch (e) {
            console.error("STREAMING PARSE ERROR:", e, "Part:", trimmed);
          }
        }
      }
    }
  },
  
  checkHealth: async (): Promise<{ status: string; redis: string }> => {
    const response = await apiClient.get("/health");
    return response.data;
  }
};
