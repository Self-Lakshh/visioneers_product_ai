import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { InputPanel } from "@/components/features/InputPanel";
import { useAnalyzeStore } from "@/store/useAnalyzeStore";

// Mock Zustand store internally for isolating component reactions
vi.mock("@/store/useAnalyzeStore", () => ({
  useAnalyzeStore: vi.fn(),
}));

describe("InputPanel UI", () => {
  let mockAnalyze: any;

  beforeEach(() => {
    mockAnalyze = vi.fn();
    (useAnalyzeStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      idea: "",
      setIdea: vi.fn(),
      depth: "standard",
      setDepth: vi.fn(),
      includeCompetitors: true,
      setIncludeCompetitors: vi.fn(),
      status: "idle",
      errorMessage: null,
      analyze: mockAnalyze,
    });
  });

  it("renders input correctly with accessible aria-label", () => {
    render(<InputPanel />);
    const input = screen.getByLabelText(/Product Idea to analyze/i);
    expect(input).toBeInTheDocument();
    expect(input).toBeEnabled();
  });

  it("submits debounced value on button click", async () => {
    render(<InputPanel />);
    const user = userEvent.setup();
    const input = screen.getByLabelText(/Product Idea to analyze/i);
    const button = screen.getByRole("button", { name: /Analyze Product/i });
    
    await user.type(input, "wireless gaming mouse");
    expect(input).toHaveValue("wireless gaming mouse");

    await user.click(button);
    expect(mockAnalyze).toHaveBeenCalledTimes(1);
  });

  it("renders loading state gracefully", () => {
    (useAnalyzeStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      idea: "",
      setIdea: vi.fn(),
      status: "loading",
      errorMessage: null,
      analyze: mockAnalyze,
    });
    
    render(<InputPanel />);
    expect(screen.getByText(/Running Intelligence Pipeline/i)).toBeInTheDocument();
  });

  it("shows error UI on failure", () => {
    (useAnalyzeStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      idea: "",
      setIdea: vi.fn(),
      status: "error",
      errorMessage: "Provided idea unclear.",
      analyze: mockAnalyze,
    });

    render(<InputPanel />);
    expect(screen.getByText(/Provided idea unclear./i)).toBeInTheDocument();
  });
});
