import { Link } from 'react-router-dom';
import { useState } from 'react';
import { HeartHandshake, CalendarCheck2, Wallet, ShieldCheck, Star, Sparkles, Mail, Phone, MapPin, Send } from 'lucide-react';
import { Button, Card, Input, Textarea } from '../components/ui';

const FEATURES = [
  { icon: CalendarCheck2, title: 'Plan events end-to-end', desc: 'Create events, invite guests, track RSVPs and build a minute-by-minute schedule.' },
  { icon: HeartHandshake, title: 'Discover trusted vendors', desc: 'Browse verified caterers, photographers, decorators and more with real reviews.' },
  { icon: ShieldCheck, title: 'Book venues with confidence', desc: 'Compare capacity, facilities and pricing across 10+ cities — availability checked for you.' },
  { icon: Wallet, title: 'Stay on budget', desc: 'Track every expense with category breakdowns and live budget progress.' },
  { icon: Sparkles, title: 'Smart recommendations', desc: 'Get venue & vendor suggestions matched to your event type, city and budget.' },
  { icon: Star, title: 'Real reviews only', desc: 'Reviews can only be written after a completed booking — so ratings you see are earned.' },
];

export const AboutPage = () => (
  <div className="mx-auto max-w-5xl">
    {/* Hero */}
    <section className="py-10 text-center sm:py-16">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3.5 py-1.5 text-xs font-bold text-primary-700">
        <Sparkles size={13} /> India's friendly event planning platform
      </span>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        Every great event starts with
        <span className="text-primary-600"> great planning</span>
      </h1>
      <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-slate-500">
        EventEase brings your entire event together — venues, vendors, guests, schedules and budgets —
        in one beautifully simple place. From intimate birthdays to grand weddings, we help you plan
        less and celebrate more.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link to="/register"><Button size="lg">Start planning free</Button></Link>
        <Link to="/venues"><Button size="lg" variant="outline">Browse venues</Button></Link>
      </div>
    </section>

    {/* Stats strip */}
    <section className="mb-14 grid grid-cols-2 gap-4 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 p-8 text-center text-white sm:grid-cols-4">
      {[
        ['10+', 'Cities covered'],
        ['50+', 'Venues & vendors'],
        ['6', 'Event categories'],
        ['100%', 'Free to use'],
      ].map(([v, l]) => (
        <div key={l}>
          <p className="text-2xl font-extrabold sm:text-3xl">{v}</p>
          <p className="mt-0.5 text-xs text-primary-100 sm:text-sm">{l}</p>
        </div>
      ))}
    </section>

    {/* Features */}
    <h2 className="text-center text-2xl font-extrabold text-slate-900">Why planners love EventEase</h2>
    <div className="mt-8 grid gap-5 pb-16 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map(({ icon: Icon, title, desc }) => (
        <Card key={title} hover className="p-6">
          <span className="inline-flex rounded-xl bg-primary-50 p-3 text-primary-600">
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
    <div className="mx-auto max-w-5xl py-8">
      <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Get in touch</h1>
          <p className="mt-2 leading-relaxed text-slate-500">
            Questions about planning an event, partnering as a vendor, or listing your venue?
            Our team would love to hear from you.
          </p>

          <div className="mt-8 space-y-4">
            {[
              { icon: Mail, label: 'Email us', value: 'hello@eventease.in' },
              { icon: Phone, label: 'Call us', value: '+91 98765 43210' },
              { icon: MapPin, label: 'Visit us', value: 'WeWork Galaxy, Residency Road, Bengaluru 560025' },
            ].map(({ icon: Icon, label, value }) => (
              <Card key={label} className="flex items-center gap-4 p-4">
                <span className="rounded-xl bg-primary-50 p-3 text-primary-600"><Icon size={20} /></span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="font-semibold text-slate-900">{value}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Card className="h-fit p-6">
          {sent ? (
            <div className="py-10 text-center">
              <HeartHandshake size={40} className="mx-auto text-emerald-500" />
              <h2 className="mt-3 text-lg font-bold text-slate-900">Message sent!</h2>
              <p className="mt-1 text-sm text-slate-500">Thanks for reaching out — we'll reply within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <h2 className="font-bold text-slate-900">Send us a message</h2>
              {error && <div role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
              <div className="mt-4 space-y-4">
                <Input id="c-name" label="Your name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                <Input id="c-email" label="Email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                <Textarea id="c-msg" label="Message" required placeholder="How can we help?" value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
                <Button type="submit" className="w-full"><Send size={15} /> Send message</Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
