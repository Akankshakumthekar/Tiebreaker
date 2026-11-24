export type ImpactLevel = 'high' | 'medium' | 'low';

export type FrameworkTab = 'weighted' | 'pros_cons' | 'comparison' | 'swot';

export type SwotQuadrantKey = 'strengths' | 'weaknesses' | 'opportunities' | 'threats';

export interface DecisionOption {
  id: string;
  name: string;
  tagline: string;
}

export interface ProConItem {
  id: string;
  text: string;
  impact: ImpactLevel;
}

export interface OptionProsCons {
  optionId: string;
  pros: ProConItem[];
  cons: ProConItem[];
}

export interface ComparisonRow {
  id: string;
  dimension: string;
  values: Record<string, string>;
}

export interface OptionSwot {
  optionId: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface Criterion {
  id: string;
  name: string;
  description: string;
  weight: number; // 1 to 10
}

export interface ScoreEntry {
  criterionId: string;
  optionId: string;
  score: number; // 1 to 10
  rationale: string;
}

export interface DevilsAdvocateResult {
  targetOptionId: string;
  targetOptionName: string;
  generatedAt: string;
  headline: string;
  counterArguments: {
    title: string;
    detail: string;
  }[];
  decidingQuestion: string;
}

export interface Decision {
  id: string;
  title: string;
  context: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
  options: DecisionOption[];
  prosCons: OptionProsCons[];
  comparisonRows: ComparisonRow[];
  swot: OptionSwot[];
  criteria: Criterion[];
  scores: ScoreEntry[];
  blindSpots: string[];
  tiebreakerAdvice: string;
  devilsAdvocate?: DevilsAdvocateResult | null;
}

export interface OptionRanking {
  option: DecisionOption;
  rank: number;
  rawWeightedSum: number;
  maxPossible: number;
  normalizedScore: number; // 0 to 100
  weightedAverage10: number; // 0 to 10
  deltaFromLeader: number;
}

export interface CriterionDriver {
  criterionId: string;
  criterionName: string;
  weight: number;
  leaderScore: number;
  runnerUpScore: number;
  pointAdvantage: number; // positive favors leader, negative favors runner-up
}

export interface WeightedAnalysisSummary {
  rankings: OptionRanking[];
  totalWeight: number;
  leader: OptionRanking | null;
  runnerUp: OptionRanking | null;
  margin: number;
  isCloseCall: boolean;
  isExactTie: boolean;
  drivers: CriterionDriver[];
  sensitivityNote: string | null;
}
