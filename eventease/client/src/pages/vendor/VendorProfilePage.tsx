import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';
import { vendorApi, getErrorMessage } from '../../services/api';
import type { Vendor } from '../../types';
import { Button, Input, Select, Textarea, LoadingSpinner, ErrorBanner, Card } from '../../components/ui';
import { VENDOR_CATEGORIES, INDIAN_CITIES } from '../../utils/constants';

export const VendorProfilePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    businessName: '', category: '', description: '',
    location: '', startingPrice: '', phone: '', email: '',
  });

  useEffect(() => {
    vendorApi
      .myProfile()
      .then((res) => {
        const v = (res.data.data as { vendor?: Vendor } | null)?.vendor ?? null;
        if (v) {
          setExists(true);
          setForm({
            businessName: v.businessName,
            category: v.category,
            description: v.description ?? '',
            location: v.location,
            startingPrice: String(v.startingPrice ?? ''),
            phone: v.phone ?? '',
            email: v.email ?? '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!form.businessName.trim()) return setError('Business name is required');
    if (!form.category) return setError('Please choose a category');
    if (!form.location.trim()) return setError('City is required');
    const price = Number(form.startingPrice);
    if (!price || price <= 0) return setError('Starting price must be greater than zero');
    if (!form.phone.trim()) return setError('Phone number is required');
    setSaving(true); setError('');
    try {
      const body = {
        businessName: form.businessName,
        category: form.category,
        description: form.description,
        location: form.location,
        startingPrice: price,
        phone: form.phone,
        email: form.email,
      };
      await (exists ? vendorApi.updateMyProfile(body) : vendorApi.createProfile(body));
      navigate('/vendor');
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner full label="Loading profile…" />;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold text-slate-900">{exists ? 'Edit' : 'Create'} business profile</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">
        This is what customers see. New profiles are reviewed by admins before going live.
      </p>

      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      <Card className="p-6">
        <div className="space-y-4">
          <Input id="vp-name" label="Business name" required value={form.businessName} onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))} placeholder="e.g. Sharma Caterers" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="vp-cat"
              label="Category"
              placeholder="Choose a category"
              options={VENDOR_CATEGORIES.map((c) => ({ value: c, label: c }))}
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
            <Select
              id="vp-city"
              label="City"
              placeholder="Choose your city"
              options={INDIAN_CITIES.map((c) => ({ value: c, label: c }))}
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            />
          </div>
          <Textarea
            id="vp-desc"
            label="About your business"
            rows={4}
            placeholder="Describe your services, experience and what makes you special…"
            hint={`${form.description.length}/1000`}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value.slice(0, 1000) }))}
          />
          <Input id="vp-price" label="Starting price (₹)" type="number" min={1} required placeholder="e.g. 15000" value={form.startingPrice} onChange={(e) => setForm((f) => ({ ...f, startingPrice: e.target.value }))} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="vp-phone" label="Contact phone" required placeholder="+91 …" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            <Input id="vp-email" label="Contact email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>

          <Button onClick={save} loading={saving}><Save size={15} /> {exists ? 'Save changes' : 'Create profile'}</Button>
        </div>
      </Card>
    </div>
  );
};
