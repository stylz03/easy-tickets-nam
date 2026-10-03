"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Star,
  Music,
  MapPin,
  Clock,
  Calendar,
  Minus,
  Plus,
  CreditCard,
  Lock,
  Check,
  Zap,
  Crown,
  Sparkles,
  Users,
  Globe,
  Hash,
  Share2,
  Mail,
  ArrowRight,
  Volume2,
  Headphones,
} from "lucide-react";
import Logo from "@/components/Logo";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";

/* ─────────────────────── DATA ─────────────────────── */

const events = [
  {
    id: 1,
    title: "NEON NIGHTS",
    dj: "DJ KHALED",
    date: "FRI OCT 24",
    time: "22:00 - LATE",
    venue: "The Warehouse Theatre",
    genre: "HIP HOP / TRAP",
    seed: "neon-nights",
  },
  {
    id: 2,
    title: "AFROBEATS FUSION",
    dj: "BURNA BOY",
    date: "SAT OCT 25",
    time: "20:00 - 02:00",
    venue: "Independence Stadium",
    genre: "AFROBEATS",
    seed: "afrobeats-fusion",
  },
  {
    id: 3,
    title: "DEEP HOUSE SESSION",
    dj: "BLACK COFFEE",
    date: "SUN OCT 26",
    time: "16:00 - 00:00",
    venue: "Sky Lounge",
    genre: "DEEP HOUSE",
    seed: "deep-house",
  },
  {
    id: 4,
    title: "TECHNO WASTELAND",
    dj: "CARL COX",
    date: "FRI NOV 07",
    time: "23:00 - 06:00",
    venue: "Desert Arena",
    genre: "TECHNO",
    seed: "techno-wasteland",
  },
  {
    id: 5,
    title: "BASS CATHEDRAL",
    dj: "SKRILLEX",
    date: "SAT NOV 08",
    time: "21:00 - 04:00",
    venue: "Main Stage Arena",
    genre: "DUBSTEP / BASS",
    seed: "bass-cathedral",
  },
  {
    id: 6,
    title: "SUNSET SESSIONS",
    dj: "DISCLOSURE",
    date: "SUN NOV 09",
    time: "17:00 - 23:00",
    venue: "Oceanfront Deck",
    genre: "UK GARAGE / HOUSE",
    seed: "sunset-sessions",
  },
];

const djLineup = [
  { name: "DJ KHALED", genre: "Hip Hop", seed: "dj-khaled-portrait" },
  { name: "BURNA BOY", genre: "Afrobeats", seed: "burna-boy-portrait" },
  { name: "BLACK COFFEE", genre: "Deep House", seed: "black-coffee-portrait" },
  { name: "CARL COX", genre: "Techno", seed: "carl-cox-portrait" },
  { name: "SKRILLEX", genre: "Dubstep", seed: "skrillex-portrait" },
];

const testimonials = [
  {
    name: "SARAH M.",
    text: "Absolutely unreal experience. The sound system shook my soul and the visuals were out of this world. Already booked for next year!",
    stars: 5,
    event: "NEON NIGHTS 2025",
  },
  {
    name: "JAMES K.",
    text: "VIP was worth every cent. Private bar, elevated viewing, and the DJ even came by to say hey. Legendary night.",
    stars: 5,
    event: "DEEP HOUSE SESSION",
  },
  {
    name: "ANIKA T.",
    text: "Best festival production I've ever seen in Namibia. The laser show during Black Coffee's set was absolutely insane.",
    stars: 5,
    event: "AFROBEATS FUSION",
  },
  {
    name: "MARCUS D.",
    text: "Went general admission and still had an incredible time. The crowd energy was electric from start to finish.",
    stars: 4,
    event: "TECHNO WASTELAND",
  },
];

const tiers = [
  {
    name: "GENERAL ADMISSION",
    price: 350,
    perks: ["Main stage access", "Food court access", "Festival wristband"],
    color: "cyan",
  },
  {
    name: "VIP",
    price: 800,
    perks: [
      "Priority entry",
      "VIP lounge access",
      "Complimentary drinks",
      "Premium viewing area",
    ],
    color: "purple",
  },
  {
    name: "BACKSTAGE",
    price: 1500,
    perks: [
      "Meet & greet with artists",
      "Backstage access",
      "Premium open bar",
      "VIP parking",
      "Exclusive merchandise",
    ],
    color: "amber",
  },
];

/* ────────────────── COUNTDOWN HOOK ────────────────── */

function useCountdown(targetDate: Date) {
  const calcTimeLeft = useCallback(() => {
    const diff = targetDate.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }, [targetDate]);

  const [timeLeft, setTimeLeft] = useState(calcTimeLeft);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(t);
  }, [calcTimeLeft]);

  return timeLeft;
}

/* ─────────────── TYPEWRITER HOOK ──────────────────── */

function useTypewriter(text: string, speed = 60, startDelay = 400) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    let i = 0;
    setDisplayed("");
    const startTimeout = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) clearInterval(interval);
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(startTimeout);
  }, [text, speed, startDelay]);
  return displayed;
}

/* ─────────── CONFETTI / PARTICLE COMPONENT ────────── */

