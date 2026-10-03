"use client";
import { useState } from "react";
import type { EventItem } from "@/data/events";
import EventCard from "./EventCard";
import { Search } from "lucide-react";
export default function EventExplorer({ events, initialQuery = "", initialCategory = "", initialCity = "" }: { events: EventItem[]; initialQuery?: string; initialCategory?: string; initialCity?: string }) {
  const [query, setQuery] = useState(initialQuery); const [category, setCategory] = useState(initialCategory); const [city, setCity] = useState(initialCity); const [date, setDate] = useState(""); const [sort, setSort] = useState("date");
  const [now] = useState(() => Date.now()); const categories = [...new Set(events.map(e => e.category))];
  const visible = events.filter(e => {
    const start = new Date(e.startsAt.replaceAll("/", "-").replace(" ", "T") + ":00+02:00").getTime();
    return `${e.title} ${e.description} ${e.location}`.toLowerCase().includes(query.toLowerCase()) && (!category || e.category === category) && (!city || e.location.includes(city)) && (!date || (start >= now && start <= now + 30 * 86400000));
  }).sort((a,b) => sort === "price" ? a.price-b.price : sort === "name" ? a.title.localeCompare(b.title) : a.startsAt.localeCompare(b.startsAt));
  function reset() { setQuery(""); setCategory(""); setCity(""); setDate(""); setSort("date"); }
  return <><div className="filter-bar"><label className="filter-search"><Search size={18} /><input aria-label="Filter events" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search events or venues" type="search" /></label><label className="sr-only" htmlFor="event-category">Category</label><select id="event-category" value={category} onChange={e => setCategory(e.target.value)}><option value="">All categories</option>{categories.map(c => <option key={c}>{c}</option>)}</select><select aria-label="Filter by city" value={city} onChange={e => setCity(e.target.value)}><option value="">All locations</option>{["Windhoek","Swakopmund","Walvis Bay","Etosha"].map(c => <option key={c}>{c}</option>)}</select><select aria-label="Date range" value={date} onChange={e => setDate(e.target.value)}><option value="">All dates</option><option value="month">Next 30 days</option></select></div><div className="results-meta"><span>{visible.length} {visible.length === 1 ? "event" : "events"}</span><label>Sort by <select value={sort} onChange={e => setSort(e.target.value)}><option value="date">Date</option><option value="price">Price: low to high</option><option value="name">Name</option></select></label></div>{visible.length ? <div className="event-grid">{visible.map(e => <EventCard key={e.id} event={e} />)}</div> : <div className="empty-state"><Search size={32} /><h2>No events found</h2><p>Try another name, location or date.</p><button onClick={reset} className="button secondary">Clear filters</button></div>}</>;
}
