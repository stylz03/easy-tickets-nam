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
  perks: string[];
}

export interface EventItem {
  id: number;
  title: string;
  /** Short badge, e.g. "JUL 18" */
  date: string;
  fullDate: string;
  /** Event start, local Namibia time, used for DPO ServiceDate (YYYY/MM/DD HH:MM). */
  startsAt: string;
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
    date: "JUL 18",
    fullDate: "July 18, 2026",
    startsAt: "2026/07/18 14:00",
    price: 150,
    img: "/images/design1/evt1.png",
    location: "Independence Stadium, Windhoek",
    time: "14:00 – 22:00",
    category: "Culture",
    description:
      "Immerse yourself in an unforgettable celebration of Namibian heritage. Featuring live performances from over 30 local artists, traditional dance showcases, artisan craft markets, and a culinary journey through the flavours of every region. Perfect for families, culture enthusiasts, and anyone looking to experience the heart of Namibia.",
  },
  {
    id: 2,
    title: "Desert Dune Music Fest",
    date: "JUL 25",
    fullDate: "July 25, 2026",
    startsAt: "2026/07/25 16:00",
    price: 250,
    img: "/images/design1/evt2.png",
    location: "Swakopmund Dunes",
    time: "16:00 – 02:00",
    category: "Music",
    description:
      "Dance under the stars at Namibia's most iconic electronic music festival set against the breathtaking desert dunes. Three stages, 20+ DJs, immersive art installations, and gourmet food trucks make this a once-in-a-lifetime experience for music lovers.",
  },
  {
    id: 3,
    title: "Namibian Food & Wine Expo",
    date: "AUG 02",
    fullDate: "August 2, 2026",
    startsAt: "2026/08/02 10:00",
    price: 100,
    img: "/images/design1/evt3.png",
    location: "Zoo Park, Windhoek",
    time: "10:00 – 18:00",
    category: "Food",
    description:
      "A gastronomic adventure showcasing the finest Namibian cuisine and boutique wines. Enjoy live cooking demonstrations from award-winning chefs, wine tastings from local vineyards, artisan cheese and charcuterie stalls, and hands-on cooking workshops.",
  },
  {
    id: 4,
    title: "Etosha Trail Marathon",
    date: "AUG 10",
    fullDate: "August 10, 2026",
    startsAt: "2026/08/10 06:00",
    price: 200,
    img: "/images/design1/evt4.png",
    location: "Etosha National Park",
    time: "06:00 – 14:00",
    category: "Sport",
    description:
      "Run through the wild heart of Africa on this unique trail marathon winding through Etosha's iconic landscapes. Choose from 10K, 21K, or full marathon distances. Post-race celebrations include a braai, live music, and awards ceremony.",
  },
  {
    id: 5,
    title: "Coastal Jazz Weekend",
    date: "AUG 22",
    fullDate: "August 22–23, 2026",
    startsAt: "2026/08/22 17:00",
    price: 180,
    img: "/images/design1/evt1.png",
    location: "Walvis Bay Waterfront",
    time: "17:00 – 23:00",
    category: "Music",
    description:
      "Enjoy world-class jazz performances right on the Walvis Bay waterfront. Over two magical evenings, experience smooth jazz, Afro-fusion, and soul from both Namibian and international artists while savouring seafood and sunset cocktails.",
  },
  {
    id: 6,
    title: "Windhoek Comedy Night",
    date: "SEP 05",
    fullDate: "September 5, 2026",
    startsAt: "2026/09/05 19:00",
    price: 120,
    img: "/images/design1/evt2.png",
    location: "National Theatre, Windhoek",
    time: "19:00 – 22:30",
    category: "Entertainment",
    description:
      "Get ready for a night of non-stop laughter featuring Namibia's sharpest comedians and two international headliners. With a full bar, delicious finger food, and a late-night after-party, this is the ultimate comedy experience.",
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