function NeonParticles({ count = 40 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 3,
    size: 2 + Math.random() * 4,
    color:
      i % 3 === 0
        ? "bg-cyan-400"
        : i % 3 === 1
          ? "bg-purple-500"
          : "bg-amber-400",
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={`absolute rounded-full ${p.color}`}
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            bottom: -10,
          }}
          initial={{ y: 0, opacity: 1 }}
          animate={{
            y: -800 - Math.random() * 400,
            opacity: [1, 1, 0],
            x: [0, (Math.random() - 0.5) * 200],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

/* ────────────── FLIP CLOCK DIGIT ──────────────────── */

function FlipDigit({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={display}
            initial={{ rotateX: -90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            exit={{ rotateX: 90, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="bg-[#0F172A] border border-cyan-500/30 rounded-lg px-4 py-3 sm:px-6 sm:py-5 text-4xl sm:text-6xl font-black text-white tabular-nums shadow-[0_0_30px_rgba(6,182,212,0.15)] relative overflow-hidden"
          >
            <span className="relative z-10 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
              {display}
            </span>
            {/* Fold line */}
            <div className="absolute left-0 right-0 top-1/2 h-px bg-black/30" />
          </motion.div>
        </AnimatePresence>
      </div>
      <span className="text-[10px] sm:text-xs font-bold tracking-[0.3em] text-cyan-400/70 uppercase">
        {label}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function Design2() {
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [quantities, setQuantities] = useState<Record<number, number>>({
    0: 0,
    1: 0,
    2: 0,
  });
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lineupRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();

  // Background overlay color shift
  const overlayColor = useTransform(
    scrollYProgress,
    [0, 0.3, 0.6, 1],
    [
      "rgba(11,15,25,0.4)",
      "rgba(30,10,60,0.65)",
      "rgba(10,40,50,0.75)",
      "rgba(11,15,25,0.95)",
    ]
  );

  // Parallax values
  const vipParallax = useTransform(scrollYProgress, [0.3, 0.7], [80, -80]);
  const vipParallaxSpring = useSpring(vipParallax, {
    stiffness: 50,
    damping: 20,
  });

  // Countdown target – 14 days from now
  const countdownTarget = useRef(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  );
  const timeLeft = useCountdown(countdownTarget.current);

  // Open booking modal
  const openBooking = (eventId: number) => {
    setSelectedEvent(eventId);
    setBookingStep(1);
    setSelectedTier(null);
    setQuantities({ 0: 0, 1: 0, 2: 0 });
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setCardName("");
  };

  // Smooth scroll
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  // Lineup scroll
  const scrollLineup = (dir: "left" | "right") => {
    lineupRef.current?.scrollBy({
      left: dir === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0);
  const totalPrice = tiers.reduce(
    (acc, tier, i) => acc + tier.price * (quantities[i] || 0),
    0
  );

  // Format card number
  const formatCard = (v: string) =>
    v
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
  };

  /* ─── Render ─── */
  return (
    <div
      ref={scrollContainerRef}
      className="min-h-screen bg-[#0B0F19] text-white font-sans relative overflow-x-hidden"
    >
      {/* ═══════════ GLOBAL BACKGROUND ═══════════ */}
      <div className="fixed inset-0 z-0">
        <motion.img
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          src="/images/design2/hero.png"
          className="w-full h-full object-cover opacity-40"
          alt=""
        />
        {/* Dynamic overlay */}
        <motion.div className="absolute inset-0" style={{ backgroundColor: overlayColor }} />
        {/* Subtle grain texture */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+')]" />
      </div>

      {/* ═══════════ NAVIGATION ═══════════ */}
      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-[#0B0F19]/60 border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-8 py-4">
          <Logo dark={true} size="lg" />
          <nav className="hidden md:flex gap-8 text-sm font-bold tracking-widest uppercase text-slate-300 items-center">
            <button
              onClick={() => scrollTo("hero")}
              className="hover:text-cyan-400 transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => scrollTo("lineup")}
              className="hover:text-cyan-400 transition-colors"
            >
              Lineup
            </button>
            <button
              onClick={() => scrollTo("vip")}
              className="hover:text-cyan-400 transition-colors"
            >
              VIP
            </button>
            <button
              onClick={() => scrollTo("shows")}
              className="relative text-cyan-400 font-black group"
            >
              Buy Tickets
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            </button>
          </nav>
          {/* Mobile hamburger placeholder */}
          <button
            onClick={() => scrollTo("shows")}
            className="md:hidden bg-cyan-500 text-[#0B0F19] font-black text-xs px-4 py-2 tracking-wider uppercase"
          >
            TICKETS
          </button>
        </div>
      </motion.header>

      {/* ═══════════ 1. HERO ═══════════ */}
      <section
        id="hero"
        className="relative z-10 min-h-screen flex items-center justify-center pt-20"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full py-20 lg:py-32">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black tracking-[0.3em] rounded-full mb-8"
            >
              <Zap className="w-3 h-3" />
              LIVE IN WINDHOEK · 2026
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter leading-[0.85] mb-8"
            >
              EXPERIENCE
              <br />
              THE{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500">
                ELECTRIC
              </span>
              <br />
              VIBE
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="text-lg sm:text-xl text-slate-400 mb-12 max-w-lg leading-relaxed"
            >
              Secure your spot at the most anticipated electronic music festival
              of the year. World-class DJs. Immersive production. One night
              you&apos;ll never forget.
            </motion.p>

            <div className="flex flex-wrap gap-4">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  boxShadow: [
                    "0 0 0px rgba(6,182,212,0)",
                    "0 0 40px rgba(6,182,212,0.6)",
                    "0 0 0px rgba(6,182,212,0)",
                  ],
                }}
                transition={{
                  duration: 0.8,
                  delay: 0.9,
                  boxShadow: { repeat: Infinity, duration: 2.5 },
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollTo("shows")}
                className="bg-cyan-500 hover:bg-cyan-400 text-[#0B0F19] font-black text-base sm:text-lg px-10 py-4 tracking-wider uppercase cursor-pointer transition-colors"
              >
                Get Tickets Now
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.0 }}
                whileHover={{
                  scale: 1.05,
                  backgroundColor: "rgba(255,255,255,0.05)",
                }}
                whileTap={{ scale: 0.95 }}
                className="border border-white/20 text-white font-bold text-base sm:text-lg px-8 py-4 hover:bg-white/5 transition-colors uppercase tracking-wider flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" /> Watch Teaser
              </motion.button>
            </div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center p-1"
            >
              <div className="w-1.5 h-3 bg-cyan-400 rounded-full" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ 2. LATEST SHOWS ═══════════ */}
      <section id="shows" className="relative z-10 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4"
          >
            <div>
              <div className="text-cyan-400 text-xs font-black tracking-[0.4em] mb-3">
                UPCOMING
              </div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
                LATEST SHOWS
              </h2>
            </div>
            <p className="text-slate-400 text-sm max-w-xs">
              Click any event to book your tickets and secure your night.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                whileHover={{
                  y: -8,
                  borderColor: "rgba(6,182,212,0.6)",
                  boxShadow: "0 0 30px rgba(6,182,212,0.15)",
                }}
                className="group relative h-64 bg-[#0F172A] border border-white/10 rounded-xl overflow-hidden cursor-pointer transition-shadow"
                onClick={() => openBooking(event.id)}
              >
                {/* Image */}
                <img
                  src={i % 4 === 0 ? "/images/design2/evt1.png" : i % 4 === 1 ? "/images/design2/evt2.png" : i % 4 === 2 ? "/images/design2/evt3.png" : "/images/design2/evt4.png"}
                  alt={event.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-700"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/60 to-transparent z-10" />

                {/* Genre tag */}
                <div className="absolute top-4 left-4 z-20">
                  <span className="text-[10px] font-black tracking-[0.2em] text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full">
                    {event.genre}
                  </span>
                </div>

                {/* Content */}
                <div className="absolute inset-0 z-20 p-6 flex flex-col justify-end">
                  <div className="text-cyan-400 text-xs font-black tracking-[0.2em] mb-1.5">
                    {event.date} · {event.time}
                  </div>
                  <h4 className="text-2xl font-black uppercase tracking-tight">
                    {event.title}
                  </h4>
                  <div className="text-sm text-slate-400 mt-1">
                    {event.dj} · {event.venue}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-cyan-400 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 font-bold tracking-wider">
                    BOOK NOW <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 3. DJ LINEUP ═══════════ */}
      <section id="lineup" className="relative z-10 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-between items-end mb-12"
          >
            <div>
              <div className="text-purple-400 text-xs font-black tracking-[0.4em] mb-3">
                ARTISTS
              </div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
                DJ LINEUP
              </h2>
            </div>
            <div className="hidden sm:flex gap-2">
              <button
                onClick={() => scrollLineup("left")}
                className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white/10 hover:border-cyan-500/50 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollLineup("right")}
                className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white/10 hover:border-cyan-500/50 transition-all cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          <div
            ref={lineupRef}
            className="flex gap-6 overflow-x-auto pb-6 scrollbar-none snap-x snap-mandatory"
            style={{ scrollbarWidth: "none" }}
          >
            {djLineup.map((dj, i) => (
              <motion.div
                key={dj.name}
                initial={{ opacity: 0, x: 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="snap-start flex-shrink-0 w-56 group"
              >
                <div className="relative mb-5">
                  {/* Neon ring behind image */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{
                      boxShadow: [
                        "0 0 0px rgba(6,182,212,0)",
                        "0 0 20px rgba(6,182,212,0.4)",
                        "0 0 0px rgba(6,182,212,0)",
                      ],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                      delay: i * 0.5,
                    }}
                  />
                  <div className="w-56 h-56 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-cyan-400/60 transition-colors duration-500">
                    <img
                      src={i % 4 === 0 ? "/images/design2/evt1.png" : i % 4 === 1 ? "/images/design2/evt2.png" : i % 4 === 2 ? "/images/design2/evt3.png" : "/images/design2/evt4.png"}
                      alt={dj.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  {/* Play icon overlay */}
                  <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-14 h-14 bg-cyan-500/90 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Headphones className="w-6 h-6 text-[#0B0F19]" />
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-black tracking-wide">
                    {dj.name}
                  </h4>
                  <p className="text-sm text-slate-500 font-bold tracking-wider uppercase">
                    {dj.genre}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 4. VIP EXPERIENCE ═══════════ */}
      <section id="vip" className="relative z-10 py-24 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Text side */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="text-amber-400 text-xs font-black tracking-[0.4em] mb-3">
                EXCLUSIVE
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-8">
                THE VIP
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-purple-500">
                  EXPERIENCE
                </span>
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-lg">
                Elevate your night with exclusive backstage access, premium open
                bars, dedicated VIP lounges, and meet-and-greet sessions with
                headlining artists. This isn&apos;t just a concert—it&apos;s a
                lifestyle.
              </p>
              <div className="space-y-5">
                {[
                  {
                    icon: Crown,
                    title: "Private VIP Lounge",
                    desc: "Elevated viewing platform with premium seating",
                  },
                  {
                    icon: Sparkles,
                    title: "Complimentary Premium Bar",
                    desc: "Unlimited craft cocktails and champagne all night",
                  },
                  {
                    icon: Users,
                    title: "Artist Meet & Greet",
                    desc: "Exclusive backstage access with photo opportunities",
                  },
                  {
                    icon: Volume2,
                    title: "Immersive Sound Zone",
                    desc: "Custom sound-tuned areas for the perfect audio experience",
                  },
                ].map((perk, i) => (
                  <motion.div
                    key={perk.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shrink-0">
                      <perk.icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm tracking-wider uppercase">
                        {perk.title}
                      </h4>
                      <p className="text-slate-500 text-sm">{perk.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollTo("shows")}
                className="mt-10 bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-black text-sm px-8 py-4 tracking-wider uppercase cursor-pointer"
              >
                Upgrade to VIP
              </motion.button>
            </motion.div>

            {/* Image side with parallax */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden aspect-[4/5]">
                <motion.img
                  style={{ y: vipParallaxSpring }}
                  src="/images/design2/hero.png"
                  alt="VIP Experience"
                  className="w-full h-[120%] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-[#0B0F19]/30" />
              </div>

              {/* Floating stat cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute -bottom-6 -left-6 bg-[#0F172A]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl"
              >
                <div className="text-3xl font-black text-cyan-400">50K+</div>
                <div className="text-xs text-slate-400 font-bold tracking-wider">
                  TICKETS SOLD
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 }}
                className="absolute -top-4 -right-4 bg-[#0F172A]/90 backdrop-blur-xl border border-purple-500/30 rounded-xl p-4 shadow-2xl"
              >
                <div className="text-3xl font-black text-purple-400">4.9★</div>
                <div className="text-xs text-slate-400 font-bold tracking-wider">
                  AVG RATING
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ 5. FAN REACTIONS ═══════════ */}
      <section className="relative z-10 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="text-cyan-400 text-xs font-black tracking-[0.4em] mb-3">
              TESTIMONIALS
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
              FAN REACTIONS
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 * i }}
                whileHover={{
                  borderColor: "rgba(6,182,212,0.5)",
                  boxShadow: "0 0 40px rgba(6,182,212,0.1)",
                }}
                className="bg-[#0F172A]/80 backdrop-blur border border-white/10 rounded-xl p-8 transition-shadow"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }, (_, s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${s < t.stars ? "text-cyan-400 fill-cyan-400" : "text-slate-600"}`}
                    />
                  ))}
                </div>
                <p className="text-slate-300 leading-relaxed mb-6 text-sm">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-xs font-black">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-sm tracking-wider">
                      {t.name}
                    </div>
                    <div className="text-xs text-slate-500 font-bold tracking-wider">
                      {t.event}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 6. COUNTDOWN TIMER ═══════════ */}
      <section className="relative z-10 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="text-purple-400 text-xs font-black tracking-[0.4em] mb-3">
              COMING SOON
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
              NEXT BIG EVENT
            </h2>
            <p className="text-slate-400 mb-12 max-w-lg mx-auto">
              The countdown has begun. Don&apos;t miss the biggest electronic
              music experience of the decade.
            </p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex justify-center gap-4 sm:gap-6"
            >
              <FlipDigit value={timeLeft.days} label="Days" />
              <div className="flex items-center text-3xl sm:text-5xl font-black text-cyan-400/40 pt-2 self-start mt-3 sm:mt-5">
                :
              </div>
              <FlipDigit value={timeLeft.hours} label="Hours" />
              <div className="flex items-center text-3xl sm:text-5xl font-black text-cyan-400/40 pt-2 self-start mt-3 sm:mt-5">
                :
              </div>
              <FlipDigit value={timeLeft.minutes} label="Minutes" />
              <div className="flex items-center text-3xl sm:text-5xl font-black text-cyan-400/40 pt-2 self-start mt-3 sm:mt-5">
                :
              </div>
              <FlipDigit value={timeLeft.seconds} label="Seconds" />
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollTo("shows")}
              className="mt-14 bg-cyan-500 hover:bg-cyan-400 text-[#0B0F19] font-black text-sm px-10 py-4 tracking-wider uppercase cursor-pointer transition-colors"
            >
              Get Early Access
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ 7. FOOTER ═══════════ */}
      <footer className="relative z-10 border-t border-white/5 bg-[#070A12]/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-1">
              <Logo dark={true} size="lg" />
              <p className="text-slate-500 text-sm mt-4 leading-relaxed">
                Namibia&apos;s premier event ticketing platform. Bringing
                world-class experiences to your fingertips.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-black tracking-[0.3em] text-slate-400 mb-4">
                QUICK LINKS
              </h4>
              <ul className="space-y-3 text-sm">
                {["Home", "Lineup", "VIP Experience", "Buy Tickets"].map(
                  (link) => (
                    <li key={link}>
                      <button
                        onClick={() =>
                          scrollTo(
                            link === "Home"
                              ? "hero"
                              : link === "Buy Tickets"
                                ? "shows"
                                : link === "VIP Experience"
                                  ? "vip"
                                  : "lineup"
                          )
                        }
                        className="text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer font-medium"
                      >
                        {link}
                      </button>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-black tracking-[0.3em] text-slate-400 mb-4">
                SUPPORT
              </h4>
              <ul className="space-y-3 text-sm">
                {["FAQ", "Contact Us", "Terms & Conditions", "Privacy Policy"].map(
                  (link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-slate-500 hover:text-cyan-400 transition-colors font-medium"
                      >
                        {link}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-black tracking-[0.3em] text-slate-400 mb-4">
                FOLLOW US
              </h4>
              <div className="flex gap-3">
                {[
                  { icon: Globe, label: "Website" },
                  { icon: Hash, label: "Socials" },
                  { icon: Share2, label: "Share" },
                  { icon: Mail, label: "Email" },
                ].map((social) => (
                  <a
                    key={social.label}
                    href="#"
                    className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center text-slate-500 hover:text-cyan-400 hover:border-cyan-500/50 transition-all"
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
              <div className="mt-6">
                <p className="text-xs text-slate-600 font-bold tracking-wider mb-2">
                  NEWSLETTER
                </p>
                <div className="flex">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="flex-1 bg-white/5 border border-white/10 rounded-l px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
                  />
                  <button className="bg-cyan-500 text-[#0B0F19] px-4 py-2.5 font-black text-sm tracking-wider rounded-r hover:bg-cyan-400 transition-colors cursor-pointer">
                    GO
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-600 font-medium">
              © 2026 Easy Tickets. All rights reserved.
            </p>
            <p className="text-xs text-slate-600 font-medium">
              Made with{" "}
              <span className="text-cyan-400">⚡</span> in Namibia
            </p>
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════
          BOOKING MODAL - FULL 4-STEP WORKFLOW
         ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ backdropFilter: "blur(0px)" }}
              animate={{ backdropFilter: "blur(24px)" }}
              exit={{ backdropFilter: "blur(0px)" }}
              className="absolute inset-0 bg-black/70"
              onClick={() => setSelectedEvent(null)}
            />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-5xl bg-[#0B0F19] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Step indicator */}
              {bookingStep < 4 && (
                <div className="px-8 pt-6 pb-0">
                  <div className="flex gap-2 items-center">
                    {[1, 2, 3].map((s) => (
                      <React.Fragment key={s}>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                            bookingStep >= s
                              ? "bg-cyan-500 text-[#0B0F19]"
                              : "bg-white/5 text-slate-600 border border-white/10"
                          }`}
                        >
                          {bookingStep > s ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            s
                          )}
                        </div>
                        {s < 3 && (
                          <div
                            className={`flex-1 h-0.5 transition-all duration-300 ${
                              bookingStep > s ? "bg-cyan-500" : "bg-white/10"
                            }`}
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] font-bold tracking-widest text-slate-500">
                    <span>DETAILS</span>
                    <span>TICKETS</span>
                    <span>PAYMENT</span>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {/* ─── STEP 1: EVENT DETAILS ─── */}
                  {bookingStep === 1 &&
                    (() => {
                      const ev = events.find((e) => e.id === selectedEvent);
                      if (!ev) return null;
                      return (
                        <motion.div
                          key="step1"
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -30 }}
                          transition={{ duration: 0.3 }}
                          className="flex flex-col lg:flex-row"
                        >
                          {/* Image half */}
                          <div className="relative w-full lg:w-1/2 h-64 lg:h-auto min-h-[300px]">
                            <img
                              src={ev.id % 4 === 0 ? "/images/design2/evt1.png" : ev.id % 4 === 1 ? "/images/design2/evt2.png" : ev.id % 4 === 2 ? "/images/design2/evt3.png" : "/images/design2/evt4.png"}
                              alt={ev.title}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#0B0F19] via-[#0B0F19]/50 to-transparent" />
                            <div className="absolute bottom-8 left-8">
                              <div className="px-3 py-1 bg-cyan-500 text-[#0B0F19] text-[10px] font-black tracking-[0.2em] inline-block mb-3">
                                HEADLINING
                              </div>
                              <h2 className="text-5xl lg:text-6xl font-black text-white leading-none drop-shadow-lg">
                                {ev.dj}
                              </h2>
                            </div>
                          </div>

                          {/* Details half */}
                          <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-between">
                            <div>
                              <div className="text-cyan-400 font-black tracking-[0.3em] text-xs mb-2">
                                {ev.genre}
                              </div>
                              <h3 className="text-3xl lg:text-4xl font-black uppercase tracking-tight mb-8">
                                {ev.title}
                              </h3>

                              <div className="space-y-5 mb-8">
                                {[
                                  {
                                    icon: Calendar,
                                    label: "DATE",
                                    value: ev.date,
                                  },
                                  {
                                    icon: Clock,
                                    label: "SET TIME",
                                    value: ev.time,
                                  },
                                  {
                                    icon: MapPin,
                                    label: "VENUE",
                                    value: ev.venue,
                                  },
                                ].map((detail) => (
                                  <div
                                    key={detail.label}
                                    className="flex items-center gap-4 border-b border-white/5 pb-4"
                                  >
                                    <div className="w-11 h-11 rounded-lg bg-white/5 flex items-center justify-center text-cyan-400">
                                      <detail.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-slate-500 font-black tracking-[0.2em]">
                                        {detail.label}
                                      </div>
                                      <div className="text-base font-medium">
                                        {detail.value}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <p className="text-slate-400 text-sm leading-relaxed">
                                Join {ev.dj} for an unforgettable night of
                                music, lights, and energy. Experience
                                state-of-the-art sound systems and immersive
                                visuals that will transport you to another
                                dimension. VIP packages include exclusive lounge
                                access and dedicated bar service.
                              </p>
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setBookingStep(2)}
                              className="mt-8 w-full bg-cyan-500 hover:bg-cyan-400 text-[#0B0F19] font-black py-4 tracking-wider uppercase text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                            >
                              SELECT TICKETS{" "}
                              <ArrowRight className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })()}

                  {/* ─── STEP 2: TICKET SELECTION ─── */}
                  {bookingStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.3 }}
                      className="p-8 lg:p-12"
                    >
                      <h3 className="text-2xl font-black tracking-tight mb-2">
                        SELECT YOUR TIER
                      </h3>
                      <p className="text-sm text-slate-500 mb-8">
                        Choose your experience level and quantity
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                        {tiers.map((tier, i) => {
                          const isSelected = (quantities[i] || 0) > 0;
                          const borderColor =
                            tier.color === "cyan"
                              ? "border-cyan-500"
                              : tier.color === "purple"
                                ? "border-purple-500"
                                : "border-amber-500";
                          const glowColor =
                            tier.color === "cyan"
                              ? "shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                              : tier.color === "purple"
                                ? "shadow-[0_0_30px_rgba(168,85,247,0.2)]"
                                : "shadow-[0_0_30px_rgba(245,158,11,0.2)]";
                          const accentText =
                            tier.color === "cyan"
                              ? "text-cyan-400"
                              : tier.color === "purple"
                                ? "text-purple-400"
                                : "text-amber-400";
                          const accentBg =
                            tier.color === "cyan"
                              ? "bg-cyan-500"
                              : tier.color === "purple"
                                ? "bg-purple-500"
                                : "bg-amber-500";

                          return (
                            <motion.div
                              key={tier.name}
                              initial={{ opacity: 0, y: 30 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 * i }}
                              className={`relative bg-[#0F172A] border rounded-xl p-6 transition-all ${
                                isSelected
                                  ? `${borderColor} ${glowColor}`
                                  : "border-white/10"
                              }`}
                            >
                              {tier.color === "purple" && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-[#0B0F19] text-[10px] font-black tracking-widest px-3 py-0.5 rounded-full">
                                  POPULAR
                                </div>
                              )}
                              <h4
                                className={`font-black text-sm tracking-wider mb-1 ${accentText}`}
                              >
                                {tier.name}
                              </h4>
                              <div className="text-3xl font-black mb-5">
                                N${tier.price}
                              </div>
                              <ul className="space-y-2 mb-6">
                                {tier.perks.map((perk) => (
                                  <li
                                    key={perk}
                                    className="flex items-center gap-2 text-sm text-slate-400"
                                  >
                                    <Check
                                      className={`w-3.5 h-3.5 ${accentText}`}
                                    />
                                    {perk}
                                  </li>
                                ))}
                              </ul>

                              {/* Quantity controls */}
                              <div className="flex items-center justify-between bg-black/30 rounded-lg p-2">
                                <button
                                  onClick={() =>
                                    setQuantities((q) => ({
                                      ...q,
                                      [i]: Math.max(0, (q[i] || 0) - 1),
                                    }))
                                  }
                                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                                    (quantities[i] || 0) > 0
                                      ? `${accentBg} text-[#0B0F19]`
                                      : "bg-white/5 text-slate-600"
                                  }`}
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="text-xl font-black tabular-nums w-10 text-center">
                                  {quantities[i] || 0}
                                </span>
                                <button
                                  onClick={() =>
                                    setQuantities((q) => ({
                                      ...q,
                                      [i]: Math.min(10, (q[i] || 0) + 1),
                                    }))
                                  }
                                  className={`w-9 h-9 rounded-lg ${accentBg} text-[#0B0F19] flex items-center justify-center cursor-pointer`}
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* Summary & actions */}
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-white/10 pt-6">
                        <div>
                          <span className="text-sm text-slate-500">
                            {totalTickets} ticket{totalTickets !== 1 && "s"}{" "}
                            selected
                          </span>
                          {totalTickets > 0 && (
                            <span className="text-lg font-black text-cyan-400 ml-3">
                              Total: N${totalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setBookingStep(1)}
                            className="border border-white/10 text-sm font-bold px-6 py-3 tracking-wider uppercase hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            Back
                          </button>
                          <button
                            onClick={() =>
                              totalTickets > 0 && setBookingStep(3)
                            }
                            disabled={totalTickets === 0}
                            className={`text-sm font-black px-8 py-3 tracking-wider uppercase transition-all cursor-pointer ${
                              totalTickets > 0
                                ? "bg-cyan-500 hover:bg-cyan-400 text-[#0B0F19]"
                                : "bg-white/5 text-slate-600 cursor-not-allowed"
                            }`}
                          >
                            Continue to Payment
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ─── STEP 3: PAYMENT ─── */}
                  {bookingStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.3 }}
                      className="p-8 lg:p-12"
                    >
                      <h3 className="text-2xl font-black tracking-tight mb-2">
                        PAYMENT DETAILS
                      </h3>
                      <p className="text-sm text-slate-500 mb-8">
                        Enter your card information to complete the purchase
                      </p>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Card form */}
                        <div className="space-y-5">
                          {/* Card visual */}
                          <div className="bg-gradient-to-br from-[#1a1f35] to-[#0F172A] border border-white/10 rounded-xl p-6 aspect-[16/10] flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl" />
                            <div className="flex justify-between items-start">
                              <div className="w-12 h-9 bg-gradient-to-br from-amber-300 to-amber-500 rounded-md" />
                              <CreditCard className="w-8 h-8 text-slate-600" />
                            </div>
                            <div>
                              <div className="text-lg tracking-[0.25em] font-mono text-slate-300 mb-4">
                                {cardNumber || "•••• •••• •••• ••••"}
                              </div>
                              <div className="flex justify-between text-xs text-slate-500 font-bold tracking-wider">
                                <span>
                                  {cardName || "CARDHOLDER NAME"}
                                </span>
                                <span>
                                  {cardExpiry || "MM/YY"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Input fields */}
                          <div>
                            <label className="text-[10px] font-black tracking-[0.2em] text-slate-500 block mb-1.5">
                              CARDHOLDER NAME
                            </label>
                            <input
                              type="text"
                              value={cardName}
                              onChange={(e) =>
                                setCardName(e.target.value.toUpperCase())
                              }
                              placeholder="FULL NAME ON CARD"
                              className="w-full bg-[#0F172A] border border-white/10 focus:border-cyan-500/70 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black tracking-[0.2em] text-slate-500 block mb-1.5">
                              CARD NUMBER
                            </label>
                            <input
                              type="text"
                              value={cardNumber}
                              onChange={(e) =>
                                setCardNumber(formatCard(e.target.value))
                              }
                              placeholder="0000 0000 0000 0000"
                              className="w-full bg-[#0F172A] border border-white/10 focus:border-cyan-500/70 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition-all font-mono tracking-wider"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-black tracking-[0.2em] text-slate-500 block mb-1.5">
                                EXPIRY DATE
                              </label>
                              <input
                                type="text"
                                value={cardExpiry}
                                onChange={(e) =>
                                  setCardExpiry(formatExpiry(e.target.value))
                                }
                                placeholder="MM/YY"
                                className="w-full bg-[#0F172A] border border-white/10 focus:border-cyan-500/70 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition-all font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black tracking-[0.2em] text-slate-500 block mb-1.5">
                                CVV
                              </label>
                              <input
                                type="text"
                                value={cardCvv}
                                onChange={(e) =>
                                  setCardCvv(
                                    e.target.value
                                      .replace(/\D/g, "")
                                      .slice(0, 4)
                                  )
                                }
                                placeholder="•••"
                                className="w-full bg-[#0F172A] border border-white/10 focus:border-cyan-500/70 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition-all font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Order summary */}
                        <div className="bg-[#0F172A]/80 border border-white/10 rounded-xl p-6 h-fit">
                          <h4 className="text-sm font-black tracking-wider mb-5">
                            ORDER SUMMARY
                          </h4>
                          {tiers.map((tier, i) =>
                            (quantities[i] || 0) > 0 ? (
                              <div
                                key={tier.name}
                                className="flex justify-between items-center py-3 border-b border-white/5 text-sm"
                              >
                                <div>
                                  <span className="font-bold">
                                    {tier.name}
                                  </span>
                                  <span className="text-slate-500">
                                    {" "}
                                    × {quantities[i]}
                                  </span>
                                </div>
                                <span className="font-bold">
                                  N$
                                  {(
                                    tier.price * (quantities[i] || 0)
                                  ).toLocaleString()}
                                </span>
                              </div>
                            ) : null
                          )}
                          <div className="flex justify-between items-center py-3 border-b border-white/5 text-sm">
                            <span className="text-slate-500">Service fee</span>
                            <span className="text-slate-500">
                              N${(totalPrice * 0.05).toFixed(0)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-4 text-lg font-black">
                            <span>TOTAL</span>
                            <span className="text-cyan-400">
                              N$
                              {(
                                totalPrice +
                                Number((totalPrice * 0.05).toFixed(0))
                              ).toLocaleString()}
                            </span>
                          </div>

                          <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Secured with 256-bit SSL encryption</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-between items-center mt-8 border-t border-white/10 pt-6">
                        <button
                          onClick={() => setBookingStep(2)}
                          className="border border-white/10 text-sm font-bold px-6 py-3 tracking-wider uppercase hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          Back
                        </button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setBookingStep(4)}
                          className="bg-cyan-500 hover:bg-cyan-400 text-[#0B0F19] font-black text-sm px-10 py-4 tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <Lock className="w-4 h-4" />
                          PAY N$
                          {(
                            totalPrice +
                            Number((totalPrice * 0.05).toFixed(0))
                          ).toLocaleString()}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* ─── STEP 4: SUCCESS ─── */}
                  {bookingStep === 4 && <SuccessStep event={events.find((e) => e.id === selectedEvent)!} totalTickets={totalTickets} />}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════ SUCCESS STEP COMPONENT ═══════════ */

function SuccessStep({ event, totalTickets }: { event: (typeof events extends (infer T)[] ? T : never); totalTickets: number }) {
  const accessText = useTypewriter("ACCESS GRANTED", 80, 800);

  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-8 lg:p-12 flex flex-col items-center justify-center text-center relative min-h-[500px]"
    >
      {/* Particles */}
      <NeonParticles count={50} />

      {/* Neon ring */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          damping: 12,
          stiffness: 100,
          delay: 0.2,
        }}
        className="relative mb-8"
      >
        <motion.div
          animate={{
            boxShadow: [
              "0 0 20px rgba(6,182,212,0.3), inset 0 0 20px rgba(6,182,212,0.1)",
              "0 0 60px rgba(6,182,212,0.6), inset 0 0 40px rgba(6,182,212,0.2)",
              "0 0 20px rgba(6,182,212,0.3), inset 0 0 20px rgba(6,182,212,0.1)",
            ],
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-28 h-28 rounded-full border-4 border-cyan-400 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              delay: 0.6,
              damping: 10,
            }}
          >
            <Check className="w-12 h-12 text-cyan-400" strokeWidth={3} />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Typewriter text */}
      <div className="h-12 mb-2">
        <span className="text-3xl sm:text-4xl font-black tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
          {accessText}
        </span>
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.6 }}
          className="text-3xl sm:text-4xl font-black text-cyan-400 ml-1"
        >
          |
        </motion.span>
      </div>
      <p className="text-slate-400 text-sm mb-10">
        Your booking has been confirmed. Check your email for details.
      </p>

      {/* Digital pass */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="bg-[#0F172A] border border-white/10 rounded-2xl overflow-hidden w-full max-w-sm mx-auto"
      >
        {/* Pass header */}
        <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            <Logo dark={true} size="sm" />
            <span className="text-[10px] font-black tracking-[0.2em] text-cyan-400">
              DIGITAL PASS
            </span>
          </div>
        </div>

        <div className="p-6">
          <h4 className="text-xl font-black tracking-tight mb-1">
            {event.title}
          </h4>
          <div className="text-sm text-cyan-400 font-bold mb-4">{event.dj}</div>

          <div className="grid grid-cols-2 gap-3 text-xs mb-6">
            <div>
              <div className="text-slate-500 font-bold tracking-wider">
                DATE
              </div>
              <div className="font-bold">{event.date}</div>
            </div>
            <div>
              <div className="text-slate-500 font-bold tracking-wider">
                TIME
              </div>
              <div className="font-bold">{event.time}</div>
            </div>
            <div>
              <div className="text-slate-500 font-bold tracking-wider">
                VENUE
              </div>
              <div className="font-bold">{event.venue}</div>
            </div>
            <div>
              <div className="text-slate-500 font-bold tracking-wider">
                QTY
              </div>
              <div className="font-bold">
                {totalTickets} ticket{totalTickets !== 1 && "s"}
              </div>
            </div>
          </div>

          {/* QR Code placeholder */}
          <div className="border-t border-dashed border-white/10 pt-5 flex flex-col items-center">
            <div className="w-32 h-32 bg-white rounded-lg p-2 mb-3">
              <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4Ij48cmVjdCB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgZmlsbD0id2hpdGUiLz48cmVjdCB4PSIxNiIgeT0iMTYiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgZmlsbD0iYmxhY2siLz48cmVjdCB4PSI4MCIgeT0iMTYiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgZmlsbD0iYmxhY2siLz48cmVjdCB4PSIxNiIgeT0iODAiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgZmlsbD0iYmxhY2siLz48cmVjdCB4PSI1NiIgeT0iNTYiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iYmxhY2siLz48cmVjdCB4PSI4OCIgeT0iODgiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iYmxhY2siLz48cmVjdCB4PSIyNCIgeT0iMjQiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0id2hpdGUiLz48cmVjdCB4PSI4OCIgeT0iMjQiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0id2hpdGUiLz48cmVjdCB4PSIyNCIgeT0iODgiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=')] bg-contain bg-center bg-no-repeat" />
            </div>
            <div className="text-[10px] text-slate-500 font-bold tracking-widest">
              SCAN AT ENTRY
            </div>
            <div className="text-[10px] text-slate-600 font-mono mt-1">
              ET-{event.id.toString().padStart(4, "0")}-
              {Date.now().toString(36).toUpperCase().slice(-6)}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mt-8 text-sm text-cyan-400 font-bold tracking-wider hover:text-cyan-300 transition-colors cursor-pointer uppercase"
      >
        Download Pass →
      </motion.button>
    </motion.div>
  );
}
