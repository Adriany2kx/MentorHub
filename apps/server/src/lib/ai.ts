import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { Schema } from "@google/generative-ai";
import { env } from "../config/env.js";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// Gemini 1.5 Flash — free tier: 15 RPM, 1M tokens/day
// JSON mode enforces exact output shape — no markdown parsing needed
export function getModel(schema?: Schema) {
  return genAI.getGenerativeModel({
    model: env.AI_MODEL,
    generationConfig: schema
      ? { responseMimeType: "application/json", responseSchema: schema }
      : { responseMimeType: "text/plain" },
  });
}

// Mentor recommendation item schema
export const mentorMatchSchema: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      mentorId: { type: SchemaType.STRING, description: "The mentor profile ID", nullable: false },
      score: { type: SchemaType.NUMBER, description: "Match score 0-100", nullable: false },
      reason: { type: SchemaType.STRING, description: "One-sentence match reason", nullable: false },
    },
    required: ["mentorId", "score", "reason"],
  },
};

// Compatibility explanation schema
export const compatibilitySchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    explanation: { type: SchemaType.STRING, description: "Max 30-word explanation of fit", nullable: false },
  },
  required: ["explanation"],
};

// Micro-milestone schema (Sprint 15)
export const milestoneSchema: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      title: { type: SchemaType.STRING, nullable: false },
      description: { type: SchemaType.STRING, nullable: true },
      order: { type: SchemaType.NUMBER, nullable: false },
      suggestedWeeks: { type: SchemaType.NUMBER, nullable: false },
    },
    required: ["title", "order", "suggestedWeeks"],
  },
};

// Session summary schema (Sprint 14)
export const sessionSummarySchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    keyPoints: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, nullable: false },
    decisions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, nullable: false },
    actionItems: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, nullable: false },
    followUpQuestions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, nullable: false },
  },
  required: ["keyPoints", "decisions", "actionItems", "followUpQuestions"],
};

// Session agenda schema (Sprint 14)
export const agendaSchema: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      item: { type: SchemaType.STRING, nullable: false },
      rationale: { type: SchemaType.STRING, nullable: false },
      estimatedMinutes: { type: SchemaType.NUMBER, nullable: false },
    },
    required: ["item", "rationale", "estimatedMinutes"],
  },
};

// Resource recommendation schema (Sprint 15)
export const resourceSchema: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      topic: { type: SchemaType.STRING, nullable: false },
      resourceType: { type: SchemaType.STRING, nullable: false },
      searchQuery: { type: SchemaType.STRING, nullable: false },
      rationale: { type: SchemaType.STRING, nullable: false },
    },
    required: ["topic", "resourceType", "searchQuery", "rationale"],
  },
};

// Progress insights schema (Sprint 15)
export const insightsSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    highlights: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, nullable: false },
    stalledAreas: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, nullable: false },
    recommendations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, nullable: false },
    sessionFrequency: { type: SchemaType.STRING, nullable: false },
  },
  required: ["highlights", "stalledAreas", "recommendations", "sessionFrequency"],
};

// Learning path schema (Sprint 15)
export const learningPathSchema: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      stage: { type: SchemaType.STRING, nullable: false },
      focus: { type: SchemaType.STRING, nullable: false },
      resourceTypes: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, nullable: false },
      estimatedDuration: { type: SchemaType.STRING, nullable: false },
    },
    required: ["stage", "focus", "resourceTypes", "estimatedDuration"],
  },
};

export async function generateJson<T>(
  systemInstruction: string,
  userPrompt: string,
  schema: Schema
): Promise<T> {
  const model = getModel(schema);
  const result = await model.generateContent({
    systemInstruction,
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
  });
  return JSON.parse(result.response.text()) as T;
}

export async function generateText(
  systemInstruction: string,
  userPrompt: string
): Promise<string> {
  const model = getModel();
  const result = await model.generateContent({
    systemInstruction,
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
  });
  return result.response.text().trim();
}
