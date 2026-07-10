import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Home,
  Building2,
  ChefHat,
  BedDouble,
  Briefcase,
  Layers,
  Palette,
  Gem,
  Clock,
  Wallet,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  Clock3,
  Quote,
  House,
  LogIn,
  UserCircle2,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Reveal } from "@/components/Reveal";
import { AIRoomDesigner } from "@/components/AIRoomDesigner";
import { BookingModal } from "@/components/BookingModal";
import { useAuth } from "@/hooks/useAuth";

import heroAsset from "@/assets/hero.jpg.asset.json";
import project1Asset from "@/assets/project-1.jpg.asset.json";
import project2Asset from "@/assets/project-2.jpg.asset.json";
import project3Asset from "@/assets/project-3.jpg.asset.json";
import project4Asset from "@/assets/project-4.jpg.asset.json";
import project5Asset from "@/assets/project-5.jpg.asset.json";
import project6Asset from "@/assets/project-6.jpg.asset.json";
import locationMapAsset from "@/assets/location-map.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Spectra Interior Designing | Dubai Luxury Interiors" },
      { name: "description", content: "Spectra Interior Designing creates luxurious, timeless interiors in Dubai. Residential, commercial, kitchen, bedroom, office design and 3D visualization." },
      { property: "og:title", content: "Spectra Interior Designing | Dubai Luxury Interiors" },
      { property: "og:description", content: "Designing Spaces, Creating Memories. Luxury interior design studio in Dubai, UAE." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: heroAsset.url },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: heroAsset.url },
    ],
  }),
  component: Index,
});

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Services", href: "#services" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "About", href: "#about" },
  { label: "AI Designer", href: "#ai-designer" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];

const services = [
  {
    icon: Home,
    title: "Residential Interior Design",
    description: "Bespoke home interiors that reflect your lifestyle and taste.",
  },
  {
    icon: Building2,
    title: "Commercial Interior Design",
    description: "Elegant spaces that elevate brand identity and customer experience.",
  },
  {
    icon: ChefHat,
    title: "Kitchen Design",
    description: "Functional, beautiful kitchens crafted for modern living.",
  },
  {
    icon: BedDouble,
    title: "Bedroom Design",
    description: "Serene retreats designed for comfort and refined relaxation.",
  },
  {
    icon: Briefcase,
    title: "Office Design",
    description: "Productive workspaces that balance professionalism and warmth.",
  },
  {
    icon: Layers,
    title: "3D Visualization",
    description: "Photorealistic renders that bring your vision to life before build.",
  },
];

const projects = [
  { image: project1Asset.url, title: "Dubai Penthouse Living", category: "Residential" },
  { image: project2Asset.url, title: "Altitude Reception", category: "Commercial" },
  { image: project3Asset.url, title: "Marble Island Kitchen", category: "Kitchen" },
  { image: project4Asset.url, title: "Master Suite Retreat", category: "Bedroom" },
  { image: project5Asset.url, title: "Corporate Headquarters", category: "Office" },
  { image: project6Asset.url, title: "Villa Visualization", category: "3D Render" },
];

const whyUs = [
  {
    icon: Palette,
    title: "Creative Designs",
    description: "Tailored concepts that blend artistry with everyday functionality.",
  },
  {
    icon: Gem,
    title: "Premium Materials",
    description: "Hand-selected finishes and fittings sourced for lasting quality.",
  },
  {
    icon: Clock,
    title: "On-Time Delivery",
    description: "Streamlined project management that respects your schedule.",
  },
  {
    icon: Wallet,
    title: "Affordable Pricing",
    description: "Luxury results with transparent, competitive investment plans.",
  },
];

const testimonials = [
  {
    name: "Aisha Al-Rashid",
    role: "Villa Owner, Dubai Hills",
    text: "Spectra transformed our villa into a sanctuary. Every detail feels intentional and luxurious.",
  },
  {
    name: "Mohammed Khan",
    role: "CEO, Altitude Holdings",
    text: "Their team delivered a stunning office space that impressed our clients and energized our staff.",
  },
  {
    name: "Sarah Williams",
    role: "Homeowner, Palm Jumeirah",
    text: "Professional, creative, and always on time. The 3D visuals made decisions effortless.",
  },
];

