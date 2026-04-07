// Frontend representation of the simplified backend schemas (April 2026)

export type SearchDepth = "quick" | "standard" | "deep";

export interface AnalyzeRequest {
  idea: string;
  depth?: SearchDepth;
  include_competitors?: boolean;
  max_competitors?: number;
}

export interface CompetitorItem {
  name: string;
  tagline: string;
  delivery_claim: string;
  key_features: string[];
  strengths: string[];
  weaknesses: string[];
  url?: string;
  price_usd?: number | null;
}

export interface MarketInsight {
  summary: string;
  key_gap: string;
  recommendation: string;
  idea_score: number;
  verdict: string;
  target_audience: string;
  alternatives: string[];
  explainability_summary: string;
}

export interface AnalyzeResult {
  competitors: CompetitorItem[];
  market_insight: MarketInsight;
  product_name?: string;
}

export interface AnalyzeResponse {
  request_id: string;
  status: "complete" | "error" | "partial";
  message: string;
  data: AnalyzeResult | null;
}
