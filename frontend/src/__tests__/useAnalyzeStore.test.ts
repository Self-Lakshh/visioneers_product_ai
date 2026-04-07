import { describe, it, expect, beforeEach } from "vitest";
import { useAnalyzeStore } from "@/store/useAnalyzeStore";

describe("useAnalyzeStore (Zustand)", () => {
  beforeEach(() => {
    // Reset state before each test
    const store = useAnalyzeStore.getState();
    store.reset();
    store.setUrl("");
  });

  it("should initialize default state correctly", () => {
    const state = useAnalyzeStore.getState();
    expect(state.url).toBe("");
    expect(state.depth).toBe("standard");
    expect(state.includeCompetitors).toBe(true);
    expect(state.maxCompetitors).toBe(5);
    expect(state.status).toBe("idle");
    expect(state.result).toBeNull();
  });

  it("should update URL explicitly", () => {
    useAnalyzeStore.getState().setUrl("https://amazon.com");
    expect(useAnalyzeStore.getState().url).toBe("https://amazon.com");
  });

  it("should reject analyze attempts missing URL", async () => {
    const store = useAnalyzeStore.getState();
    await store.analyze();
    
    const nextState = useAnalyzeStore.getState();
    expect(nextState.status).toBe("error");
    expect(nextState.errorMessage).toContain("valid product URL");
  });
});
