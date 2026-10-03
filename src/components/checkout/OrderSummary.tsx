import { Calendar, Clock, MapPin } from "lucide-react";
import { CURRENCY_SYMBOL, getEvent, getTier, type TierId } from "@/data/events";

export function formatMoney(cents: number) {
  const v = cents / 100;
  return `${CURRENCY_SYMBOL}${Number.isInteger(v) ? v : v.toFixed(2)}`;
}

/** Ticket line items + total, Design 1 "summary" box style. */
export default function OrderSummary({
  eventId,
  items,
  amountCents,
}: {
  eventId: number;
  items: [TierId, number][];
  amountCents: number;
}) {
  const event = getEvent(eventId);
  if (!event) return null;
  return (
    <div className="space-y-5">
      <div className="flex gap-4 items-center">
        <img src={event.img} alt={event.title} className="w-20 h-20 rounded-xl object-cover border border-slate-100 shrink-0" />
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 text-lg leading-tight">{event.title}</h3>
          <div className="mt-2 space-y-1 text-sm text-slate-500">
            <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />{event.fullDate}</div>
            <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />{event.time}</div>
            <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />{event.location}</div>
          </div>
        </div>
      </div>
      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
        {items.map(([tierId, qty]) => {
          const tier = getTier(event, tierId);
          if (!tier) return null;
          return (
            <div key={tierId} className="flex justify-between text-sm text-slate-500">
              <span>{qty} × {tier.name} <span className="text-slate-400">@ {CURRENCY_SYMBOL}{tier.price}</span></span>
              <span className="text-slate-700 font-medium">{CURRENCY_SYMBOL}{tier.price * qty}</span>
            </div>
          );
        })}
        <div className="h-px bg-slate-200" />
        <div className="flex justify-between items-center">
          <span className="font-semibold text-slate-700">Total</span>
          <span className="text-xl font-extrabold text-slate-900">{formatMoney(amountCents)}</span>
        </div>
      </div>
    </div>
  );
}
