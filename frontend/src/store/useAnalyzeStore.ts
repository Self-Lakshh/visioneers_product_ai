import { create } from "zustand";
import { AnalyzeRequest } from "@/types/api";
import { api } from "@/lib/apiClient";

interface AnalyzeState {
  // Input State
  idea: string;
  depth: "quick" | "standard" | "deep";
  includeCompetitors: boolean;
  maxCompetitors: number;
  
  // App State
  status: "idle" | "loading" | "success" | "error";
  errorMessage: string | null;
  loadingMessage: string;
  progress: number;
  
  // Data State
  result: any | null; 
  requestId: string | null;
  partial: boolean;

  // Actions
  setIdea: (idea: string) => void;
  setDepth: (depth: "quick" | "standard" | "deep") => void;
  setIncludeCompetitors: (include: boolean) => void;
  setMaxCompetitors: (max: number) => void;
  reset: () => void;
  analyze: (onStart?: () => void) => Promise<void>;
}

const LOADING_MESSAGES = [
  "Analyzing market intent...",
  "Searching the landscape...",
  "Identifying competitors...",
  "Comparing features...",
  "Synthesizing insights...",
  "Finalizing deeper insights..."
];

export const useAnalyzeStore = create<AnalyzeState>((set, get) => ({
  idea: "",
  depth: "standard",
  includeCompetitors: true,
  maxCompetitors: 3, 
  
  status: "idle",
  errorMessage: null,
  loadingMessage: LOADING_MESSAGES[0],
  progress: 0,
  
  result: null,
  requestId: null,
  partial: false,

  setIdea: (idea) => set({ idea }),
  setDepth: (depth) => set({ depth }),
  setIncludeCompetitors: (includeCompetitors) => set({ includeCompetitors }),
  setMaxCompetitors: (maxCompetitors) => set({ maxCompetitors }),
  
  reset: () => set({ 
    status: "idle", 
    errorMessage: null, 
    result: null, 
    requestId: null, 
    partial: false,
    progress: 0 
  }),

  analyze: async (onStart) => {
    const { idea, depth, includeCompetitors, maxCompetitors } = get();
    
    if (!idea) {
      set({ status: "error", errorMessage: "Please provide a valid product idea." });
      return;
    }

    set({ 
      status: "loading", 
      errorMessage: null, 
      progress: 5,
      loadingMessage: LOADING_MESSAGES[0],
      result: null
    });
    onStart?.();

    // --- 🔮 Hybrid Progress Bar (Active/Moving) ---
    const progressInterval = setInterval(() => {
      set((state) => ({
        progress: state.progress < 95 
          ? state.progress + 0.5 // Slow steady movement
          : state.progress,
        loadingMessage: state.progress < 90 ? state.loadingMessage : "Finalizing..."
      }));
    }, 1000);

    try {
      const requestPayload: AnalyzeRequest = {
        idea,
        depth,
        include_competitors: includeCompetitors,
        max_competitors: maxCompetitors
      };

      await api.streamAnalyzeProduct(requestPayload, (chunk) => {
        const { stage, progress, message, data } = chunk;

        // Manual set to ensure reactivity on nested updates
        set((current) => ({
          progress: Math.max(current.progress, progress || current.progress),
          loadingMessage: message || current.loadingMessage,
          status: stage === "done" ? "success" : "loading",
          result: stage === "done" ? (data || current.result) : current.result,
          requestId: stage === "done" ? (data?.request_id || current.requestId) : current.requestId
        }));

        if (stage === "done") {
          clearInterval(progressInterval);
        }
      });
      
    } catch (error: any) {
      clearInterval(progressInterval);
      set({ 
        status: "error", 
        errorMessage: error.message || "Failed to analyze product.",
        progress: 0 
      });
    }
  }
}));
