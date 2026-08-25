import { useEffect, useState, useCallback } from 'react';
import { Plus, Package, Trash2, Pencil } from 'lucide-react';
import { serviceApi, vendorApi, getErrorMessage } from '../../services/api';
import type { Service } from '../../types';
import { Button, Input, Select, Textarea, Modal, ConfirmDialog, EmptyState, ErrorBanner, LoadingSpinner, Badge, Card } from '../../components/ui';
import { formatCurrency } from '../../utils/format';
import { VENDOR_CATEGORIES } from '../../utils/constants';

export const VendorServicesPage = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ name: '', description: '', category: 'Catering', price: '', pricingType: 'Fixed' });

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([serviceApi.mine(), vendorApi.myProfile()])
      .then(([sRes, vRes]) => {
        setServices(sRes.data.data.services as Service[]);
        const v = (vRes.data.data as { vendor?: { category?: string } } | null)?.vendor ?? null;
        if (v?.category) setForm((f) => ({ ...f, category: v.category as string }));
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm((f) => ({ ...f, name: '', description: '', price: '', pricingType: 'Fixed' }));
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({
      name: s.name,
      description: s.description ?? '',
      category: s.category,
      price: String(s.price),
      pricingType: s.pricingType,
    });
    setFormError('');
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return setFormError('Service name is required');
    const price = Number(form.price);
    if (!price || price <= 0) return setFormError('Price must be greater than zero');
    setSaving(true); setFormError('');
    try {
      const body = { name: form.name, description: form.description, category: form.category, price, pricingType: form.pricingType, duration: '' };
      if (editing) await serviceApi.update(editing._id, body);
      else await serviceApi.create(body);
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    await serviceApi.remove(deleteTarget._id).catch(() => {});
    setDeleteTarget(null);
    load();
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Services</h1>
          <p className="mt-1 text-sm text-slate-500">What customers can book from you</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> Add service</Button>
      </div>

      {error && <div className="mb-4"><ErrorBanner message={error} onRetry={load} /></div>}

      {loading ? (
        <LoadingSpinner full label="Loading services…" />
      ) : services.length === 0 ? (
        <EmptyState icon={Package} title="No services yet" message="Add the packages you offer so customers can book you." action={<Button onClick={openCreate}><Plus size={15} /> Add first service</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {services.map((s) => (
            <Card key={s._id} hover className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Badge color="indigo">{s.category}</Badge>
                  <h3 className="mt-2 font-bold text-slate-900">{s.name}</h3>
                </div>
                <p className="shrink-0 text-lg font-extrabold text-primary-700">
                  {formatCurrency(s.price)}
                  <span className="block text-right text-[11px] font-medium text-slate-400">{s.pricingType}</span>
                </p>
              </div>
              {s.description && <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-500">{s.description}</p>}
              <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                <Button size="sm" variant="outline" onClick={() => openEdit(s)}><Pencil size={13} /> Edit</Button>
                <Button size="sm" variant="ghost" className="!text-red-600 hover:!bg-red-50" onClick={() => setDeleteTarget(s)} aria-label={`Delete ${s.name}`}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit service' : 'Add service'}>
        <div className="space-y-4">
          {formError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">{formError}</div>}
          <Input id="sv-name" label="Service name" required placeholder="e.g. Premium Veg Catering (100 guests)" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Select id="sv-cat" label="Category" options={VENDOR_CATEGORIES.map((c) => ({ value: c, label: c }))} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          <Textarea id="sv-desc" label="Description" rows={3} placeholder="What's included in this package?" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="sv-price" label="Price (₹)" type="number" min={1} required placeholder="e.g. 25000" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
            <Select
              id="sv-unit"
              label="Pricing unit"
              options={['per event', 'per plate', 'per hour', 'per day'].map((u) => ({ value: u, label: u }))}
              value={form.pricingType}
              onChange={(e) => setForm((f) => ({ ...f, pricingType: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Save changes' : 'Add service'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete service?" message={`"${deleteTarget?.name}" will no longer be bookable by customers.`} confirmLabel="Delete" danger onConfirm={remove} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
};
