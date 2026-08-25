import { Link } from 'react-router-dom';
import { useState } from 'react';
import { HeartHandshake, CalendarCheck2, Wallet, ShieldCheck, Star, Sparkles, Mail, Phone, MapPin, Send, IndianRupee, Gem, Flame } from 'lucide-react';
import { Button, Card, Input, Textarea } from '../components/ui';

const FEATURES = [
  { icon: CalendarCheck2, title: 'Plan events end-to-end', desc: 'Create events, invite guests, track RSVPs and build a minute-by-minute schedule — from Mehendi to Reception.' },
  { icon: HeartHandshake, title: 'Discover trusted vendors', desc: 'Browse verified caterers, photographers, decorators and more with real reviews from Indian families.' },
  { icon: ShieldCheck, title: 'Book venues with confidence', desc: 'Compare capacity, facilities and pricing across 20+ Indian cities — availability checked for you.' },
  { icon: Wallet, title: 'Stay on budget in ₹', desc: 'Track every expense with category breakdowns and live budget progress — all in Indian Rupees.' },
  { icon: Gem, title: 'Smart recommendations', desc: 'Get venue & vendor suggestions matched to your event type, city and budget with AI-powered matching.' },
  { icon: Flame, title: 'Festival celebrations', desc: 'Plan Diwali, Holi, Ganesh Chaturthi and more with festival-specific vendor categories and venues.' },
  { icon: Star, title: 'Real reviews only', desc: 'Reviews can only be written after a completed booking — so ratings you see are genuinely earned.' },
  { icon: IndianRupee, title: 'Transparent pricing', desc: 'See all costs upfront in ₹ — no hidden charges, no surprises. Compare quotes side by side.' },
];

export const AboutPage = () => (
  <div className="mx-auto max-w-5xl">
    {/* Hero */}
    <section className="relative overflow-hidden py-10 text-center sm:py-16">
      <div className="pointer-events-none absolute -top-20 right-0 h-60 w-60 rounded-full bg-primary-100/30 blur-3xl" aria-hidden />
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary-50 to-saffron-50 px-3.5 py-1.5 text-xs font-bold text-primary-700 ring-1 ring-primary-200">
        <Sparkles size={13} /> 🇮🇳 India's friendly event planning platform
      </span>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        Every great Indian celebration starts with
        <span className="bg-gradient-to-r from-primary-600 to-saffron-500 bg-clip-text text-transparent"> great planning</span>
      </h1>
      <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-slate-500">
        EventEase brings your entire celebration together — venues, vendors, guests, schedules and budgets —
        in one beautifully simple place. From intimate birthdays to grand Indian weddings,
        from Diwali gatherings to corporate events, we help you plan less and celebrate more.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link to="/register"><Button size="lg">Start planning free</Button></Link>
        <Link to="/venues"><Button size="lg" variant="outline">Browse venues</Button></Link>
      </div>
    </section>

    {/* Stats strip */}
    <section className="mb-14 grid grid-cols-2 gap-4 rounded-2xl bg-gradient-to-r from-primary-600 via-primary-500 to-saffron-500 p-8 text-center text-white sm:grid-cols-4">
      {[
        ['20+', 'Indian cities'],
        ['50+', 'Venues & vendors'],
        ['14', 'Event categories'],
        ['100%', 'Free to use'],
      ].map(([v, l]) => (
        <div key={l}>
          <p className="text-2xl font-extrabold sm:text-3xl">{v}</p>
          <p className="mt-0.5 text-xs text-primary-100 sm:text-sm">{l}</p>
        </div>
      ))}
    </section>

    {/* Features */}
    <h2 className="text-center text-2xl font-extrabold text-slate-900">Why Indian families love EventEase</h2>
    <div className="mt-8 grid gap-5 pb-16 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map(({ icon: Icon, title, desc }) => (
        <Card key={title} hover className="p-6 rangoli-corner">
          <span className="inline-flex rounded-xl bg-gradient-to-br from-primary-50 to-saffron-50 p-3 text-primary-600">
            <Icon size={22} />
          </span>
          <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{desc}</p>
        </Card>
      ))}
    </div>
  </div>
);

/* ---------------- CONTACT ---------------- */
export const ContactPage = () => {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || form.message.trim().length < 10)
      return setError('Please fill in all fields (message min 10 chars).');
    setError('');
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-4xl py-10 sm:py-16">
      <section className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3.5 py-1.5 text-xs font-bold text-primary-700">
          <Mail size={13} /> Get in touch
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          We'd love to <span className="text-primary-600">hear from you</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl leading-relaxed text-slate-500">
          Have a question about planning your next event? Need help getting started? Reach out and our team will respond within 24 hours.
        </p>
      </section>

      <div className="mt-10 grid gap-8 sm:grid-cols-3">
        {[
          { icon: Mail, label: 'Email', value: 'support@eventease.in', href: 'mailto:support@eventease.in' },
          { icon: Phone, label: 'Phone', value: '+91 98765 43210', href: 'tel:+919876543210' },
          { icon: MapPin, label: 'Office', value: 'Bangalore, India', href: '#' },
        ].map(({ icon: Icon, label, value, href }) => (
          <a key={label} href={href} className="card-base flex flex-col items-center gap-3 p-6 text-center transition hover:-translate-y-0.5 hover:shadow-card-hover">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <Icon size={20} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">{value}</p>
            </div>
          </a>
        ))}
      </div>

      <Card className="mx-auto mt-10 max-w-xl p-6 sm:p-8 rangoli-corner">
        {sent ? (
          <div className="py-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Send size={24} />
            </span>
            <p className="mt-4 text-lg font-extrabold text-slate-900">Message sent!</p>
            <p className="mt-1 text-sm text-slate-500">We'll get back to you within 24 hours. Thank you!</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Send us a message</h2>
            {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">{error}</div>}
            <Input id="c-name" label="Your name" required placeholder="Priya Sharma" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input id="c-email" label="Email" type="email" required placeholder="priya@example.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <Textarea id="c-msg" label="Your message" required rows={5} placeholder="Tell us about your event or question…" value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
            <div className="flex justify-end"><Button type="submit"><Send size={15} /> Send message</Button></div>
          </form>
        )}
      </Card>
    </div>
  );
};
