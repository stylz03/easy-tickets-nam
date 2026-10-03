"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Search,
  ChevronRight,
  X,
  User,
  MapPin,
  Calendar,
  Clock,
  Minus,
  Plus,
  CreditCard,
  Lock,
  Check,
  Star,
  ArrowRight,
  Mail,
  Phone,

  Heart,
  Ticket,
  Quote,
  Send,
  Globe,
  ChevronDown,
} from "lucide-react";
import Logo from "@/components/Logo";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useInView,
} from "framer-motion";

/* ──────────────────── DATA ──────────────────── */

const events = [
  {
    id: 1,
    title: "Ongwediva Annual Trade Fair",
    date: "Aug 23 – Sep 01, 2026",
    shortDate: "Aug 23 – Sep 01",
    category: "EXHIBITION",
    img: "/images/design3/evt1.png",
    price: "N$50",
    location: "Ongwediva, Oshana Region",
    desc: "The largest trade and exhibition event in Northern Namibia, showcasing local and international businesses, agricultural innovations, and cultural performances that unite communities.",
  },
  {
    id: 2,
    title: "Kapana Festival",
    date: "Sep 15, 2026",
    shortDate: "Sep 15",
    category: "CULTURE & FOOD",
    img: "/images/design3/evt2.png",
    price: "Free",
    location: "Katutura, Windhoek",
    desc: "Celebrate the rich culinary heritage of Namibia with the best Kapana vendors from across the country. Street food, live music, and vibrant community spirit.",
  },
  {
    id: 3,
    title: "Etosha Safari Marathon",
    date: "Oct 05, 2026",
    shortDate: "Oct 05",
    category: "SPORTS & NATURE",
    img: "/images/design3/evt3.png",
    price: "N$300",
    location: "Etosha National Park",
    desc: "Run alongside wildlife in one of Africa's greatest national parks. An unforgettable athletic experience through breathtaking Namibian landscapes.",
  },
  {
    id: 4,
    title: "Windhoek Jazz Festival",
    date: "Nov 12–14, 2026",
    shortDate: "Nov 12–14",
    category: "MUSIC",
    img: "/images/design3/evt4.png",
    price: "N$180",
    location: "National Theatre, Windhoek",
    desc: "Three nights of world-class jazz performances featuring Namibian artists alongside international guests. An evening of soulful rhythms under the stars.",
  },
  {
    id: 5,
    title: "Herero Cultural Day",
    date: "Oct 26, 2026",
    shortDate: "Oct 26",
    category: "HERITAGE",
    img: "/images/design3/evt1.png",
    price: "N$30",
    location: "Okahandja",
    desc: "Honor the traditions and history of the Herero people with ceremonial gatherings, traditional dress showcases, and communal storytelling.",
  },
  {
    id: 6,
    title: "Swakopmund Arts & Crafts Market",
    date: "Dec 06–07, 2026",
    shortDate: "Dec 06–07",
    category: "ART MARKET",
    img: "/images/design3/evt2.png",
    price: "Free",
    location: "Swakopmund Waterfront",
    desc: "Discover handcrafted jewelry, pottery, textiles, and paintings from Namibia's most talented artisans. A coastal creative celebration.",
  },
];

const galleryImages = [
  { src: "/images/design3/evt1.png", alt: "Traditional dance performance", tall: true },
  { src: "/images/design3/evt2.png", alt: "Namibian desert landscape", tall: false },
  { src: "/images/design3/evt3.png", alt: "Artisan crafts market", tall: false },
  { src: "/images/design3/evt4.png", alt: "Cultural ceremony", tall: true },
  { src: "/images/design3/hero.png", alt: "Sunset over savannah", tall: false },
  { src: "/images/design3/evt1.png", alt: "Local musicians playing", tall: true },
  { src: "/images/design3/evt2.png", alt: "Himba village life", tall: false },
  { src: "/images/design3/evt3.png", alt: "Street food culture", tall: false },
];

const testimonials = [
  {
    name: "Ndapewa Shikongo",
    role: "Cultural Enthusiast",
    avatar: "/images/design3/evt4.png",
    text: "Easy Tickets made it so seamless to attend the Ongwediva Trade Fair. The booking process felt personal and warm — exactly how our community events should be.",
  },
  {
    name: "Jonas Shilongo",
    role: "Festival Organizer",
    avatar: "/images/design3/hero.png",
    text: "As an event organizer, Easy Tickets gave us the tools to reach thousands more people. Their platform truly understands the spirit of Namibian culture.",
  },
  {
    name: "Maria Nghidengwa",
    role: "First-time Visitor",
    avatar: "/images/design3/evt1.png",
    text: "I discovered events I never knew existed. The curated experiences feel hand-picked, and the checkout was the smoothest I've ever used.",
  },
];

const partners = [
  "/images/design3/evt2.png",
  "/images/design3/evt3.png",
  "/images/design3/evt4.png",
  "/images/design3/hero.png",
  "/images/design3/evt1.png",
  "/images/design3/evt2.png",
];

const ticketTiers = [
  {
    name: "Standard",
    price: 50,
    perks: ["General admission", "Event programme", "Community access"],
  },
  {
    name: "Family Pack",
    price: 120,
    perks: [
      "Up to 4 attendees",
      "Priority seating",
      "Complimentary refreshments",
    ],
  },
  {
    name: "Premium",
    price: 250,
    perks: [
      "VIP area access",
      "Meet & greet",
      "Artisan gift bag",
      "Reserved parking",
    ],
  },
];

