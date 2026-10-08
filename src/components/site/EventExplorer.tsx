"use client";
import { useState } from "react";
import type { EventItem } from "@/data/events";
import EventCard from "./EventCard";
import { MapPin, Search } from "lucide-react";

type Point = { latitude: number; longitude: number };
// City centres provide approximate discovery until organisers can provide venue coordinates.
const CITY_CENTRES: Record<string, Point> = {
  windhoek: { latitude: -22.5609, longitude: 17.0658 },
  swakopmund: { latitude: -22.6784, longitude: 14.5266 },
  "walvis bay": { latitude: -22.9576, longitude: 14.5053 },
  etosha: { latitude: -18.8556, longitude: 16.3293 },
  oshakati: { latitude: -17.7883, longitude: 15.7044 },
  rundu: { latitude: -17.9253, longitude: 19.7534 },
  keetmanshoop: { latitude: -26.5833, longitude: 18.1333 },
};
const radians = (degrees: number) => degrees * Math.PI / 180;
function distanceKm(a: Point, b: Point) {
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const value = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}
function eventPoint(event: EventItem): Point | null {
  const location = event.location.toLowerCase();
  const city = Object.keys(CITY_CENTRES).find((name) => location.includes(name));
  return city ? CITY_CENTRES[city] : null;
}

export default function EventExplorer({ events, initialQuery = "", initialCategory = "", initialCity = "" }: {
  events: EventItem[]; initialQuery?: string; initialCategory?: string; initialCity?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [city, setCity] = useState(initialCity);
  const [date, setDate] = useState("");
  const [sort, setSort] = useState("date");
  const [position, setPosition] = useState<Point | null>(null);
  const [nearby, setNearby] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [now] = useState(() => Date.now());
  const categories = [...new Set(events.map((event) => event.category))];

  function findNearby() {
    if (nearby) { setNearby(false); setSort("date"); return; }
    if (position) { setNearby(true); setCity(""); setSort("distance"); return; }
    if (!("geolocation" in navigator)) { setLocationError("Location is unavailable on this device. Use the city filter instead."); return; }
    setLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition({ latitude: coords.latitude, longitude: coords.longitude });
        setCity("");
        setNearby(true);
        setSort("distance");
        setLocating(false);
      },
      () => { setLocationError("Location was not available. You can still browse by city."); setLocating(false); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  const visible = events.map((event) => ({
    event,
    distance: position && eventPoint(event) ? distanceKm(position, eventPoint(event)!) : null,
  })).filter(({ event, distance }) => {
    const start = new Date(event.startsAt.replaceAll("/", "-").replace(" ", "T") + ":00+02:00").getTime();
    return `${event.title} ${event.description} ${event.location}`.toLowerCase().includes(query.toLowerCase())
      && (!category || event.category === category)
      && (!city || event.location.includes(city))
      && (!date || (start >= now && start <= now + 30 * 86400000))
      && (!nearby || (distance !== null && distance <= 150));
  }).sort((a, b) => sort === "distance" && position
    ? (a.distance ?? Infinity) - (b.distance ?? Infinity)
    : sort === "price" ? a.event.price - b.event.price
    : sort === "name" ? a.event.title.localeCompare(b.event.title)
    : a.event.startsAt.localeCompare(b.event.startsAt));

  function reset() {
    setQuery(""); setCategory(""); setCity(""); setDate(""); setSort("date"); setNearby(false); setLocationError("");
  }

  return <>
    <div className="filter-bar">
      <label className="filter-search"><Search size={18} /><input aria-label="Filter events" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search events or venues" type="search" /></label>
      <label className="sr-only" htmlFor="event-category">Category</label>
      <select id="event-category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
      <select aria-label="Filter by city" value={city} onChange={(event) => { setCity(event.target.value); setNearby(false); }}><option value="">All locations</option>{["Windhoek", "Swakopmund", "Walvis Bay", "Etosha"].map((item) => <option key={item}>{item}</option>)}</select>
      <select aria-label="Date range" value={date} onChange={(event) => setDate(event.target.value)}><option value="">All dates</option><option value="month">Next 30 days</option></select>
      <button type="button" className={`nearby-button ${nearby ? "active" : ""}`} onClick={findNearby} disabled={locating} aria-pressed={nearby}><MapPin size={16} />{locating ? "Finding you…" : nearby ? "Near me · on" : "Near me"}</button>
    </div>
    {locationError && <p className="nearby-hint" role="alert">{locationError}</p>}
    {nearby && <p className="nearby-hint">Showing events within about 150 km. Distance is estimated from each event’s city; your location stays on this device.</p>}
    <div className="results-meta"><span>{visible.length} {visible.length === 1 ? "event" : "events"}</span><label>Sort by <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="date">Date</option><option value="price">Price: low to high</option><option value="name">Name</option>{position && <option value="distance">Nearest</option>}</select></label></div>
    {visible.length ? <div className="event-grid">{visible.map(({ event }) => <EventCard key={event.id} event={event} />)}</div> : <div className="empty-state"><Search size={32} /><h2>No events found</h2><p>{nearby ? "There are no listed events within about 150 km right now." : "Try another name, location or date."}</p><button onClick={reset} className="button secondary">Clear filters</button></div>}
  </>;
}
