import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, Loader2 } from "lucide-react";

type Barber = { id: string; name_en: string; name_ar?: string; price_iqd?: number };
type Slot = { time?: string; start?: string; startTime?: string };

const nextDays = (n: number) => {
  const out: Date[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    out.push(d);
  }
  return out;
};

const fmtDay = (d: Date) => d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

export function BookingFlow({ initialBarber }: { initialBarber?: string }) {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [barber, setBarber] = useState<string>(initialBarber || "any");
  const [day, setDay] = useState<Date | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const days = useMemo(() => nextDays(14), []);

  useEffect(() => {
    supabase.functions.invoke("get-services").then(({ data }) => {
      if (data?.barbers) setBarbers(data.barbers);
    });
  }, []);

  useEffect(() => { setSlot(null); }, [barber, day]);

  useEffect(() => {
    if (!day) return;
    setLoadingSlots(true);
    setError(null);
    const from = new Date(day); from.setHours(0, 0, 0, 0);
    const to = new Date(day); to.setHours(23, 59, 59, 999);
    supabase.functions
      .invoke(`get-availability?service=haircut&barber=${barber}&date_from=${from.toISOString()}&date_to=${to.toISOString()}`, {
        method: "GET" as never,
      })
      .then(({ data, error }) => {
        if (error) { setError(error.message); setSlots([]); return; }
        if ((data as { error?: string })?.error) { setError((data as { error: string }).error); setSlots([]); return; }
        const raw: Slot[] = (data as { slots?: Slot[] })?.slots || [];
        const times = raw.map((s) => (typeof s === "string" ? s : s.time || s.start || s.startTime)).filter(Boolean) as string[];
        setSlots(times);
      })
      .finally(() => setLoadingSlots(false));
  }, [day, barber]);

  async function book() {
    if (!slot || !name.trim() || !phone.trim()) return;
    setBooking(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("book-appointment", {
        body: {
          service: "haircut",
          barber,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          start_time: slot,
        },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setConfirmation((data as { booking_id?: string })?.booking_id || "confirmed");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Booking failed";
      setError(msg);
    } finally {
      setBooking(false);
    }
  }

  if (confirmation) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
          <Check className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-display text-3xl mb-3">You're in the chair.</h3>
        <p className="text-muted-foreground mb-2">Confirmation #{String(confirmation).slice(0, 8)}</p>
        <p className="text-muted-foreground">See you {day && fmtDay(day)} at {slot && fmtTime(slot)}.</p>
        <button
          onClick={() => { setConfirmation(null); setSlot(null); setName(""); setPhone(""); }}
          className="mt-8 text-sm text-primary underline underline-offset-4"
        >
          Book another
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Step 1: Barber */}
      <div>
        <StepLabel n={1} title="Choose your barber" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {barbers.map((b) => (
            <button
              key={b.id}
              onClick={() => setBarber(b.id)}
              className={`p-4 rounded border text-left transition ${
                barber === b.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <div className="font-display text-lg">{b.name_en}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {b.price_iqd ? `${b.price_iqd.toLocaleString()} IQD` : "Round robin"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Day */}
      <div>
        <StepLabel n={2} title="Pick a day" />
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
          {days.map((d) => {
            const active = day?.toDateString() === d.toDateString();
            return (
              <button
                key={d.toISOString()}
                onClick={() => setDay(d)}
                className={`flex-shrink-0 snap-start w-20 py-3 rounded border text-center transition ${
                  active ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  {d.toLocaleDateString(undefined, { weekday: "short" })}
                </div>
                <div className="font-display text-xl mt-1">{d.getDate()}</div>
                <div className="text-[10px] text-muted-foreground uppercase">
                  {d.toLocaleDateString(undefined, { month: "short" })}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 3: Slots */}
      {day && (
        <div>
          <StepLabel n={3} title="Pick a time" />
          {loadingSlots ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading availability…
            </div>
          ) : slots.length === 0 ? (
            <div className="text-muted-foreground text-sm">
              {error ? `Couldn't load slots: ${error}` : "No open slots that day. Try another."}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {slots.map((s) => (
                <button
                  key={s}
                  onClick={() => setSlot(s)}
                  className={`py-2 rounded border text-sm transition ${
                    slot === s ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  {fmtTime(s)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 4: Details */}
      {slot && (
        <div>
          <StepLabel n={4} title="Your details" />
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="bg-input rounded px-4 py-3 outline-none focus:ring-1 focus:ring-ring"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              type="tel"
              className="bg-input rounded px-4 py-3 outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          {error && <p className="text-destructive text-sm mt-3">{error}</p>}
          <button
            onClick={book}
            disabled={!name.trim() || !phone.trim() || booking}
            className="mt-5 w-full sm:w-auto bg-primary text-primary-foreground font-medium px-8 py-3 rounded hover:opacity-90 disabled:opacity-50 transition inline-flex items-center gap-2"
          >
            {booking && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm booking
          </button>
        </div>
      )}
    </div>
  );
}

function StepLabel({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="h-7 w-7 rounded-full border border-primary text-primary text-xs flex items-center justify-center font-medium">
        {n}
      </span>
      <h3 className="font-display text-2xl">{title}</h3>
    </div>
  );
}
