import { randomUUID } from "node:crypto";
import type { PlaceOrderInput, PlaceOrderResult, SupplierAdapter, SupplierPlan, IssuedEsim } from "./types.js";

const GB = 1024 ** 3;

/**
 * Fake supplier for local development and tests. Prices are illustrative only,
 * loosely based on eSIM Access Guinea quotes seen in Nov 2026.
 */
const PLANS: SupplierPlan[] = [
  plan("GN", "Guinea", "GN-3GB-30D", 3, 30, 1232, [{ operator: "Orange", type: "4G" }]),
  plan("GN", "Guinea", "GN-5GB-30D", 5, 30, 1932, [{ operator: "Orange", type: "4G" }]),
  plan("GN", "Guinea", "GN-10GB-30D", 10, 30, 3864, [{ operator: "Orange", type: "4G" }]),
  plan("SN", "Senegal", "SN-5GB-30D", 5, 30, 1500, [{ operator: "Orange", type: "4G" }]),
  plan("CI", "Côte d'Ivoire", "CI-5GB-30D", 5, 30, 1600, [{ operator: "Orange", type: "4G" }]),
  plan("FR", "France", "FR-5GB-30D", 5, 30, 400, [{ operator: "Orange", type: "5G" }]),
];

function plan(
  countryCode: string,
  countryName: string,
  code: string,
  gb: number,
  days: number,
  wholesaleCents: number,
  networks: SupplierPlan["networks"],
): SupplierPlan {
  return {
    supplier: "mock",
    supplierPlanCode: code,
    countryCode,
    countryName,
    name: `${countryName} ${gb}GB ${days} days`,
    dataBytes: gb * GB,
    validityDays: days,
    wholesaleCents,
    networks,
  };
}

export class MockSupplier implements SupplierAdapter {
  readonly id = "mock" as const;
  private readonly orders = new Map<string, IssuedEsim>();

  constructor(private readonly opts: { issueImmediately?: boolean } = {}) {}

  async listPlans(countryCode?: string): Promise<SupplierPlan[]> {
    return PLANS.filter((p) => !countryCode || p.countryCode === countryCode.toUpperCase());
  }

  async placeOrder({ idempotencyKey }: PlaceOrderInput): Promise<PlaceOrderResult> {
    const ref = `MOCK-${idempotencyKey}`;
    const esim: IssuedEsim = {
      iccid: `8900${Math.floor(Math.random() * 1e15).toString().padStart(15, "0")}`,
      activationCode: `LPA:1$smdp.mock.getcowry.test$${randomUUID().slice(0, 8).toUpperCase()}`,
    };
    this.orders.set(ref, esim);
    return this.opts.issueImmediately === false
      ? { status: "pending", supplierOrderRef: ref }
      : { status: "issued", supplierOrderRef: ref, esim };
  }

  async getOrderEsim(ref: string): Promise<IssuedEsim | null> {
    return this.orders.get(ref) ?? null;
  }
}
