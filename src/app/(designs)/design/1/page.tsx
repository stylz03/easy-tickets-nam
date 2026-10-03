"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Logo from "@/components/Logo";
import { events } from "@/data/events";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "framer-motion";
import {
  X,
  Calendar,
  MapPin,
  Clock,
  Search,
  Star,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Ticket,
  CreditCard,
  CheckCircle2,
  Minus,
  Plus,
  Mail,
  Globe,
  Hash,
  Share2,
  Send,
  Sparkles,
  Users,
  Shield,
  Music,
  Utensils,
  Trophy,
  PartyPopper,
  Lock,
  Phone,
  Loader2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

const testimonials = [
  {
    name: "Lungameni Shikongo",
    role: "Festival-goer",
    avatar: "/images/design1/evt3.png",
    text: "Easy Tickets made booking for the Windhoek Cultural Festival so effortless. I had my tickets within seconds and the digital pass worked perfectly at the gate!",
    stars: 5,
  },
  {
    name: "Maria van der Merwe",
    role: "Event organiser",
    avatar: "/images/design1/evt4.png",
    text: "As an event organiser, the platform gives me complete visibility into ticket sales and attendee analytics. It's transformed how we run events in Namibia.",
    stars: 5,
  },
  {
    name: "Jonas Amadhila",
    role: "Music enthusiast",
    avatar: "/images/design1/evt1.png",
    text: "The VIP experience at the Desert Dune Fest was incredible. The booking process was smooth, and the digital ticket with QR code made entry a breeze.",
    stars: 4,
  },
];

const marqueeImages = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  src: `/images/design1/evt${(i % 4) + 1}.png`,
}));

const categoryIcons: Record<string, React.ReactNode> = {
  Culture: <Sparkles className="w-4 h-4" />,
  Music: <Music className="w-4 h-4" />,
  Food: <Utensils className="w-4 h-4" />,
  Sport: <Trophy className="w-4 h-4" />,
  Entertainment: <PartyPopper className="w-4 h-4" />,
};

/* ------------------------------------------------------------------ */
/*  MAIN COMPONENT                                                     */
/* ------------------------------------------------------------------ */