/* ──────────────── HELPER COMPONENTS ──────────────── */

function SectionFadeIn({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* Golden particle for success state */
function GoldenParticle({ index }: { index: number }) {
  const angle = (index / 20) * Math.PI * 2;
  const radius = 80 + Math.random() * 120;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const size = 4 + Math.random() * 8;
  const delay = Math.random() * 0.4;

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        background: `hsl(${35 + Math.random() * 25}, 90%, ${55 + Math.random() * 20}%)`,
        left: "50%",
        top: "50%",
      }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
      animate={{
        x,
        y,
        opacity: [1, 1, 0],
        scale: [0, 1.2, 0.6],
        rotate: Math.random() * 360,
      }}
      transition={{
        duration: 1.4 + Math.random() * 0.6,
        delay,
        ease: "easeOut",
      }}
    />
  );
}

/* ──────────────────── MAIN PAGE ──────────────────── */

export default function Design3() {
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState(0);
  const [quantities, setQuantities] = useState([0, 0, 0]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Payment form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");
  const [cardName, setCardName] = useState("");

  // Parallax
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, 200]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 600], [1, 1.1]);

  // Newsletter
  const [email, setEmail] = useState("");

  const openEvent = useCallback((id: number) => {
    setSelectedEvent(id);
    setBookingStep(1);
    setSelectedTier(0);
    setQuantities([0, 0, 0]);
    setCardNumber("");
    setCardExpiry("");
    setCardCVV("");
    setCardName("");
  }, []);

  const closeEvent = useCallback(() => {
    setSelectedEvent(null);
    setBookingStep(1);
  }, []);

  const updateQuantity = (tierIdx: number, delta: number) => {
    setQuantities((prev) => {
      const next = [...prev];
      next[tierIdx] = Math.max(0, Math.min(10, next[tierIdx] + delta));
      return next;
    });
  };

  const totalAmount = quantities.reduce(
    (sum, qty, idx) => sum + qty * ticketTiers[idx].price,
    0
  );

  const totalTickets = quantities.reduce((sum, qty) => sum + qty, 0);

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string
  ) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { label: "Home", id: "hero" },
    { label: "Calendar", id: "experiences" },
    { label: "Community", id: "community" },
    { label: "Tickets", id: "spotlight" },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-stone-800 flex flex-col relative overflow-x-hidden">
      {/* ═══════════════════════════════════════════════════
          SECTION 1: HERO
      ═══════════════════════════════════════════════════ */}
      <section id="hero" className="relative h-[100vh] min-h-[700px] w-full shrink-0 overflow-hidden">
        {/* Parallax background image */}
        <motion.div
          style={{ y: heroY, scale: heroScale }}
          className="absolute inset-0 will-change-transform"
        >
          <img
            src="/images/design3/hero.png"
            className="w-full h-full object-cover"
            alt="Namibian cultural celebration"
          />
        </motion.div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-[#FAFAFA]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20" />

        {/* Navigation */}
        <header className="absolute top-0 left-0 right-0 z-30">
          <div className="flex items-center justify-between px-6 md:px-12 py-6 max-w-7xl mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <Logo dark={true} size="lg" />
            </motion.div>

            {/* Desktop Nav */}
            <motion.nav
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="hidden md:flex gap-10 text-sm font-medium text-stone-300 items-center font-sans uppercase tracking-[0.2em]"
            >
              {navLinks.map((link, i) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={(e) => handleSmoothScroll(e, link.id)}
                  className={`relative py-1 transition-colors duration-300 ${
                    i === 3
                      ? "text-orange-400 font-bold"
                      : "hover:text-white"
                  }`}
                >
                  {link.label}
                  {i === 3 && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-orange-400"
                    />
                  )}
                </a>
              ))}
            </motion.nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white p-2"
            >
              <div className="space-y-1.5">
                <motion.span
                  animate={mobileMenuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                  className="block w-6 h-0.5 bg-white"
                />
                <motion.span
                  animate={mobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                  className="block w-6 h-0.5 bg-white"
                />
                <motion.span
                  animate={mobileMenuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                  className="block w-6 h-0.5 bg-white"
                />
              </div>
            </button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden bg-black/80 backdrop-blur-xl overflow-hidden"
              >
                <div className="flex flex-col items-center gap-6 py-8 font-sans text-sm uppercase tracking-[0.2em]">
                  {navLinks.map((link) => (
                    <a
                      key={link.id}
                      href={`#${link.id}`}
                      onClick={(e) => handleSmoothScroll(e, link.id)}
                      className="text-white/80 hover:text-orange-400 transition-colors"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Hero Content */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-20 pt-16"
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-white/90 font-sans text-sm tracking-wider uppercase">
              Namibia&apos;s Premier Event Platform
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="text-5xl md:text-7xl lg:text-8xl text-white mb-8 font-serif font-medium tracking-wide leading-tight"
          >
            Discover the Heart
            <br />
            <span className="italic font-light text-orange-200">
              of Namibia
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-white/70 font-sans text-lg md:text-xl max-w-2xl mb-10 leading-relaxed"
          >
            Immerse yourself in cultural festivals, artisan markets, and
            unforgettable experiences across Namibia&apos;s most vibrant
            communities.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="flex items-center bg-white/10 backdrop-blur-md rounded-full p-2 w-full max-w-xl border border-white/20 shadow-2xl shadow-black/20"
          >
            <Search className="w-5 h-5 text-white/70 ml-4 shrink-0" />
            <input
              type="text"
              placeholder="Search festivals, markets, gatherings..."
              className="bg-transparent border-none outline-none text-white px-4 py-3 w-full placeholder:text-white/50 font-sans text-sm"
            />
            <button className="bg-orange-500 hover:bg-orange-600 transition-colors text-white font-sans font-bold uppercase tracking-wider text-xs px-6 py-3.5 rounded-full shrink-0">
              Search
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="flex gap-12 mt-14 text-center"
          >
            {[
              { value: "200+", label: "Events" },
              { value: "50K+", label: "Attendees" },
              { value: "14", label: "Regions" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl md:text-3xl font-serif font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-white/50 font-sans text-xs uppercase tracking-[0.2em] mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
        >
          <span className="text-white/40 font-sans text-xs uppercase tracking-[0.3em]">
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-5 h-5 text-white/40" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 2: CURATED EXPERIENCES
      ═══════════════════════════════════════════════════ */}
      <section id="experiences" className="bg-[#FAFAFA] relative z-10">
        <div className="max-w-7xl mx-auto w-full px-6 md:px-12 py-24">
          <SectionFadeIn>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-4">
              <div>
                <div className="text-orange-500 font-sans font-bold uppercase tracking-[0.25em] text-xs mb-3">
                  Curated Experiences
                </div>
                <h2 className="text-4xl md:text-5xl font-serif font-medium text-stone-800 leading-tight">
                  Upcoming Gatherings
                </h2>
              </div>
              <button className="flex items-center gap-2 font-sans font-semibold text-stone-500 hover:text-orange-600 transition-colors uppercase tracking-wider text-sm group">
                Full Calendar
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </SectionFadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {events.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, delay: i * 0.12 }}
                className="group cursor-pointer"
                onClick={() => openEvent(event.id)}
              >
                {/* Image */}
                <div className="w-full aspect-[3/4] overflow-hidden mb-6 relative rounded-sm">
                  <img
                    src={event.img}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  {/* Date badge */}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 text-xs font-sans font-bold tracking-widest shadow-sm rounded-sm">
                    {event.shortDate}
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {/* Hover CTA */}
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                    <span className="text-white font-sans text-sm font-semibold flex items-center gap-2">
                      View Details <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>

                {/* Meta */}
                <div className="text-orange-600 font-sans font-bold text-xs tracking-[0.2em] uppercase mb-2">
                  {event.category}
                </div>
                <h3 className="text-xl md:text-2xl font-serif font-medium text-stone-800 mb-3 group-hover:text-orange-700 transition-colors duration-300">
                  {event.title}
                </h3>
                {/* Expanding underline */}
                <div className="w-12 h-px bg-stone-300 mb-4 group-hover:w-full transition-all duration-700 ease-out" />
                {/* Location */}
                <div className="flex items-center gap-2 text-stone-500 font-sans text-sm mb-3">
                  <MapPin className="w-3.5 h-3.5" />
                  {event.location}
                </div>
                <div className="flex justify-between items-center font-sans">
                  <span className="text-stone-500 text-sm">From</span>
                  <span className="font-bold text-lg text-stone-800">
                    {event.price}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 3: CULTURAL SPOTLIGHT
      ═══════════════════════════════════════════════════ */}
      <section
        id="spotlight"
        className="relative overflow-hidden"
        style={{ backgroundColor: "#FFF7ED" }}
      >
        {/* Subtle repeating pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c2956a' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="max-w-7xl mx-auto w-full px-6 md:px-12 py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Image */}
            <SectionFadeIn>
              <div className="relative">
                <div className="aspect-[4/5] rounded-sm overflow-hidden shadow-2xl">
                  <img
                    src="/images/design3/evt4.png"
                    alt="Namibian Heritage Festival"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Decorative border element */}
                <div className="absolute -bottom-6 -right-6 w-full h-full border-2 border-orange-300/40 rounded-sm -z-10" />
                {/* Floating badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="absolute -top-4 -left-4 bg-orange-500 text-white p-4 rounded-full shadow-xl"
                >
                  <Star className="w-6 h-6" />
                </motion.div>
              </div>
            </SectionFadeIn>

            {/* Right: Content */}
            <SectionFadeIn delay={0.2}>
              <div>
                <div className="text-orange-600 font-sans font-bold uppercase tracking-[0.25em] text-xs mb-4">
                  Cultural Spotlight
                </div>
                <h2 className="text-4xl md:text-5xl font-serif font-medium text-stone-800 mb-6 leading-tight">
                  Namibian Heritage
                  <br />
                  <span className="italic text-orange-700">
                    Festival 2026
                  </span>
                </h2>
                <div className="w-16 h-px bg-orange-400 mb-8" />
                <p className="text-stone-600 font-sans text-lg leading-relaxed mb-6">
                  Experience the vibrant tapestry of Namibian culture at this
                  year&apos;s Heritage Festival — a three-day celebration of
                  traditional music, ancestral dance, artisanal crafts, and
                  authentic cuisine from all 14 regions.
                </p>
                <p className="text-stone-500 font-sans leading-relaxed mb-8">
                  From the rhythmic beats of the Ovambo drums to the intricate
                  beadwork of the San people, every corner of this festival
                  tells a story. Join over 15,000 attendees in celebrating
                  what makes our nation extraordinary.
                </p>

                {/* Event details */}
                <div className="grid grid-cols-2 gap-6 mb-10">
                  {[
                    { icon: Calendar, label: "Date", value: "Sep 24–26, 2026" },
                    { icon: MapPin, label: "Location", value: "Windhoek Showgrounds" },
                    { icon: Clock, label: "Time", value: "10:00 AM – 10:00 PM" },
                    { icon: Ticket, label: "Tickets", value: "From N$40" },
                  ].map((detail) => (
                    <div key={detail.label} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                        <detail.icon className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-xs text-stone-400 font-sans uppercase tracking-widest">
                          {detail.label}
                        </div>
                        <div className="text-stone-800 font-sans font-semibold text-sm">
                          {detail.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-sans font-bold px-10 py-4 rounded-full uppercase tracking-wider text-sm shadow-lg shadow-orange-600/20 transition-colors inline-flex items-center gap-3"
                >
                  Learn More
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </SectionFadeIn>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 4: GALLERY / PHOTO GRID
      ═══════════════════════════════════════════════════ */}
      <section id="gallery" className="bg-[#FAFAFA] relative z-10">
        <div className="max-w-7xl mx-auto w-full px-6 md:px-12 py-24">
          <SectionFadeIn>
            <div className="text-center mb-16">
              <div className="text-orange-500 font-sans font-bold uppercase tracking-[0.25em] text-xs mb-3">
                Gallery
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-medium text-stone-800">
                Moments That Matter
              </h2>
              <p className="text-stone-500 font-sans mt-4 max-w-xl mx-auto">
                A visual journey through Namibia&apos;s most cherished cultural
                moments, landscapes, and celebrations.
              </p>
            </div>
          </SectionFadeIn>

          {/* Masonry grid */}
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {galleryImages.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: i * 0.08 }}
                className="break-inside-avoid group relative overflow-hidden rounded-sm"
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-white font-sans text-sm font-medium">
                    {img.alt}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 5: COMMUNITY VOICES
      ═══════════════════════════════════════════════════ */}
      <section
        id="community"
        className="relative overflow-hidden"
        style={{ backgroundColor: "#FFF7ED" }}
      >
        <div className="max-w-7xl mx-auto w-full px-6 md:px-12 py-24 relative z-10">
          <SectionFadeIn>
            <div className="text-center mb-16">
              <div className="text-orange-500 font-sans font-bold uppercase tracking-[0.25em] text-xs mb-3">
                Community Voices
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-medium text-stone-800">
                Stories from Our People
              </h2>
            </div>
          </SectionFadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, delay: i * 0.15 }}
                className="bg-white rounded-sm p-8 shadow-sm border border-stone-100 relative group hover:shadow-lg transition-shadow duration-500"
              >
                {/* Quote icon */}
                <div className="absolute -top-4 right-8 bg-orange-500 w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                  <Quote className="w-4 h-4 text-white" />
                </div>

                <p className="text-stone-600 font-serif italic text-lg leading-relaxed mb-8">
                  &ldquo;{t.text}&rdquo;
                </p>

                <div className="flex items-center gap-4 pt-6 border-t border-stone-100">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-orange-200"
                  />
                  <div>
                    <div className="font-sans font-bold text-stone-800 text-sm">
                      {t.name}
                    </div>
                    <div className="font-sans text-stone-500 text-xs uppercase tracking-wider">
                      {t.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 6: PARTNERS & SPONSORS
      ═══════════════════════════════════════════════════ */}
      <section id="partners" className="bg-[#FAFAFA] relative z-10">
        <div className="max-w-7xl mx-auto w-full px-6 md:px-12 py-20">
          <SectionFadeIn>
            <div className="text-center mb-12">
              <div className="text-orange-500 font-sans font-bold uppercase tracking-[0.25em] text-xs mb-3">
                Our Partners
              </div>
              <h2 className="text-3xl font-serif font-medium text-stone-800">
                Trusted By Leading Organizations
              </h2>
            </div>
          </SectionFadeIn>

          <SectionFadeIn delay={0.2}>
            <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16">
              {partners.map((logo, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  className="grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                >
                  <img
                    src={logo}
                    alt={`Partner ${i + 1}`}
                    className="h-12 md:h-14 w-auto object-contain"
                  />
                </motion.div>
              ))}
            </div>
          </SectionFadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 7: NEWSLETTER
      ═══════════════════════════════════════════════════ */}
      <section
        id="newsletter"
        className="relative overflow-hidden"
        style={{ backgroundColor: "#292118" }}
      >
        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="max-w-3xl mx-auto w-full px-6 md:px-12 py-24 relative z-10 text-center">
          <SectionFadeIn>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-8"
            >
              <Mail className="w-7 h-7 text-orange-400" />
            </motion.div>

            <h2 className="text-4xl md:text-5xl font-serif font-medium text-white mb-4">
              Join Our Community
            </h2>
            <p className="text-stone-400 font-sans text-lg mb-10 max-w-lg mx-auto">
              Be the first to hear about new events, exclusive offers, and
              stories from Namibia&apos;s cultural heartbeat.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 max-w-lg mx-auto">
              <div className="flex-1 w-full relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full bg-white/10 border border-white/10 rounded-full pl-11 pr-4 py-4 text-white font-sans text-sm placeholder:text-stone-500 outline-none focus:border-orange-500/50 transition-colors"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="bg-orange-500 hover:bg-orange-600 text-white font-sans font-bold px-8 py-4 rounded-full uppercase tracking-wider text-sm transition-colors shrink-0 w-full sm:w-auto flex items-center justify-center gap-2"
              >
                Subscribe
                <Send className="w-4 h-4" />
              </motion.button>
            </div>

            <p className="text-stone-600 font-sans text-xs mt-4">
              No spam, ever. Unsubscribe anytime.
            </p>
          </SectionFadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 8: FOOTER
      ═══════════════════════════════════════════════════ */}
      <footer className="bg-stone-900 text-stone-400 relative z-10">
        <div className="max-w-7xl mx-auto w-full px-6 md:px-12 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            {/* Brand */}
            <div className="md:col-span-1">
              <Logo dark={true} size="lg" />
              <p className="font-sans text-sm mt-6 leading-relaxed text-stone-500">
                Connecting communities through unforgettable cultural
                experiences across Namibia.
              </p>
              <div className="flex gap-4 mt-6">
                {[Globe, Send, Quote].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-stone-500 hover:bg-orange-600 hover:text-white transition-all duration-300"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-sans font-bold text-sm uppercase tracking-[0.2em] mb-6">
                Explore
              </h4>
              <ul className="space-y-3 font-sans text-sm">
                {["All Events", "Cultural Festivals", "Art Markets", "Sports & Nature", "Food & Drink"].map(
                  (link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-stone-500 hover:text-orange-400 transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-sans font-bold text-sm uppercase tracking-[0.2em] mb-6">
                Support
              </h4>
              <ul className="space-y-3 font-sans text-sm">
                {["Help Center", "Contact Us", "Refund Policy", "Accessibility", "Privacy Policy"].map(
                  (link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-stone-500 hover:text-orange-400 transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-sans font-bold text-sm uppercase tracking-[0.2em] mb-6">
                Get in Touch
              </h4>
              <ul className="space-y-4 font-sans text-sm">
                <li className="flex items-center gap-3 text-stone-500">
                  <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                  Windhoek, Namibia
                </li>
                <li className="flex items-center gap-3 text-stone-500">
                  <Phone className="w-4 h-4 text-orange-500 shrink-0" />
                  +264 61 123 4567
                </li>
                <li className="flex items-center gap-3 text-stone-500">
                  <Mail className="w-4 h-4 text-orange-500 shrink-0" />
                  hello@easytickets.na
                </li>
                <li className="flex items-center gap-3 text-stone-500">
                  <Globe className="w-4 h-4 text-orange-500 shrink-0" />
                  www.easytickets.na
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-stone-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-sans text-xs text-stone-600">
              &copy; 2026 Easy Tickets Namibia. All rights reserved.
            </p>
            <div className="flex gap-6 font-sans text-xs text-stone-600">
              <a href="#" className="hover:text-stone-400 transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-stone-400 transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-stone-400 transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════
          BOOKING BOTTOM-SHEET DRAWER
      ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-40"
              onClick={closeEvent}
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-h-[90vh] bg-[#F9F6F1] z-50 rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div
                  className="w-12 h-1.5 bg-stone-300 rounded-full cursor-pointer hover:bg-stone-400 transition-colors"
                  onClick={closeEvent}
                />
              </div>

              {/* Close button */}
              <button
                onClick={closeEvent}
                className="absolute top-5 right-5 z-50 w-10 h-10 bg-white shadow-md rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Step indicators */}
              <div className="flex items-center justify-center gap-2 py-4 shrink-0 px-6">
                {[1, 2, 3, 4].map((step) => (
                  <React.Fragment key={step}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-sans text-xs font-bold transition-all duration-500 ${
                        bookingStep >= step
                          ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                          : "bg-stone-200 text-stone-400"
                      }`}
                    >
                      {bookingStep > step ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        step
                      )}
                    </div>
                    {step < 4 && (
                      <div
                        className={`w-8 md:w-16 h-0.5 transition-colors duration-500 ${
                          bookingStep > step
                            ? "bg-orange-500"
                            : "bg-stone-200"
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Content area */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 md:px-0">
                <div className="max-w-5xl mx-auto w-full pb-8">
                  <AnimatePresence mode="wait">
                    {/* ── STEP 1: EVENT DETAILS ── */}
                    {bookingStep === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.35 }}
                        className="p-2 md:p-6"
                      >
                        {(() => {
                          const ev = events.find(
                            (e) => e.id === selectedEvent
                          );
                          if (!ev) return null;
                          return (
                            <div className="flex flex-col md:flex-row gap-8">
                              {/* Image */}
                              <div className="w-full md:w-5/12 shrink-0">
                                <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
                                  <img
                                    src={ev.img}
                                    alt={ev.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </div>

                              {/* Details */}
                              <div className="w-full md:w-7/12 flex flex-col">
                                <div className="text-orange-600 font-sans font-bold text-xs tracking-[0.2em] uppercase mb-3">
                                  {ev.category}
                                </div>
                                <h2 className="text-3xl md:text-5xl font-serif font-medium text-stone-800 mb-6 leading-tight">
                                  {ev.title}
                                </h2>

                                <div className="flex flex-wrap items-center gap-6 mb-8 border-y border-stone-200 py-6 font-sans">
                                  <div className="flex items-center gap-2 text-stone-600">
                                    <Calendar className="w-4 h-4 text-orange-500" />
                                    <span className="font-semibold text-sm">
                                      {ev.date}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-stone-600">
                                    <MapPin className="w-4 h-4 text-orange-500" />
                                    <span className="font-semibold text-sm">
                                      {ev.location}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-stone-600">
                                    <Clock className="w-4 h-4 text-orange-500" />
                                    <span className="font-semibold text-sm">
                                      10:00 AM
                                    </span>
                                  </div>
                                </div>

                                <div className="flex-1 mb-8">
                                  <p className="text-stone-600 font-sans text-base leading-relaxed mb-4">
                                    {ev.desc}
                                  </p>
                                  <p className="text-stone-500 font-sans text-sm leading-relaxed">
                                    Immerse yourself in a culturally enriching
                                    experience designed to bring communities
                                    together, foster connection, and celebrate
                                    the unique traditions that define our
                                    beautiful nation. This event features live
                                    performances, local cuisine, artisanal
                                    crafts, and guided cultural tours.
                                  </p>
                                </div>

                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => setBookingStep(2)}
                                  className="bg-orange-600 hover:bg-orange-700 text-white font-sans font-bold px-10 py-4 rounded-full uppercase tracking-wider text-sm shadow-lg shadow-orange-600/20 transition-colors w-full md:w-auto inline-flex items-center justify-center gap-3"
                                >
                                  Select Tickets
                                  <ArrowRight className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </div>
                          );
                        })()}
                      </motion.div>
                    )}

                    {/* ── STEP 2: TICKET SELECTION ── */}
                    {bookingStep === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.35 }}
                        className="p-2 md:p-6"
                      >
                        <div className="text-center mb-10">
                          <h2 className="text-3xl md:text-4xl font-serif font-medium text-stone-800 mb-2">
                            Choose Your Experience
                          </h2>
                          <p className="text-stone-500 font-sans">
                            Select your ticket tier and quantity
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                          {ticketTiers.map((tier, idx) => (
                            <motion.div
                              key={tier.name}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className={`relative rounded-2xl p-6 md:p-8 border-2 transition-all duration-300 cursor-pointer ${
                                quantities[idx] > 0
                                  ? "border-orange-500 bg-orange-50/50 shadow-lg shadow-orange-500/10"
                                  : "border-stone-200 bg-white hover:border-orange-300 hover:shadow-md"
                              }`}
                              onClick={() => {
                                if (quantities[idx] === 0)
                                  updateQuantity(idx, 1);
                              }}
                            >
                              {idx === 2 && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white font-sans text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                                  Popular
                                </div>
                              )}

                              <h3 className="font-serif text-2xl font-medium text-stone-800 mb-2">
                                {tier.name}
                              </h3>
                              <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-3xl font-serif font-bold text-orange-600">
                                  N${tier.price}
                                </span>
                                <span className="text-stone-400 font-sans text-sm">
                                  / person
                                </span>
                              </div>

                              <ul className="space-y-3 mb-8">
                                {tier.perks.map((perk) => (
                                  <li
                                    key={perk}
                                    className="flex items-center gap-2 text-stone-600 font-sans text-sm"
                                  >
                                    <Check className="w-4 h-4 text-orange-500 shrink-0" />
                                    {perk}
                                  </li>
                                ))}
                              </ul>

                              {/* Quantity controls */}
                              <div className="flex items-center justify-center gap-4 pt-4 border-t border-stone-100">
                                <motion.button
                                  whileTap={{ scale: 0.85 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(idx, -1);
                                  }}
                                  className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-orange-100 hover:text-orange-600 transition-colors"
                                >
                                  <Minus className="w-4 h-4" />
                                </motion.button>
                                <span className="text-2xl font-serif font-bold text-stone-800 w-8 text-center">
                                  {quantities[idx]}
                                </span>
                                <motion.button
                                  whileTap={{ scale: 0.85 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(idx, 1);
                                  }}
                                  className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-orange-100 hover:text-orange-600 transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        {/* Summary bar */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="font-sans text-stone-600">
                            <span className="font-bold text-stone-800 text-lg">
                              {totalTickets}
                            </span>{" "}
                            ticket{totalTickets !== 1 ? "s" : ""} selected
                            {totalAmount > 0 && (
                              <span className="mx-3 text-stone-300">|</span>
                            )}
                            {totalAmount > 0 && (
                              <span className="font-bold text-orange-600 text-xl">
                                N${totalAmount}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => setBookingStep(1)}
                              className="px-6 py-3 rounded-full border border-stone-300 text-stone-600 font-sans font-semibold text-sm hover:bg-stone-50 transition-colors uppercase tracking-wider"
                            >
                              Back
                            </button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                if (totalTickets > 0) setBookingStep(3);
                              }}
                              disabled={totalTickets === 0}
                              className={`px-8 py-3 rounded-full font-sans font-bold text-sm uppercase tracking-wider transition-all inline-flex items-center gap-2 ${
                                totalTickets > 0
                                  ? "bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20"
                                  : "bg-stone-200 text-stone-400 cursor-not-allowed"
                              }`}
                            >
                              Continue
                              <ArrowRight className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* ── STEP 3: PAYMENT FORM ── */}
                    {bookingStep === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.35 }}
                        className="p-2 md:p-6"
                      >
                        <div className="max-w-2xl mx-auto">
                          <div className="text-center mb-10">
                            <h2 className="text-3xl md:text-4xl font-serif font-medium text-stone-800 mb-2">
                              Payment Details
                            </h2>
                            <p className="text-stone-500 font-sans">
                              Secure checkout powered by Easy Tickets
                            </p>
                          </div>

                          {/* Card mockup */}
                          <motion.div
                            initial={{ rotateY: 15, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            transition={{ duration: 0.6 }}
                            className="relative bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 rounded-2xl p-8 text-white mb-10 shadow-2xl shadow-orange-600/30 overflow-hidden"
                          >
                            {/* Card decorative pattern */}
                            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/4" />

                            <div className="relative z-10">
                              <div className="flex justify-between items-start mb-10">
                                <CreditCard className="w-10 h-10 text-white/80" />
                                <div className="font-sans text-xs text-white/60 uppercase tracking-widest">
                                  Easy Tickets
                                </div>
                              </div>
                              <div className="font-mono text-xl md:text-2xl tracking-[0.15em] mb-8">
                                {cardNumber || "•••• •••• •••• ••••"}
                              </div>
                              <div className="flex justify-between items-end">
                                <div>
                                  <div className="text-xs text-white/50 uppercase tracking-wider mb-1">
                                    Card Holder
                                  </div>
                                  <div className="font-sans font-semibold text-sm">
                                    {cardName || "YOUR NAME"}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-white/50 uppercase tracking-wider mb-1">
                                    Expires
                                  </div>
                                  <div className="font-sans font-semibold text-sm">
                                    {cardExpiry || "MM/YY"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>

                          {/* Form */}
                          <div className="space-y-5">
                            <div>
                              <label className="block font-sans text-xs text-stone-500 uppercase tracking-wider mb-2">
                                Cardholder Name
                              </label>
                              <input
                                type="text"
                                value={cardName}
                                onChange={(e) => setCardName(e.target.value)}
                                placeholder="Full name as on card"
                                className="w-full bg-white border border-stone-200 rounded-xl px-5 py-4 font-sans text-stone-800 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-stone-300"
                              />
                            </div>
                            <div>
                              <label className="block font-sans text-xs text-stone-500 uppercase tracking-wider mb-2">
                                Card Number
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={cardNumber}
                                  onChange={(e) =>
                                    setCardNumber(
                                      e.target.value
                                        .replace(/\D/g, "")
                                        .replace(/(.{4})/g, "$1 ")
                                        .trim()
                                        .slice(0, 19)
                                    )
                                  }
                                  placeholder="1234 5678 9012 3456"
                                  maxLength={19}
                                  className="w-full bg-white border border-stone-200 rounded-xl pl-5 pr-12 py-4 font-sans text-stone-800 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-stone-300 font-mono tracking-wider"
                                />
                                <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                              <div>
                                <label className="block font-sans text-xs text-stone-500 uppercase tracking-wider mb-2">
                                  Expiry Date
                                </label>
                                <input
                                  type="text"
                                  value={cardExpiry}
                                  onChange={(e) =>
                                    setCardExpiry(
                                      e.target.value
                                        .replace(/\D/g, "")
                                        .replace(/^(\d{2})(\d)/, "$1/$2")
                                        .slice(0, 5)
                                    )
                                  }
                                  placeholder="MM/YY"
                                  maxLength={5}
                                  className="w-full bg-white border border-stone-200 rounded-xl px-5 py-4 font-sans text-stone-800 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-stone-300 font-mono tracking-wider"
                                />
                              </div>
                              <div>
                                <label className="block font-sans text-xs text-stone-500 uppercase tracking-wider mb-2">
                                  CVV
                                </label>
                                <div className="relative">
                                  <input
                                    type="password"
                                    value={cardCVV}
                                    onChange={(e) =>
                                      setCardCVV(
                                        e.target.value
                                          .replace(/\D/g, "")
                                          .slice(0, 3)
                                      )
                                    }
                                    placeholder="•••"
                                    maxLength={3}
                                    className="w-full bg-white border border-stone-200 rounded-xl pl-5 pr-12 py-4 font-sans text-stone-800 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-stone-300 font-mono tracking-wider"
                                  />
                                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Order summary */}
                          <div className="bg-white rounded-2xl p-6 mt-8 border border-stone-100 shadow-sm">
                            <h4 className="font-sans font-bold text-stone-800 text-sm uppercase tracking-wider mb-4">
                              Order Summary
                            </h4>
                            {quantities.map(
                              (qty, idx) =>
                                qty > 0 && (
                                  <div
                                    key={idx}
                                    className="flex justify-between items-center py-2 text-sm font-sans"
                                  >
                                    <span className="text-stone-600">
                                      {qty}x {ticketTiers[idx].name}
                                    </span>
                                    <span className="font-semibold text-stone-800">
                                      N${qty * ticketTiers[idx].price}
                                    </span>
                                  </div>
                                )
                            )}
                            <div className="border-t border-stone-100 mt-3 pt-3 flex justify-between items-center">
                              <span className="font-sans font-bold text-stone-800">
                                Total
                              </span>
                              <span className="font-serif font-bold text-2xl text-orange-600">
                                N${totalAmount}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-3 mt-8">
                            <button
                              onClick={() => setBookingStep(2)}
                              className="px-6 py-4 rounded-full border border-stone-300 text-stone-600 font-sans font-semibold text-sm hover:bg-stone-50 transition-colors uppercase tracking-wider"
                            >
                              Back
                            </button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setBookingStep(4)}
                              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-sans font-bold px-8 py-4 rounded-full uppercase tracking-wider text-sm shadow-lg shadow-orange-600/20 transition-colors inline-flex items-center justify-center gap-2"
                            >
                              <Lock className="w-4 h-4" />
                              Pay N${totalAmount}
                            </motion.button>
                          </div>

                          <div className="flex items-center justify-center gap-2 mt-4 text-stone-400 font-sans text-xs">
                            <Lock className="w-3 h-3" />
                            Secured with 256-bit SSL encryption
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* ── STEP 4: SUCCESS ── */}
                    {bookingStep === 4 && (
                      <motion.div
                        key="step4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.5 }}
                        className="p-2 md:p-6"
                      >
                        <div className="max-w-lg mx-auto text-center">
                          {/* Golden checkmark with particles */}
                          <div className="relative w-40 h-40 mx-auto mb-8">
                            {/* Particles */}
                            {Array.from({ length: 24 }).map((_, i) => (
                              <GoldenParticle key={i} index={i} />
                            ))}

                            {/* Glowing ring */}
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{
                                duration: 0.6,
                                ease: "easeOut",
                              }}
                              className="absolute inset-0 rounded-full border-4 border-amber-300/30"
                            />

                            {/* Check circle */}
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 15,
                                delay: 0.2,
                              }}
                              className="absolute inset-4 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-orange-500/40"
                            >
                              <motion.div
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{
                                  delay: 0.5,
                                  duration: 0.5,
                                  ease: "easeOut",
                                }}
                              >
                                <Check className="w-16 h-16 text-white" strokeWidth={3} />
                              </motion.div>
                            </motion.div>
                          </div>

                          <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                            className="text-3xl md:text-4xl font-serif font-medium text-stone-800 mb-3"
                          >
                            Booking Confirmed!
                          </motion.h2>
                          <motion.p
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7, duration: 0.5 }}
                            className="text-stone-500 font-sans mb-10"
                          >
                            Your tickets have been reserved. Check your email
                            for confirmation.
                          </motion.p>

                          {/* Digital Ticket */}
                          <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9, duration: 0.6 }}
                            className="relative bg-white rounded-2xl overflow-hidden shadow-xl border border-stone-100 text-left"
                          >
                            {/* Traditional pattern top border */}
                            <div className="h-3 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />
                            <div
                              className="h-4 w-full opacity-20"
                              style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23c2956a' fill-opacity='1'%3E%3Crect x='0' y='0' width='10' height='10'/%3E%3Crect x='10' y='10' width='10' height='10'/%3E%3C/g%3E%3C/svg%3E")`,
                              }}
                            />

                            <div className="p-6 md:p-8">
                              <div className="flex items-start justify-between mb-6">
                                <div>
                                  <Logo dark={false} size="sm" />
                                </div>
                                <div className="text-right">
                                  <div className="font-sans text-xs text-stone-400 uppercase tracking-wider">
                                    Ticket ID
                                  </div>
                                  <div className="font-mono text-sm text-stone-700 font-bold">
                                    ET-
                                    {Math.random()
                                      .toString(36)
                                      .substring(2, 8)
                                      .toUpperCase()}
                                  </div>
                                </div>
                              </div>

                              {(() => {
                                const ev = events.find(
                                  (e) => e.id === selectedEvent
                                );
                                if (!ev) return null;
                                return (
                                  <>
                                    <h3 className="text-xl font-serif font-medium text-stone-800 mb-4">
                                      {ev.title}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                      <div>
                                        <div className="font-sans text-xs text-stone-400 uppercase tracking-wider mb-1">
                                          Date
                                        </div>
                                        <div className="font-sans font-semibold text-stone-700 text-sm">
                                          {ev.date}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="font-sans text-xs text-stone-400 uppercase tracking-wider mb-1">
                                          Venue
                                        </div>
                                        <div className="font-sans font-semibold text-stone-700 text-sm">
                                          {ev.location}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="font-sans text-xs text-stone-400 uppercase tracking-wider mb-1">
                                          Tickets
                                        </div>
                                        <div className="font-sans font-semibold text-stone-700 text-sm">
                                          {totalTickets}x
                                        </div>
                                      </div>
                                      <div>
                                        <div className="font-sans text-xs text-stone-400 uppercase tracking-wider mb-1">
                                          Amount Paid
                                        </div>
                                        <div className="font-sans font-bold text-orange-600 text-sm">
                                          N${totalAmount}
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}

                              {/* Dotted separator */}
                              <div className="border-t-2 border-dashed border-stone-200 my-4 relative">
                                <div className="absolute -left-12 -top-3.5 w-7 h-7 bg-[#F9F6F1] rounded-full" />
                                <div className="absolute -right-12 -top-3.5 w-7 h-7 bg-[#F9F6F1] rounded-full" />
                              </div>

                              {/* Barcode mockup */}
                              <div className="flex items-center justify-center gap-px py-4">
                                {Array.from({ length: 40 }).map((_, i) => (
                                  <div
                                    key={i}
                                    className="bg-stone-800 rounded-sm"
                                    style={{
                                      width: Math.random() > 0.5 ? 2 : 3,
                                      height: 40,
                                      opacity:
                                        0.6 + Math.random() * 0.4,
                                    }}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Traditional pattern bottom border */}
                            <div
                              className="h-4 w-full opacity-20"
                              style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23c2956a' fill-opacity='1'%3E%3Crect x='0' y='0' width='10' height='10'/%3E%3Crect x='10' y='10' width='10' height='10'/%3E%3C/g%3E%3C/svg%3E")`,
                              }}
                            />
                            <div className="h-3 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />
                          </motion.div>

                          <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={closeEvent}
                            className="mt-8 bg-stone-800 hover:bg-stone-900 text-white font-sans font-bold px-10 py-4 rounded-full uppercase tracking-wider text-sm transition-colors inline-flex items-center gap-2"
                          >
                            Done
                            <Heart className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