const contactInfo = [
  {
    icon: MapPin,
    label: "Address",
    value: "Warehouse 01, Warsan 1 St – behind Dubai Textile City – Warsan First – Dubai International City – Dubai",
    href: "https://www.google.com/maps/dir/?api=1&destination=25.1737642,55.4168449&destination_place_id=ChIJsZAH9ThhXz4RQNgzW07ERiQ",
    target: "_top",
    rel: "noreferrer",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+971 55 135 9965",
    href: "tel:+971551359965",
  },
  {
    icon: Mail,
    label: "Email",
    value: "contact@spectrainterior.ae",
    href: "mailto:contact@spectrainterior.ae",
  },
  {
    icon: Clock3,
    label: "Business Hours",
    value: "Mon – Sat: 9:00 AM – 7:00 PM",
  },
];

function Index() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mapAllowed, setMapAllowed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const { user } = useAuth();
  const openBooking = () => {
    setBookingOpen(true);
    setMobileMenuOpen(false);
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(
        "Warehouse 01, Warsan 1 St – behind Dubai Textile City – Warsan First – Dubai International City – Dubai"
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const hostname = window.location.hostname;
    setMapAllowed(
      hostname.endsWith(".lovable.app") || hostname.endsWith(".lovableproject.com")
    );

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div id="home" className="min-h-screen bg-background">
      {/* Header */}
      <header
        className={`fixed inset-x-0 top-0 z-50 backdrop-blur-md transition-all duration-300 ${
          scrolled
            ? "bg-background/95 shadow-md border-b border-border/60"
            : "bg-background/70 border-b border-transparent"
        }`}
      >
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
            scrolled ? "py-2.5" : "py-4"
          }`}
        >
          <a href="#home" className="flex items-center gap-2.5 group">
            <span
              className={`inline-flex items-center justify-center rounded-md bg-gold/10 text-gold transition-all duration-300 group-hover:bg-gold group-hover:text-charcoal ${
                scrolled ? "h-8 w-8" : "h-10 w-10"
              }`}
            >
              <House size={scrolled ? 16 : 20} strokeWidth={1.75} />
            </span>
            <span className="flex items-baseline gap-1.5">
              <span
                className={`font-display font-semibold tracking-tight text-foreground transition-all duration-300 ${
                  scrolled ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"
                }`}
              >
                Spectra
              </span>
              <span
                className={`hidden sm:inline font-display font-light tracking-tight text-gold transition-all duration-300 ${
                  scrolled ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"
                }`}
              >
                Interior
              </span>
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-gold"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <Link
                to="/projects"
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                <UserCircle2 size={16} /> My Projects
              </Link>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 hover:text-gold"
              >
                <LogIn size={16} /> Sign in
              </Link>
            )}
            <button
              type="button"
              onClick={openBooking}
              className={`inline-flex items-center justify-center rounded-md bg-primary font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/90 ${
                scrolled ? "px-4 py-2 text-sm" : "px-5 py-2.5 text-sm"
              }`}
            >
              Book Consultation
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-muted"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background">
            <nav className="flex flex-col px-4 sm:px-6 lg:px-8 py-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-3 text-base font-medium text-foreground/80 transition-colors hover:text-gold border-b border-border last:border-0"
                >
                  {link.label}
                </a>
              ))}
              <Link
                to={user ? "/projects" : "/auth"}
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 text-base font-medium text-foreground/80 transition-colors hover:text-gold border-b border-border"
              >
                {user ? "My Projects" : "Sign in"}
              </Link>
              <button
                type="button"
                onClick={openBooking}
                className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Book Consultation
              </button>
            </nav>
          </div>
        )}
      </header>


      {/* Hero */}
      <section className="relative flex min-h-[100vh] items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0">
          <img
            src={heroAsset.url}
            alt="Luxury modern interior living room with Dubai skyline"
            className="h-full w-full object-cover"
            width={1920}
            height={1088}
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal/70 via-charcoal/50 to-charcoal/80" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-gold sm:text-sm">
            Luxury Interior Design · Dubai
          </p>
          <h1 className="font-display text-4xl font-medium leading-tight text-cream sm:text-5xl md:text-6xl lg:text-7xl">
            Spectra Interior Designing
          </h1>
          <p className="mx-auto mt-6 max-w-2xl font-display text-xl font-light italic text-cream/90 sm:text-2xl md:text-3xl">
            Designing Spaces, Creating Memories
          </p>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-cream/80 sm:text-base">
            Bespoke interior design for Dubai&apos;s most discerning homes and businesses. Where timeless elegance meets modern sophistication.
          </p>
          <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
            <button
              type="button"
              onClick={openBooking}
              className="inline-flex w-full items-center justify-center rounded-md bg-gold px-8 py-3.5 text-base font-semibold text-charcoal shadow-lg shadow-gold/20 transition-all duration-300 hover:bg-gold-light hover:shadow-xl sm:w-auto sm:text-sm"
            >
              Book a Free Consultation
            </button>
            <a
              href="#portfolio"
              className="inline-flex w-full items-center justify-center rounded-md border border-cream/40 bg-transparent px-8 py-3.5 text-base font-medium text-cream transition-all duration-300 hover:bg-cream/10 sm:w-auto sm:text-sm"
            >
              View Our Work
            </a>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 sm:py-28 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">What We Do</p>
            <h2 className="mt-3 font-display text-3xl text-foreground sm:text-4xl md:text-5xl">
              Our Services
            </h2>
            <p className="mt-4 text-muted-foreground">
              Comprehensive interior design solutions tailored to residential and commercial spaces across Dubai.
            </p>
          </div>

          <div className="mt-14 grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <Reveal key={service.title} delay={i * 80} className="h-full">
                <div className="group flex h-full flex-col rounded-2xl border border-border/70 bg-card p-8 shadow-sm transition-all duration-500 ease-out hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-2xl hover:shadow-charcoal/10">
                  <div className="inline-flex w-fit items-center justify-center rounded-xl bg-muted p-3.5 text-gold transition-all duration-500 group-hover:scale-110 group-hover:bg-gold group-hover:text-charcoal">
                    <service.icon size={28} strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-6 font-display text-xl text-card-foreground">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {service.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio */}
      <section id="portfolio" className="py-20 sm:py-28 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Portfolio</p>
            <h2 className="mt-3 font-display text-3xl text-foreground sm:text-4xl md:text-5xl">
              Featured Projects
            </h2>
            <p className="mt-4 text-muted-foreground">
              A curated selection of our finest residential, commercial, and conceptual interiors.
            </p>
          </div>

          <div className="mt-14 columns-1 gap-5 sm:columns-2 lg:columns-3">
            {projects.map((project, i) => {
              // vary aspect ratios to create true masonry feel
              const ratios = ["aspect-[4/5]", "aspect-[4/3]", "aspect-[3/4]", "aspect-square", "aspect-[4/3]", "aspect-[3/4]"];
              const ratio = ratios[i % ratios.length];
              return (
                <Reveal key={project.title} delay={(i % 3) * 100} className="mb-5 break-inside-avoid">
                  <div className="group relative overflow-hidden rounded-2xl bg-card shadow-md transition-all duration-500 hover:shadow-2xl hover:shadow-charcoal/20">
                    <div className={`${ratio} overflow-hidden`}>
                      <img
                        src={project.image}
                        alt={project.title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      />
                    </div>
                    {/* Always-visible gradient on mobile, hover on desktop */}
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/20 to-transparent opacity-100 transition-opacity duration-500 md:opacity-0 md:group-hover:opacity-100" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 translate-y-0 opacity-100 transition-all duration-500 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{project.category}</p>
                      <h3 className="mt-1 font-display text-lg text-cream sm:text-xl">{project.title}</h3>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 sm:py-28 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="relative">
              <div className="relative overflow-hidden rounded-xl">
                <img
                  src={project1Asset.url}
                  alt="Spectra Interior Designing modern living room project"
                  loading="lazy"
                  className="h-full w-full object-cover"
                  width={944}
                  height={704}
                />
              </div>
              <div className="absolute -bottom-6 -right-6 hidden rounded-xl bg-primary p-6 text-primary-foreground shadow-xl lg:block">
                <p className="font-display text-4xl font-medium">12+</p>
                <p className="text-sm opacity-90">Years of Experience</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">About Us</p>
              <h2 className="mt-3 font-display text-3xl text-foreground sm:text-4xl md:text-5xl">
                Crafting Luxury Interiors in Dubai
              </h2>
              <p className="mt-6 text-muted-foreground leading-relaxed">
                Spectra Interior Designing is a Dubai-based studio dedicated to creating spaces that inspire. From intimate residences to landmark commercial interiors, we blend creativity, craftsmanship, and meticulous attention to detail.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Our design philosophy is simple: every space should tell a story. We listen carefully, plan thoughtfully, and deliver environments that are as functional as they are beautiful — always on time and within budget.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3">
                <div>
                  <p className="font-display text-3xl font-medium text-gold">150+</p>
                  <p className="text-sm text-muted-foreground">Projects Completed</p>
                </div>
                <div>
                  <p className="font-display text-3xl font-medium text-gold">12+</p>
                  <p className="text-sm text-muted-foreground">Years Experience</p>
                </div>
                <div>
                  <p className="font-display text-3xl font-medium text-gold">40+</p>
                  <p className="text-sm text-muted-foreground">Design Awards</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="why-us" className="py-20 sm:py-28 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Why Spectra</p>
            <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl md:text-5xl">
              Why Choose Us
            </h2>
            <p className="mt-4 text-cream/70">
              We combine design excellence with dependable service to deliver interiors that exceed expectations.
            </p>
          </div>

          <div className="mt-14 grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyUs.map((item, i) => (
              <Reveal key={item.title} delay={i * 80} className="h-full">
                <div className="flex h-full flex-col rounded-2xl border border-cream/10 bg-cream/5 p-6 transition-all duration-500 hover:-translate-y-1 hover:border-gold/40 hover:bg-cream/10 hover:shadow-xl hover:shadow-black/20">
                  <div className="inline-flex w-fit items-center justify-center rounded-full bg-gold/20 p-3 text-gold">
                    <item.icon size={26} strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-5 font-display text-lg text-cream">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-cream/70">
                    {item.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <AIRoomDesigner />

      {/* Testimonials */}
      <section id="testimonials" className="py-20 sm:py-28 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Client Stories</p>
            <h2 className="mt-3 font-display text-3xl text-foreground sm:text-4xl md:text-5xl">
              Testimonials
            </h2>
          </div>

          <div className="mt-14 grid items-stretch gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, i) => (
              <Reveal key={testimonial.name} delay={i * 100} className="h-full">
                <div className="relative flex h-full flex-col rounded-2xl border border-border bg-card p-8 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-charcoal/10">
                  <Quote className="absolute top-6 right-6 text-gold/20" size={40} />
                  <p className="relative z-10 flex-1 text-card-foreground leading-relaxed">
                    &ldquo;{testimonial.text}&rdquo;
                  </p>
                  <div className="mt-6 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted font-display text-lg text-gold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-display text-base text-card-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 sm:py-28 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Get in Touch</p>
            <h2 className="mt-3 font-display text-3xl text-foreground sm:text-4xl md:text-5xl">
              Contact Us
            </h2>
            <p className="mt-4 text-muted-foreground">
              Ready to transform your space? Book your free consultation today.
            </p>
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            <div className="grid gap-6 sm:grid-cols-2">
              {contactInfo.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-border bg-card p-6 transition-all hover:border-gold/30"
                >
                  <div className="inline-flex items-center justify-center rounded-full bg-muted p-2.5 text-gold">
                    <item.icon size={22} strokeWidth={1.5} />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-muted-foreground">{item.label}</p>
                  {item.href ? (
                    <a
                      href={item.href}
                      target={item.target || undefined}
                      rel={item.rel || undefined}
                      className="mt-1 block font-display text-lg text-card-foreground transition-colors hover:text-gold"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="mt-1 font-display text-lg text-card-foreground">
                      {item.value}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
              <h3 className="font-display text-2xl text-card-foreground">Book a Free Consultation</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Fill in your details and our team will reach out within 24 hours.
              </p>
              <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-card-foreground">
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      className="mt-1 w-full rounded-md border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-card-foreground">
                      Phone
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="Your phone number"
                      className="mt-1 w-full rounded-md border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-card-foreground">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Your email address"
                    className="mt-1 w-full rounded-md border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-card-foreground">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    placeholder="Tell us about your project"
                    className="mt-1 w-full rounded-md border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center rounded-md bg-gold px-6 py-3 text-sm font-semibold text-charcoal transition-colors hover:bg-gold-light"
                >
                  Send Inquiry
                </button>
              </form>
            </div>
          </div>

          {/* Map */}
          <Reveal className="mt-12">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:border-gold/30 hover:shadow-xl">
              <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
                {mapAllowed ? (
                  <iframe
                    title="Spectra Interior Designing location on Google Maps"
                    src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY}&q=place_id:ChIJsZAH9ThhXz4RQNgzW07ERiQ&zoom=15&maptype=roadmap`}
                    className="absolute inset-0 h-full w-full border-0"
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <a
                    href="https://www.google.com/maps/dir/?api=1&destination=25.1737642,55.4168449&destination_place_id=ChIJsZAH9ThhXz4RQNgzW07ERiQ"
                    target="_top"
                    rel="noreferrer"
                    className="group relative block h-full w-full overflow-hidden"
                  >
                    <img
                      src={locationMapAsset.url}
                      alt="Map showing Warehouse 01, Warsan 1 St, Dubai International City"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                      width={1200}
                      height={600}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-charcoal/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                      <div className="inline-flex items-center gap-2 rounded-md bg-gold px-4 py-2 text-sm font-semibold text-charcoal transition-colors group-hover:bg-gold-light">
                        <MapPin size={16} />
                        Open in Google Maps
                      </div>
                    </div>
                  </a>
                )}
              </div>
              <div className="flex flex-col items-start justify-between gap-4 border-t border-border px-6 py-5 sm:flex-row sm:items-center">
                <div>
                  <p className="font-display text-lg text-card-foreground">Visit Our Studio</p>
                  <p className="text-sm text-muted-foreground">Warehouse 01, Warsan 1 St, Dubai International City</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="https://www.google.com/maps/dir/?api=1&destination=25.1737642,55.4168449&destination_place_id=ChIJsZAH9ThhXz4RQNgzW07ERiQ"
                    target="_top"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-md bg-gold px-4 py-2 text-sm font-semibold text-charcoal transition-colors hover:bg-gold-light"
                  >
                    <MapPin size={16} />
                    Open in Google Maps
                  </a>
                  <button
                    type="button"
                    onClick={copyAddress}
                    className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {copied ? "Copied!" : "Copy Address"}
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-8 text-center sm:flex-row sm:text-left">
            <div>
              <p className="font-display text-xl text-foreground">
                Spectra Interior Designing
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Designing Spaces, Creating Memories
              </p>
            </div>

            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/spectra_technical_services/"
                target="_blank"
                rel="noreferrer"
                aria-label="Follow Spectra on Instagram"
                className="inline-flex items-center justify-center rounded-full border border-border bg-background p-3 text-foreground transition-all duration-300 hover:border-gold/40 hover:text-gold hover:shadow-md"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/Spectratechnicalservices"
                target="_blank"
                rel="noreferrer"
                aria-label="Follow Spectra on Facebook"
                className="inline-flex items-center justify-center rounded-full border border-border bg-background p-3 text-foreground transition-all duration-300 hover:border-gold/40 hover:text-gold hover:shadow-md"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>
                Spectra Interior Designing · Built at London International
              </p>
              <p>
                <a href="https://lisrc.ae" className="transition-colors hover:text-gold">lisrc.ae</a>
                {" · by Rashneema Ameen"}
              </p>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Spectra Interior Designing. All rights reserved.
          </div>
        </div>
      </footer>
      <a
        href="https://wa.me/971551359965"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-300 hover:scale-110 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </a>
      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </div>
  );
}
