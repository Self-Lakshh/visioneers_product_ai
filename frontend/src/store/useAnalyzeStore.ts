import { create } from "zustand";
import { AnalyzeRequest, AnalyzeResult } from "@/types/api";
import { api } from "@/lib/apiClient";

interface AnalyzeState {
  // Input State
  url: string;
  depth: "quick" | "standard" | "deep";
  includeCompetitors: boolean;
  maxCompetitors: number;
  
  // App State
  status: "idle" | "loading" | "success" | "error";
  errorMessage: string | null;
  
  // Data State
  result: AnalyzeResult | null;
  requestId: string | null;
  partial: boolean;

  // Actions
  setUrl: (url: string) => void;
  setDepth: (depth: "quick" | "standard" | "deep") => void;
  setIncludeCompetitors: (include: boolean) => void;
  setMaxCompetitors: (max: number) => void;
  reset: () => void;
  analyze: () => Promise<void>;
}

export const useAnalyzeStore = create<AnalyzeState>((set, get) => ({
  url: "",
  depth: "standard",
  includeCompetitors: true,
  maxCompetitors: 5,
  
  status: "idle",
  errorMessage: null,
  
  result: null,
  requestId: null,
  partial: false,

  setUrl: (url) => set({ url }),
  setDepth: (depth) => set({ depth }),
  setIncludeCompetitors: (includeCompetitors) => set({ includeCompetitors }),
  setMaxCompetitors: (maxCompetitors) => set({ maxCompetitors }),
  
  reset: () => set({ 
    status: "idle", 
    errorMessage: null, 
    result: null, 
    requestId: null, 
    partial: false 
  }),

  analyze: async () => {
    const { url, depth, includeCompetitors, maxCompetitors } = get();
    
    if (!url) {
      set({ status: "error", errorMessage: "Please enter a valid product URL." });
      return;
    }

    try {
      set({ status: "loading", errorMessage: null });
      
      const requestPayload: AnalyzeRequest = {
        url,
        depth,
        include_competitors: includeCompetitors,
        max_competitors: maxCompetitors
      };

      const response = await api.analyzeProduct(requestPayload);
      
      set({
        status: response.status === "error" ? "error" : "success",
        errorMessage: response.status === "error" ? response.message : null,
        result: response.data,
        requestId: response.request_id,
        partial: response.status === "partial"
      });
      
    } catch (error: any) {
      set({ 
        status: "error", 
        errorMessage: error.response?.data?.detail?.message || error.message || "Failed to analyze product." 
      });
    }
  }
}));
