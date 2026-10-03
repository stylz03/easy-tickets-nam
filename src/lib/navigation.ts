export function safeNext(value:unknown, fallback="/account/tickets") {
  return typeof value === "string" && /^\/(?!\/)/.test(value) && !/[\\\u0000-\u001f]/.test(value) ? value : fallback;
}
