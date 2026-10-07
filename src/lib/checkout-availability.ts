import "server-only";

export function checkoutEnabled(): boolean {
  return process.env.EASY_TICKETS_CHECKOUT_ENABLED === "true"
    && process.env.EASY_TICKETS_PREVIEW !== "true";
}
