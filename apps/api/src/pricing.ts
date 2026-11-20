import type { SupplierPlan } from "./suppliers/types.js";

export interface PricingRule {
  /** Minimum profit per sale before card fees, in US cents. */
  minProfitCents: number;
  /** Minimum multiple of wholesale cost, e.g. 1.4 = 40% markup. */
  minMarkup: number;
}

/** Stripe US card fee: 2.9% + 30¢. */
export function cardFeeCents(retailCents: number): number {
  return Math.round(retailCents * 0.029) + 30;
}

/**
 * Retail price = the higher of (wholesale + min profit) and (wholesale × min markup),
 * rounded up to the next .99 (e.g. 2381¢ → $23.99).
 */
export function retailPriceCents(wholesaleCents: number, rule: PricingRule): number {
  const raw = Math.max(wholesaleCents + rule.minProfitCents, Math.ceil(wholesaleCents * rule.minMarkup));
  const dollars = Math.ceil((raw + 1) / 100);
  return dollars * 100 - 1;
}

export interface PricedPlan extends SupplierPlan {
  retailCents: number;
  /** What Cowry keeps after wholesale and card fees, in cents. */
  netProfitCents: number;
}

/**
 * Price a plan. Where the supplier recommends a selling price (Airalo), sell at exactly that:
 * the partner agreement asks resellers not to go below it, and going above it makes us
 * dearer than the supplier's own app. Otherwise use our markup rule.
 */
export function pricePlan(plan: SupplierPlan, rule: PricingRule): PricedPlan {
  const retailCents = plan.recommendedRetailCents ?? retailPriceCents(plan.wholesaleCents, rule);
  const netProfitCents = retailCents - plan.wholesaleCents - cardFeeCents(retailCents);
  return { ...plan, retailCents, netProfitCents };
}
