// Frontend representation of the backend schemas

export type SearchDepth = "quick" | "standard" | "deep";

export interface AnalyzeRequest {
  url: string;
  depth?: SearchDepth;
  include_competitors?: boolean;
  max_competitors?: number;
  language?: string;
}

export interface ProductSummary {
  name: string;
  brand: string;
  category: string;
  price_usd: number | null;
  key_features: string[];
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  confidence_score: number;
}

export interface Competitor {
  name: string;
  url: string;
  price_usd: number | null;
  score: number;
  strengths: string[];
  weaknesses: string[];
  confidence_score: number;
  match_reasoning: string;
}

export interface ScoreBreakdown {
  value_for_money: number;
  feature_richness: number;
  market_positioning: number;
  review_sentiment: number;
  competitive_edge: number;
  overall: number;
}

export interface TradeOff {
  dimension: string;
  description: string;
  severity: "low" | "medium" | "high";
}

export interface Recommendation {
  verdict: "strong_buy" | "buy" | "hold" | "avoid";
  summary: string;
  target_audience: string;
  alternatives: string[];
  confidence_score: number;
  explainability_summary: string;
}

export interface AnalyzeResult {
  product: ProductSummary;
  competitors: Competitor[];
  scores: ScoreBreakdown;
  trade_offs: TradeOff[];
  recommendation: Recommendation;
  explainability_log: string[];
  pipeline_meta: Record<string, any>;
}

export interface AnalyzeResponse {
  request_id: string;
  status: "complete" | "error" | "partial";
  message: string;
  data: AnalyzeResult | null;
}
