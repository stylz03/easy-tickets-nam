/**
 * Event + ticket catalogue (single source of truth).
 *
 * Content is taken from Design 1. Prices are in Namibian Dollars (NAD, "N$").
 * The server ALWAYS recomputes order totals from this file; the client-side
 * totals are for display only.
 *
 * NOTE: these are placeholder events/prices carried over from the design
 * mock-up. Replace with real event data before going live.
 */

export type TierId = "standard" | "premium" | "vip";

export interface TicketTier {
  id: TierId;
  name: string;
  /** Price per ticket in NAD (whole dollars). */
  price: number;
  capacity?: number;
  available?: number;
  perks: string[];
}

export interface EventItem {
  id: number;
  title: string;
  /** Short badge, e.g. "JUL 18" */
  date: string;
  fullDate: string;
  /** Event start, local Namibia time (CAT, UTC+2), sent to DPO as ServiceDate ("YYYY/MM/DD HH:MM"). */
  startsAt: string;
  endsAt?: string;
  /** "From" price shown on the card = Standard tier price (NAD). */
  price: number;
  img: string;
  location: string;
  time: string;
  category: string;
  description: string;
  tiers: TicketTier[];
}

export const CURRENCY_SYMBOL = "N$";
export const MAX_TICKETS_PER_TIER = 10;
export const MAX_TICKETS_PER_ORDER = 20;

/** Tier template from Design 1. Standard = the event's card price. */
function tiersFor(standardPrice: number): TicketTier[] {
  return [
    {
      id: "standard",
      name: "Standard",
      price: standardPrice,
      perks: ["General admission", "Access to main stage"],
    },
    {
      id: "premium",
      name: "Premium",
      price: 350,
      perks: ["Priority entry", "Reserved seating", "1 complimentary drink"],
    },
    {
      id: "vip",
      name: "VIP",
      price: 600,
      perks: ["Fast-track entry", "VIP lounge access", "Open bar", "Meet & greet"],
    },
  ];
}

type BaseEvent = Omit<EventItem, "tiers">;

const baseEvents: BaseEvent[] = [
  {
    id: 1,
    title: "Windhoek Cultural Festival",
    date: "OCT 17",
    fullDate: "October 17, 2026",
    startsAt: "2026/10/17 14:00",
    price: 150,
    img: "/images/design1/evt1.png",
    location: "Independence Stadium, Windhoek",
    time: "14:00 – 22:00",
    category: "Culture",
    description:
      "Namibian music, dance, craft and food come together at Independence Stadium. See the day’s artists, browse local makers and taste dishes from across the country. Suitable for families.",
  },
  {
    id: 2,
    title: "Desert Dune Music Fest",
    date: "NOV 14",
    fullDate: "November 14, 2026",
    startsAt: "2026/11/14 16:00",
    price: 250,
    img: "/images/design1/evt2.png",
    location: "Swakopmund Dunes",
    time: "16:00 – 02:00",
    category: "Music",
    description:
      "Three stages of electronic music in the Swakopmund dunes, with Namibian and visiting DJs, art installations and food vendors. Gates open at 16:00.",
  },
  {
    id: 3,
    title: "Namibian Food & Wine Expo",
    date: "DEC 06",
    fullDate: "December 6, 2026",
    startsAt: "2026/12/06 10:00",
    price: 100,
    img: "/images/design1/evt3.png",
    location: "Zoo Park, Windhoek",
    time: "10:00 – 18:00",
    category: "Food",
    description:
      "Meet Namibian chefs, winemakers and independent producers at Zoo Park. The programme includes tastings, cooking demonstrations and practical workshops.",
  },
  {
    id: 4,
    title: "Etosha Trail Marathon",
    date: "JAN 17",
    fullDate: "January 17, 2027",
    startsAt: "2027/01/17 06:00",
    price: 200,
    img: "/images/design1/evt4.png",
    location: "Etosha National Park",
    time: "06:00 – 14:00",
    category: "Sport",
    description:
      "Choose a 10 km, 21 km or full-marathon trail through Etosha’s landscape. Entry includes the post-race braai, live music and awards.",
  },
  {
    id: 5,
    title: "Coastal Jazz Weekend",
    date: "FEB 13",
    fullDate: "February 13–14, 2027",
    startsAt: "2027/02/13 17:00",
    price: 180,
    img: "/images/design1/evt1.png",
    location: "Walvis Bay Waterfront",
    time: "17:00 – 23:00",
    category: "Music",
    description:
      "Two evenings of jazz, Afro-fusion and soul at the Walvis Bay Waterfront, with Namibian and visiting artists, seafood vendors and sunset sets.",
  },
  {
    id: 6,
    title: "Windhoek Comedy Night",
    date: "FEB 26",
    fullDate: "February 26, 2027",
    startsAt: "2027/02/26 19:00",
    price: 120,
    img: "/images/design1/evt2.png",
    location: "National Theatre, Windhoek",
    time: "19:00 – 22:30",
    category: "Entertainment",
    description:
      "Namibian comedians share the National Theatre stage with two visiting headliners. Doors open at 19:00; bar and food service are available.",
  },
];

export const events: EventItem[] = baseEvents.map((e) => ({
  ...e,
  tiers: tiersFor(e.price),
}));

export function getEvent(id: number): EventItem | undefined {
  return events.find((e) => e.id === id);
}

export function getTier(event: EventItem, tierId: string): TicketTier | undefined {
  return event.tiers.find((t) => t.id === tierId);
}
