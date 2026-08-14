import { z } from "zod";

export const aiAnalysisSchema = z.object({
  summary: z.string().min(1),
  topLanguages: z.array(z.string()),
  frameworksDetected: z.array(z.string()),
  experienceLevel: z.enum(["Junior", "Mid-Level", "Senior"]),
  levelReasoning: z.string().min(1),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  bestRepository: z.string().nullable(),
  suggestedRoles: z.array(z.string()),
  learningRecommendations: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export const careerAdviceSchema = z.object({
  currentLevelAssessment: z.string().min(1),
  targetRoles: z.array(z.string()),
  skillGaps: z.array(z.string()),
  roadmap: z.array(
    z.object({
      priority: z.enum(["High", "Medium", "Low"]),
      action: z.string(),
      reason: z.string(),
    }),
  ),
  portfolioImprovementTips: z.array(z.string()),
  estimatedTimeToNextLevel: z.string(),
});
export const compareResultSchema = z.object({
  summary: z.string().min(1),
  winnerByCategory: z.object({
    languageDiversity: z.string(),
    projectPopularity: z.string(),
    activityConsistency: z.string(),
    codeQualitySignal: z.string(),
  }),
  profileA: z.object({
    username: z.string(),
    strengths: z.array(z.string()),
    uniqueTraits: z.array(z.string()),
  }),
  profileB: z.object({
    username: z.string(),
    strengths: z.array(z.string()),
    uniqueTraits: z.array(z.string()),
  }),
  verdict: z.string(),
});

export const repositoryReviewSchema = z.object({
  overallImpression: z.string().min(1),
  codeQualitySignals: z.array(z.string()),
  documentationQuality: z.enum(["Poor", "Fair", "Good", "Excellent"]),
  documentationFeedback: z.string(),
  suggestedImprovements: z.array(z.string()),
  goodPractices: z.array(z.string()),
  recruiterAppeal: z.enum(["Low", "Medium", "High"]),
  recruiterAppealReasoning: z.string(),
});

export const portfolioScoreSchema = z.object({
  overallScore: z.number().min(0).max(100),
  breakdown: z.object({
    consistency: z.number().min(0).max(100),
    diversity: z.number().min(0).max(100),
    documentation: z.number().min(0).max(100),
    popularity: z.number().min(0).max(100),
    activity: z.number().min(0).max(100),
  }),
  scoreExplanation: z.object({
    consistency: z.string(),
    diversity: z.string(),
    documentation: z.string(),
    popularity: z.string(),
    activity: z.string(),
  }),
  summary: z.string(),
  quickWins: z.array(z.string()),
});

export type PortfolioScore = z.infer<typeof portfolioScoreSchema>;

export type RepositoryReview = z.infer<typeof repositoryReviewSchema>;

export type CompareResult = z.infer<typeof compareResultSchema>;

export type CareerAdvice = z.infer<typeof careerAdviceSchema>;

export type AiAnalysis = z.infer<typeof aiAnalysisSchema>;
