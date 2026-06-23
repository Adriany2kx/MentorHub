// Shared AI service types

export type MentorRecommendation = {
  mentorId: string;
  score: number;
  reason: string;
};

export type CompatibilityResult = {
  score: number;
  breakdown: {
    expertiseOverlap: number;
    goalAlignment: number;
    timezoneMatch: boolean;
  };
  explanation: string;
};

export type ProfileQualityResult = {
  score: number;
  suggestions: string[];
};

export type Milestone = {
  title: string;
  description?: string;
  order: number;
  suggestedWeeks: number;
};

export type LearningStage = {
  stage: string;
  focus: string;
  resourceTypes: string[];
  estimatedDuration: string;
};

export type ResourceSuggestion = {
  topic: string;
  resourceType: string;
  searchQuery: string;
  rationale: string;
};

export type ProgressInsights = {
  highlights: string[];
  stalledAreas: string[];
  recommendations: string[];
  sessionFrequency: string;
};

export type AgendaItem = {
  item: string;
  rationale: string;
  estimatedMinutes: number;
};

export type SessionSummary = {
  keyPoints: string[];
  decisions: string[];
  actionItems: string[];
  followUpQuestions: string[];
};

export type GoalPrediction = {
  likelihood: number;
  predictedDate: string | null;
  trajectory: "completed" | "on-track" | "at-risk" | "off-track";
  progress: number;
  completedSessions: number;
};

export type Skill = { skill: string; level: string };
