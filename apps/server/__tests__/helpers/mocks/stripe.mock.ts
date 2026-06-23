import { vi } from "vitest";

type MockPaymentIntent = {
  id: string;
  client_secret: string;
  status: "succeeded" | "requires_payment_method" | "requires_confirmation" | "canceled";
  amount: number;
  currency: string;
};

type MockWebhookEvent = {
  id: string;
  type: string;
  data: {
    object: MockPaymentIntent;
  };
};

let mockPaymentIntents: Map<string, MockPaymentIntent> = new Map();
let webhookSignatureValid = true;

export function mockStripePaymentIntent(options: Partial<MockPaymentIntent> = {}): MockPaymentIntent {
  const intent: MockPaymentIntent = {
    id: options.id ?? `pi_test_${Date.now()}`,
    client_secret: options.client_secret ?? `pi_test_${Date.now()}_secret_test`,
    status: options.status ?? "succeeded",
    amount: options.amount ?? 10000,
    currency: options.currency ?? "usd",
  };
  mockPaymentIntents.set(intent.id, intent);
  return intent;
}

export function setWebhookSignatureValid(valid: boolean): void {
  webhookSignatureValid = valid;
}

export function resetStripeMock(): void {
  mockPaymentIntents.clear();
  webhookSignatureValid = true;
}

export function createWebhookEvent(type: string, paymentIntent: MockPaymentIntent): MockWebhookEvent {
  return {
    id: `evt_test_${Date.now()}`,
    type,
    data: {
      object: paymentIntent,
    },
  };
}

export function createStripeMock() {
  return {
    paymentIntents: {
      create: vi.fn().mockImplementation(async ({ amount, currency }: { amount: number; currency: string }) => {
        return mockStripePaymentIntent({ amount, currency });
      }),
      retrieve: vi.fn().mockImplementation(async (id: string) => {
        const intent = mockPaymentIntents.get(id);
        if (!intent) throw new Error(`PaymentIntent ${id} not found`);
        return intent;
      }),
      cancel: vi.fn().mockImplementation(async (id: string) => {
        const intent = mockPaymentIntents.get(id);
        if (!intent) throw new Error(`PaymentIntent ${id} not found`);
        intent.status = "canceled";
        return intent;
      }),
    },
    refunds: {
      create: vi.fn().mockImplementation(async ({ payment_intent }: { payment_intent: string }) => {
        return {
          id: `re_test_${Date.now()}`,
          payment_intent,
          status: "succeeded",
        };
      }),
    },
    webhooks: {
      constructEvent: vi.fn().mockImplementation((_payload: unknown, _signature: unknown, _secret: unknown) => {
        if (!webhookSignatureValid) {
          throw new Error("Webhook signature verification failed");
        }
        const intent = Array.from(mockPaymentIntents.values())[0];
        if (!intent) {
          return createWebhookEvent("payment_intent.succeeded", mockStripePaymentIntent());
        }
        return createWebhookEvent("payment_intent.succeeded", intent);
      }),
    },
  };
}

export function setupStripeMock(): void {
  vi.mock("stripe", () => ({
    default: vi.fn().mockImplementation(() => createStripeMock()),
  }));
}
