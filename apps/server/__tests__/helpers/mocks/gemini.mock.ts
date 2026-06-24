import { vi } from "vitest";

type MockResponse = {
  response: {
    text: () => string;
  };
};

const defaultMockResponses: Record<string, unknown> = {
  "mentor-matching": [
    { mentorId: "test-mentor-1", score: 95, reason: "Strong expertise match" },
    { mentorId: "test-mentor-2", score: 85, reason: "Good goal alignment" },
  ],
  compatibility: { explanation: "Good match based on shared expertise areas." },
  milestones: [
    { title: "Setup development environment", order: 1, suggestedWeeks: 1 },
    { title: "Complete online course", order: 2, suggestedWeeks: 2 },
    { title: "Build practice project", order: 3, suggestedWeeks: 3 },
  ],
  "learning-path": [
    { stage: "Foundation", focus: "Core concepts", resourceTypes: ["courses"], estimatedDuration: "2 weeks" },
    { stage: "Practice", focus: "Hands-on projects", resourceTypes: ["tutorials"], estimatedDuration: "3 weeks" },
  ],
  insights: {
    highlights: ["Completed 3 sessions this month"],
    stalledAreas: [],
    recommendations: ["Schedule more sessions"],
    sessionFrequency: "Weekly",
  },
  agenda: [
    { item: "Review progress", rationale: "Check on goals", estimatedMinutes: 10 },
    { item: "Deep dive", rationale: "Focus topic", estimatedMinutes: 40 },
  ],
  summary: {
    keyPoints: ["Discussed career goals"],
    decisions: ["Focus on React"],
    actionItems: ["Complete tutorial"],
    followUpQuestions: ["How did the practice go?"],
  },
  resources: [
    { topic: "React", resourceType: "Tutorial", searchQuery: "React tutorial 2024", rationale: "Foundation" },
  ],
};

let mockResponseOverride: unknown = null;

export function mockGeminiResponse(response: unknown): void {
  mockResponseOverride = response;
}

export function resetGeminiMock(): void {
  mockResponseOverride = null;
}

export function createGeminiMock() {
  return {
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockImplementation(({ systemInstruction }: { systemInstruction: string }): MockResponse => {
        let response = mockResponseOverride;

        if (!response) {
          if (systemInstruction.includes("mentor-matching")) {
            response = defaultMockResponses["mentor-matching"];
          } else if (systemInstruction.includes("compatibility")) {
            response = defaultMockResponses.compatibility;
          } else if (systemInstruction.includes("milestone")) {
            response = defaultMockResponses.milestones;
          } else if (systemInstruction.includes("learning path")) {
            response = defaultMockResponses["learning-path"];
          } else if (systemInstruction.includes("progress")) {
            response = defaultMockResponses.insights;
          } else if (systemInstruction.includes("agenda")) {
            response = defaultMockResponses.agenda;
          } else if (systemInstruction.includes("summar")) {
            response = defaultMockResponses.summary;
          } else if (systemInstruction.includes("resource")) {
            response = defaultMockResponses.resources;
          } else {
            response = [];
          }
        }

        return {
          response: {
            text: () => JSON.stringify(response),
          },
        };
      }),
    }),
  };
}

// Note: vi.mock is now in __tests__/helpers/setup.ts
// Use createGeminiMock() if you need custom mock behavior in specific tests