export default function Design1() {
  /* STATE */
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState(0);
  const [quantities, setQuantities] = useState([1, 0, 0]);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [navScrolled, setNavScrolled] = useState(false);

  /* REFS */
  const containerRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);

  /* SCROLL PROGRESS */
  const { scrollYProgress } = useScroll();
  const bgColor = useTransform(
    scrollYProgress,
    [0, 0.15, 0.3, 0.5, 0.7, 0.85, 1],
    [
      "rgb(255,255,255)",
      "rgb(240,249,255)",
      "rgb(255,255,255)",
      "rgb(248,250,252)",
      "rgb(255,255,255)",
      "rgb(239,246,255)",
      "rgb(248,250,252)",
    ]
  );

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setNavScrolled(latest > 0.02);
  });

  /* HELPERS */
  const openBooking = useCallback((id: number) => {
    setSelectedEvent(id);
    setBookingStep(1);
    setSelectedTier(0);
    setQuantities([1, 0, 0]);
    setSubmitting(false);
    setCheckoutError(null);
  }, []);

  const closeBooking = useCallback(() => {
    if (submitting) return;
    setSelectedEvent(null);
    setBookingStep(1);
  }, [submitting]);

  const updateQty = (tierIdx: number, delta: number) => {
    setQuantities((prev) => {
      const next = [...prev];
      next[tierIdx] = Math.max(0, Math.min(10, next[tierIdx] + delta));
      return next;
    });
  };

  /* CURRENT EVENT */
  const currentEvent = events.find((e) => e.id === selectedEvent);
  const tiers = currentEvent?.tiers ?? events[0].tiers;

  const totalAmount = quantities.reduce(
    (sum, q, i) => sum + q * tiers[i].price,
    0
  );
  const totalTickets = quantities.reduce((a, b) => a + b, 0);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(buyerEmail.trim());
  const phoneValid = buyerPhone.replace(/\D/g, "").length >= 7;
  const buyerValid = buyerName.trim().length >= 2 && emailValid && phoneValid;

  /* DEEP LINK: /design/1?book=<eventId> opens the booking panel (used by "Try again") */
  useEffect(() => {
    const id = Number(new URLSearchParams(window.location.search).get("book"));
    if (!id || !events.some((e) => e.id === id)) return;
    const raf = requestAnimationFrame(() => openBooking(id));
    return () => cancelAnimationFrame(raf);
  }, [openBooking]);

  /* CHECKOUT: server prices the order and creates a DPO Pay token */
  const startCheckout = async () => {
    if (!currentEvent || submitting || !buyerValid || totalAmount === 0) return;
    setSubmitting(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: currentEvent.id,
          items: tiers.map((t, i) => ({ tier: t.id, qty: quantities[i] })),
          name: buyerName,
          email: buyerEmail,
          phone: buyerPhone,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Could not start payment. Please try again.");
      }
      window.location.assign(data.url);
    } catch (err) {
      setCheckoutError((err as Error).message);
      setSubmitting(false);
    }
  };

  /* MARQUEE auto-scroll */
  useEffect(() => {
    const el = marqueeRef.current;
    if (!el) return;
    let animId: number;
    let pos = 0;
    const speed = 0.5;
    const animate = () => {
      pos += speed;
      if (pos >= el.scrollWidth / 2) pos = 0;
      el.scrollLeft = pos;
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  /* SMOOTH SCROLL */
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  /* ---------------------------------------------------------------- */
  /*  RENDER                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <motion.div
      ref={containerRef}
      style={{ backgroundColor: bgColor }}
      className="min-h-screen flex flex-col font-sans text-slate-900 overflow-x-hidden relative"
    >
      {/* ============================================================ */}
      {/*  NAVIGATION                                                   */}
      {/* ============================================================ */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          navScrolled
            ? "bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-100"
            : "bg-transparent"
        }`}
      >
        <div className="flex items-center justify-between px-6 lg:px-8 py-4 max-w-7xl mx-auto w-full">
          <button onClick={() => scrollTo("hero")} className="flex items-center gap-3">
            <Logo dark={false} size="lg" />
          </button>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-600 items-center">
            <button
              onClick={() => scrollTo("hero")}
              className="hover:text-blue-600 transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => scrollTo("events")}
              className="hover:text-blue-600 transition-colors"
            >
              Events
            </button>
            <button
              onClick={() => scrollTo("how-it-works")}
              className="hover:text-blue-600 transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollTo("contact")}
              className="hover:text-blue-600 transition-colors"
            >
              Contact
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollTo("events")}
              className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-6 py-2.5 rounded-full shadow-md shadow-blue-200 font-semibold"
            >
              Get Tickets
            </motion.button>
          </nav>
        </div>
      </motion.header>

      {/* ============================================================ */}
      {/*  §1 — HERO                                                    */}
      {/* ============================================================ */}
      <section
        id="hero"
        className="relative min-h-screen flex items-center overflow-hidden bg-white"
      >
        {/* Full screen background image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/design1/hero.png" 
            alt="Festival Background" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-sky-50/70 to-rose-50/90" />
        </div>
        {/* Decorative blobs */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-sky-100/50 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], x: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-rose-100/50 blur-3xl"
        />

        <div className="max-w-7xl mx-auto w-full px-6 lg:px-8 pt-32 pb-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left – Copy */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-2 rounded-full mb-6 border border-blue-100"
              >
                <Sparkles className="w-4 h-4" />
                Namibia&apos;s #1 Event Platform
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-[1.08] tracking-tight mb-6"
              >
                EASY
                <br />
                TICKETS
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
                  NAMIBIA
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-lg sm:text-xl text-slate-500 mb-10 max-w-lg leading-relaxed"
              >
                Discover the best events, concerts, and cultural experiences across Namibia. Book your tickets effortlessly and securely — in just a few taps.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="flex flex-wrap gap-4"
              >
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow:
                      "0 20px 40px -8px rgba(37,99,235,0.25)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => scrollTo("events")}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-4 rounded-2xl shadow-xl shadow-blue-200 transition-all font-semibold flex items-center gap-2"
                >
                  Browse Events
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => scrollTo("how-it-works")}
                  className="bg-white hover:bg-slate-50 text-slate-700 text-lg px-8 py-4 rounded-2xl shadow-sm border border-slate-200 transition-all font-semibold"
                >
                  Learn More
                </motion.button>
              </motion.div>

              {/* Social proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="mt-12 flex items-center gap-4"
              >
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <img
                      key={i}
                      src={`/images/design1/evt${(i % 4) + 1}.png`}
                      alt=""
                      className="w-10 h-10 rounded-full border-2 border-white object-cover"
                    />
                  ))}
                </div>
                <div className="text-sm text-slate-500">
                  <span className="font-bold text-slate-800">2,500+</span> tickets sold this month
                </div>
              </motion.div>
            </div>

            {/* Right – Floating ticket decorations */}
            <div className="relative hidden lg:block h-[520px]">
              {/* Main ticket card */}
              <motion.div
                initial={{ opacity: 0, x: 60, rotate: 6 }}
                animate={{ opacity: 1, x: 0, rotate: 6 }}
                transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
                className="absolute right-4 top-8 w-80 h-[420px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
              >
                <div className="h-48 bg-gradient-to-br from-blue-100 to-sky-50 relative overflow-hidden">
                  <img
                    src="/images/design1/hero.png"
                    alt=""
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent" />
                </div>
                <div className="p-6">
                  <div className="w-3/4 h-3 bg-slate-200 rounded mb-3" />
                  <div className="w-1/2 h-3 bg-slate-100 rounded mb-6" />
                  <div className="flex gap-3">
                    <div className="w-16 h-8 bg-blue-100 rounded-lg" />
                    <div className="w-16 h-8 bg-rose-100 rounded-lg" />
                    <div className="w-16 h-8 bg-amber-100 rounded-lg" />
                  </div>
                  <div className="mt-6 h-10 bg-slate-800 rounded-xl" />
                </div>
              </motion.div>

              {/* Floating mini-ticket */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: [0, -12, 0],
                  rotate: [-12, -10, -12],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute left-0 top-16 w-52 h-24 bg-white rounded-xl shadow-xl border border-slate-100 flex items-center p-3 gap-3 z-20"
              >
                <div className="w-1/3 h-full border-r-2 border-dashed border-slate-200 flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-blue-500 -rotate-90" />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="w-full h-2 bg-slate-200 rounded" />
                  <div className="w-2/3 h-2 bg-slate-100 rounded" />
                  <div className="mt-2 w-full h-3 bg-slate-800 rounded" />
                </div>
              </motion.div>

              {/* Notification badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: [0, 8, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute left-12 bottom-12 bg-white px-5 py-3 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3 z-20"
              >
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">
                    Booking confirmed!
                  </div>
                  <div className="text-xs text-slate-400">Just now</div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-slate-300 flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-slate-400"
            />
          </div>
        </motion.div>
      </section>

      {/* ============================================================ */}
      {/*  §2 — FEATURED EVENTS                                        */}
      {/* ============================================================ */}
      <section id="events" className="py-24 lg:py-32 relative">
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-8">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-3 block">
              Upcoming Events
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4">
              Featured Events
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              From festivals to marathons — find your next unforgettable experience in Namibia.
            </p>
          </motion.div>

          {/* 3×2 Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition-shadow duration-300 group cursor-pointer overflow-hidden"
                onClick={() => openBooking(event.id)}
              >
                {/* Image */}
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={event.img}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    {event.date}
                  </div>
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-blue-600 shadow-sm flex items-center gap-1">
                    {categoryIcons[event.category]}
                    {event.category}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-800 mb-1.5 group-hover:text-blue-600 transition-colors">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-sm text-slate-400 mb-3">
                    <MapPin className="w-3.5 h-3.5" />
                    {event.location}
                  </div>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                    {event.description}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <span className="text-lg font-bold text-blue-600">
                      N${event.price}
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      className="text-sm text-blue-600 font-semibold px-4 py-2 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-1"
                    >
                      Book Now
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  §3 — HOW IT WORKS                                           */}
      {/* ============================================================ */}
      <section
        id="how-it-works"
        className="py-24 lg:py-32 relative"
        style={{
          background:
            "linear-gradient(180deg, #f8fafc 0%, #ffffff 50%, #f8fafc 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-3 block">
              Simple & Fast
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Get your tickets in three easy steps — no queues, no hassle.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-24 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200" />

            {[
              {
                icon: <Search className="w-8 h-8 text-blue-600" />,
                title: "Browse",
                desc: "Explore events happening across Namibia. Filter by category, date, or location to find your perfect experience.",
                gradient: "from-blue-50 to-sky-50",
                ring: "ring-blue-100",
              },
              {
                icon: <Ticket className="w-8 h-8 text-blue-600" />,
                title: "Book",
                desc: "Select your preferred tier — Standard, Premium, or VIP. Choose your quantity and check out securely in seconds.",
                gradient: "from-sky-50 to-indigo-50",
                ring: "ring-sky-100",
              },
              {
                icon: <PartyPopper className="w-8 h-8 text-blue-600" />,
                title: "Enjoy",
                desc: "Receive your digital ticket instantly with a unique QR code. Just scan & enter — it's that easy!",
                gradient: "from-indigo-50 to-violet-50",
                ring: "ring-indigo-100",
              },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative text-center"
              >
                <motion.div
                  whileHover={{ scale: 1.08, rotate: [0, -3, 3, 0] }}
                  transition={{ duration: 0.4 }}
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.gradient} ring-4 ${step.ring} flex items-center justify-center mx-auto mb-6 shadow-sm relative z-10`}
                >
                  {step.icon}
                </motion.div>
                <div className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">
                  Step {i + 1}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-500 leading-relaxed max-w-xs mx-auto">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  §4 — TRENDING / MARQUEE                                     */}
      {/* ============================================================ */}
      <section className="py-20 lg:py-28 overflow-hidden relative">
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-3 block">
              Popular Right Now
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4">
              Trending Events
            </h2>
          </motion.div>
        </div>

        {/* Marquee */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          <div
            ref={marqueeRef}
            className="flex gap-6 overflow-hidden"
            style={{ scrollBehavior: "auto" }}
          >
            {/* Duplicate images for infinite scroll */}
            {[...marqueeImages, ...marqueeImages].map((img, i) => (
              <motion.div
                key={`${img.id}-${i}`}
                whileHover={{ scale: 1.03, y: -4 }}
                className="flex-shrink-0 w-72 h-44 rounded-2xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer"
              >
                <img
                  src={img.src}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  §5 — TESTIMONIALS                                           */}
      {/* ============================================================ */}
      <section
        className="py-24 lg:py-32 relative"
        style={{
          background:
            "linear-gradient(180deg, #f8fafc 0%, #f0f9ff 50%, #ffffff 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-3 block">
              Testimonials
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4">
              What People Say
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Don&apos;t just take our word for it — hear from our community.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      className={`w-5 h-5 ${
                        s < t.stars
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-slate-600 leading-relaxed mb-6 italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-slate-100"
                  />
                  <div>
                    <div className="font-bold text-slate-800 text-sm">
                      {t.name}
                    </div>
                    <div className="text-xs text-slate-400">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  §6 — NEWSLETTER / CTA                                       */}
      {/* ============================================================ */}
      <section id="contact" className="py-24 lg:py-32 relative">
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-12 lg:p-20 text-center shadow-2xl"
          >
            {/* Decorative circles */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.02]" />

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8"
              >
                <Mail className="w-8 h-8 text-white" />
              </motion.div>
              <h2 className="text-3xl lg:text-5xl font-extrabold text-white mb-4">
                Never Miss an Event
              </h2>
              <p className="text-blue-100 text-lg max-w-xl mx-auto mb-10">
                Subscribe to get early access to tickets, exclusive discounts, and the latest event announcements in Namibia.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-5 py-4 rounded-xl bg-white/10 backdrop-blur text-white placeholder-blue-200 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 text-base"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-blue-700 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
                >
                  Subscribe
                </motion.button>
              </div>
              <p className="text-blue-200/60 text-xs mt-4">
                No spam, ever. Unsubscribe at any time.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  §7 — FOOTER                                                 */}
      {/* ============================================================ */}
      <footer className="bg-slate-900 text-slate-300 pt-20 pb-8">
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 pb-12 border-b border-slate-800">
            {/* Brand */}
            <div>
              <Logo dark size="lg" />
              <p className="text-slate-400 mt-4 text-sm leading-relaxed">
                Namibia&apos;s premier event ticketing platform. Making live experiences accessible to everyone.
              </p>
              <div className="flex gap-3 mt-6">
                {[Globe, Hash, Share2, Send].map((Icon, i) => (
                  <motion.a
                    key={i}
                    href="#"
                    whileHover={{ scale: 1.15, y: -2 }}
                    className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-blue-600 flex items-center justify-center transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              {
                heading: "Explore",
                links: ["All Events", "Trending", "Categories", "Calendar"],
              },
              {
                heading: "Company",
                links: ["About Us", "Careers", "Press", "Blog"],
              },
              {
                heading: "Support",
                links: ["Help Centre", "FAQs", "Contact Us", "Terms & Privacy"],
              },
            ].map((col) => (
              <div key={col.heading}>
                <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
                  {col.heading}
                </h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-slate-400 hover:text-white transition-colors text-sm"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              &copy; {new Date().getFullYear()} Easy Tickets Namibia. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ============================================================ */}
      {/*  BOOKING SIDE PANEL                                           */}
      {/* ============================================================ */}
      <AnimatePresence>
        {selectedEvent && currentEvent && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeBooking}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.45 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[520px] bg-white z-[60] shadow-2xl flex flex-col"
            >
              {/* Progress bar */}
              <div className="h-1 bg-slate-100 shrink-0">
                <motion.div
                  className="h-full bg-blue-600"
                  initial={{ width: "33%" }}
                  animate={{ width: `${(bookingStep / 3) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Close button */}
              <button
                onClick={closeBooking}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>

              {/* Step indicator */}
              <div className="px-8 pt-6 pb-4 shrink-0">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  {["Details", "Tickets", "Your Info"].map(
                    (label, i) => (
                      <React.Fragment key={label}>
                        <span
                          className={`${
                            bookingStep >= i + 1
                              ? "text-blue-600 font-semibold"
                              : ""
                          }`}
                        >
                          {label}
                        </span>
                        {i < 2 && (
                          <ChevronRight className="w-3 h-3 text-slate-300" />
                        )}
                      </React.Fragment>
                    )
                  )}
                </div>
              </div>

              {/* PANEL CONTENT */}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {/* ========= STEP 1: EVENT DETAILS ========= */}
                  {bookingStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25 }}
                    >
                      {/* Hero image */}
                      <div className="relative h-56">
                        <img
                          src={currentEvent.img}
                          alt={currentEvent.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute bottom-4 left-6">
                          <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                            {currentEvent.category}
                          </span>
                        </div>
                      </div>

                      <div className="p-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                          {currentEvent.title}
                        </h2>

                        <div className="space-y-3 mb-6 mt-4">
                          <div className="flex items-center gap-3 text-slate-600 text-sm">
                            <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                            <span>{currentEvent.fullDate}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-600 text-sm">
                            <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                            <span>{currentEvent.time}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-600 text-sm">
                            <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                            <span>{currentEvent.location}</span>
                          </div>
                        </div>

                        <div className="h-px bg-slate-100 my-6" />

                        <h3 className="text-base font-bold text-slate-900 mb-3">
                          About This Event
                        </h3>
                        <p className="text-slate-500 text-sm leading-relaxed mb-6">
                          {currentEvent.description}
                        </p>

                        <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
                          <Users className="w-5 h-5 text-blue-500" />
                          <span className="text-sm text-blue-700 font-medium">
                            327 people have booked this event
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ========= STEP 2: TICKET SELECTION ========= */}
                  {bookingStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25 }}
                      className="p-8"
                    >
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        Select Your Tickets
                      </h2>
                      <p className="text-slate-500 text-sm mb-8">
                        Choose your preferred tier and quantity.
                      </p>

                      <div className="space-y-4">
                        {tiers.map((tier, i) => (
                          <motion.div
                            key={tier.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            onClick={() => setSelectedTier(i)}
                            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                              selectedTier === i
                                ? "border-blue-500 bg-blue-50/50 shadow-sm"
                                : "border-slate-100 bg-white hover:border-slate-200"
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-slate-900">
                                    {tier.name}
                                  </h3>
                                  {tier.name === "VIP" && (
                                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                      Best Value
                                    </span>
                                  )}
                                </div>
                                <div className="text-2xl font-bold text-blue-600 mt-1">
                                  N${tier.price}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateQty(i, -1);
                                  }}
                                  className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-8 text-center font-bold text-slate-800">
                                  {quantities[i]}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateQty(i, 1);
                                  }}
                                  className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <ul className="space-y-1.5">
                              {tier.perks.map((perk) => (
                                <li
                                  key={perk}
                                  className="flex items-center gap-2 text-sm text-slate-500"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  {perk}
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        ))}
                      </div>

                      {/* Total */}
                      <div className="mt-8 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">
                            Total
                          </span>
                          <span className="text-3xl font-extrabold text-slate-900">
                            N${totalAmount}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {totalTickets} ticket(s) selected
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ========= STEP 3: BUYER DETAILS ========= */}
                  {bookingStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25 }}
                      className="p-8"
                    >
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        Your Details
                      </h2>
                      <p className="text-slate-500 text-sm mb-8">
                        We&apos;ll send your tickets to this email. You&apos;ll pay securely on the DPO Pay page.
                      </p>

                      <form
                        id="checkout-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          startCheckout();
                        }}
                        className="space-y-4"
                      >
                        <div>
                          <label htmlFor="buyer-name" className="text-sm font-semibold text-slate-700 mb-1.5 block">
                            Full Name
                          </label>
                          <input
                            id="buyer-name"
                            type="text"
                            autoComplete="name"
                            required
                            minLength={2}
                            maxLength={100}
                            value={buyerName}
                            onChange={(e) => setBuyerName(e.target.value)}
                            placeholder="Lungameni Shikongo"
                            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                          />
                        </div>
                        <div>
                          <label htmlFor="buyer-email" className="text-sm font-semibold text-slate-700 mb-1.5 block">
                            Email Address
                          </label>
                          <div className="relative">
                            <input
                              id="buyer-email"
                              type="email"
                              autoComplete="email"
                              required
                              maxLength={254}
                              value={buyerEmail}
                              onChange={(e) => setBuyerEmail(e.target.value)}
                              placeholder="you@example.com"
                              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                            />
                            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="buyer-phone" className="text-sm font-semibold text-slate-700 mb-1.5 block">
                            Phone Number
                          </label>
                          <div className="relative">
                            <input
                              id="buyer-phone"
                              type="tel"
                              autoComplete="tel"
                              required
                              maxLength={20}
                              value={buyerPhone}
                              onChange={(e) => setBuyerPhone(e.target.value.replace(/[^\d+\s()-]/g, ""))}
                              placeholder="+264 81 123 4567"
                              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                            />
                            <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                          </div>
                        </div>
                      </form>

                      {/* Summary */}
                      <div className="mt-8 p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <div className="flex justify-between text-sm text-slate-500">
                          <span>{currentEvent.title}</span>
                          <span>{totalTickets} ticket(s)</span>
                        </div>
                        {tiers.map((tier, i) =>
                          quantities[i] > 0 ? (
                            <div key={tier.id} className="flex justify-between text-xs text-slate-400">
                              <span>
                                {quantities[i]} × {tier.name}
                              </span>
                              <span>N${tier.price * quantities[i]}</span>
                            </div>
                          ) : null
                        )}
                        <div className="h-px bg-slate-200" />
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-700">
                            Total
                          </span>
                          <span className="text-xl font-extrabold text-slate-900">
                            N${totalAmount}
                          </span>
                        </div>
                      </div>

                      {checkoutError && (
                        <div role="alert" className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-700 font-medium">
                          {checkoutError}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
                        <Lock className="w-3.5 h-3.5" />
                        Card payment is handled securely by DPO Pay. We never see your card details.
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* PANEL FOOTER – navigation buttons */}
              <div className="p-6 bg-white border-t border-slate-100 shrink-0">
                <div className="flex gap-3">
                  {bookingStep > 1 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setBookingStep((s) => s - 1)}
                      disabled={submitting}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </motion.button>
                  )}
                  {bookingStep < 3 ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (bookingStep === 2 && totalAmount === 0) return;
                        setBookingStep((s) => s + 1);
                      }}
                      disabled={bookingStep === 2 && totalAmount === 0}
                      className={`flex-1 font-bold py-4 rounded-xl shadow-lg transition-all text-lg flex items-center justify-center gap-2 ${
                        bookingStep === 2 && totalAmount === 0
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"
                      }`}
                    >
                      {bookingStep === 1 ? "Select Tickets" : "Continue"}
                      <ChevronRight className="w-5 h-5" />
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={buyerValid && !submitting ? { scale: 1.02 } : undefined}
                      whileTap={buyerValid && !submitting ? { scale: 0.98 } : undefined}
                      type="submit"
                      form="checkout-form"
                      disabled={!buyerValid || submitting || totalAmount === 0}
                      className={`flex-1 font-bold py-4 rounded-xl shadow-lg transition-all text-lg flex items-center justify-center gap-2 ${
                        !buyerValid || totalAmount === 0
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
                      }`}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Redirecting…
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Pay N${totalAmount}
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
