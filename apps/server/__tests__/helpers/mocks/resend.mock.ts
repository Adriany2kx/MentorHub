import { vi } from "vitest";

type MockEmail = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

let sentEmails: MockEmail[] = [];
let shouldFail = false;

export function mockResendFailure(fail: boolean): void {
  shouldFail = fail;
}

export function getSentEmails(): MockEmail[] {
  return sentEmails;
}

export function getLastEmail(): MockEmail | undefined {
  return sentEmails[sentEmails.length - 1];
}

export function resetResendMock(): void {
  sentEmails = [];
  shouldFail = false;
}

export function createResendMock() {
  return {
    emails: {
      send: vi.fn().mockImplementation(async (email: MockEmail) => {
        if (shouldFail) {
          throw new Error("Email service unavailable");
        }
        sentEmails.push(email);
        return { id: `email_${Date.now()}` };
      }),
    },
  };
}

export function setupResendMock(): void {
  vi.mock("resend", () => ({
    Resend: vi.fn().mockImplementation(() => createResendMock()),
  }));
}
