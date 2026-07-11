import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChatBubble } from "@/components/ChatBubble";
import { BookingFlow } from "@/components/BookingFlow";
import heroShop from "@/assets/hero-shop.jpg";
import test1Img from "@/assets/barber-test1.jpg";
import { Scissors } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

const BARBERS = [
  {
    id: "test1",
    name: "test1",
    role: "Master Barber",
    price: 35000,
    bio: "Fifteen years behind the chair. Precision fades, straight-razor shaves, and the kind of quiet confidence you only get from thousands of haircuts.",
    img: test1Img,
  },
  {
    id: "test2",
    name: "test2",
    role: "Senior Barber",
    price: 25000,
    bio: "Modern textures, sharp lineups, and clean beard work. test2 brings a fresh eye and steady hand — his chair is the one for a bold new look.",
    img: test1Img,
  },
  {
    id: "test3",
    name: "test3",
    role: "Senior Barber",
    price: 25000,
    bio: "Classic scissor cuts and skin fades with a friendly, easy chair-side manner. test3 will make you comfortable before you even sit down.",
    img: test1Img,
  },
];

function Home() {
  const [initialBarber, setInitialBarber] = useState<string>("any");

  return (
    <div className="min-h-screen bg-background text-foreground bg-noise">
      <Nav />
      <Hero />
      <Barbers onBook={(id) => { setInitialBarber(id); document.getElementById("book")?.scrollIntoView({ behavior: "smooth" }); }} />
      <BookingSection initialBarber={initialBarber} />
      <Footer />
      <ChatBubble />
    </div>
  );
}

function Nav() {
  return (
    <nav className="fixed top-0 inset-x-0 z-40 backdrop-blur-md bg-background/70 border-b border-border/50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2 font-display text-xl">
          <Scissors className="h-4 w-4 text-primary" />
          <span>Black-Castle</span>
        </a>
        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#barbers" className="hover:text-foreground transition">Barbers</a>
          <a href="#book" className="hover:text-foreground transition">Book</a>
          <a href="#visit" className="hover:text-foreground transition">Visit</a>
        </div>
        <a href="#book" className="bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded hover:opacity-90 transition">
          Book now
        </a>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section id="top" className="relative min-h-screen flex items-center overflow-hidden pt-16">
      <div className="absolute inset-0">
        <img
          src={heroShop}
          alt="Black-castle barbershop interior lit by amber lamps"
          className="w-full h-full object-cover opacity-40"
          width={1024}
          height={1024}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
      </div>
      <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32">
        <p className="text-primary tracking-[0.3em] text-xs uppercase mb-6">BAGHDAD — SINCE 2022</p>
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[1.05] max-w-4xl">
          A proper chair.<br />
          <span className="text-gradient-ember">Three masters.</span>
        </h1>
        <p className="mt-8 text-lg text-muted-foreground max-w-xl leading-relaxed">
          Book test1, test2, or test3 in under a minute. Skin fades, straight-razor shaves,
          and beard work done the way it's supposed to be done.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <a href="#book" className="bg-primary text-primary-foreground font-medium px-8 py-4 rounded hover:opacity-90 transition shadow-glow">
            Book a chair
          </a>
          <a href="#barbers" className="border border-border px-8 py-4 rounded hover:border-primary/50 transition">
            Meet the barbers
          </a>
        </div>
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg text-sm">
          <Stat k="3+" v="Years crafting cuts" />
          <Stat k="3" v="Master barbers" />
          <Stat k="Sun–Thu" v="10:00 – 22:00" />
        </div>
      </div>
    </section>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="font-display text-3xl text-primary">{k}</div>
      <div className="text-muted-foreground mt-1 text-xs uppercase tracking-wide">{v}</div>
    </div>
  );
}

function Barbers({ onBook }: { onBook: (id: string) => void }) {
  return (
    <section id="barbers" className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-16 max-w-2xl">
          <p className="text-primary tracking-[0.3em] text-xs uppercase mb-4">The Chairs</p>
          <h2 className="font-display text-4xl md:text-5xl">Three barbers. One standard.</h2>
          <div className="divider-ember w-24 mt-6" />
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {BARBERS.map((b) => (
            <article key={b.id} className="group">
              <div className="relative overflow-hidden rounded-lg aspect-[3/4] bg-secondary mb-5">
                <img
                  src={b.img}
                  alt={`Portrait of ${b.name}`}
                  loading="lazy"
                  width={1024}
                  height={1024}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/90 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <div>
                    <h3 className="font-display text-2xl">{b.name}</h3>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{b.role}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-primary font-medium">{b.price.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">IQD</div>
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">{b.bio}</p>
              <button
                onClick={() => onBook(b.id)}
                className="text-sm text-primary hover:text-accent transition inline-flex items-center gap-1 group/link"
              >
                Book with {b.name} <span className="group-hover/link:translate-x-1 transition-transform">→</span>
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BookingSection({ initialBarber }: { initialBarber: string }) {
  return (
    <section id="book" className="py-24 md:py-32 bg-card/40 border-y border-border">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-12 max-w-2xl">
          <p className="text-primary tracking-[0.3em] text-xs uppercase mb-4">Reserve</p>
          <h2 className="font-display text-4xl md:text-5xl">Book your chair.</h2>
          <div className="divider-ember w-24 mt-6" />
          <p className="text-muted-foreground mt-6">
            Real-time availability. Confirmed in seconds. No account required.
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6 md:p-10 shadow-elegant">
          <BookingFlow initialBarber={initialBarber} />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="visit" className="py-16 border-t border-border">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-10">
        <div>
          <div className="flex items-center gap-2 font-display text-2xl mb-3">
            <Scissors className="h-4 w-4 text-primary" /> Black-Castle
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            A modern barbershop rooted in Baghdad craft. Walk-ins welcome, appointments preferred.
          </p>
        </div>
        <div>
          <h4 className="font-display text-lg mb-3">Hours</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>Sunday – Thursday · 10:00 – 22:00</li>
            <li>Friday · Closed</li>
            <li>Saturday · Closed</li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-lg mb-3">Visit</h4>
          <p className="text-sm text-muted-foreground">Iraq/Baghdad/AL-Yarmook</p>
          <p className="text-sm text-muted-foreground mt-1">Chat with the front desk anytime →</p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 mt-12 pt-6 border-t border-border/50 text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
        <span>© {new Date().getFullYear()} Black-Castle Barbershop</span>
        <span>بغداد · Baghdad</span>
      </div>
    </footer>
  );
}
