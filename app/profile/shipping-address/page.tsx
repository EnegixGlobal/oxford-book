'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Address = {
  _id?: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault?: boolean;
};

export default function ShippingAddressPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState<Address>({ fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '' });
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/profile/addresses', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const json = await res.json();
      if (json?.success) setAddresses(json.data || []);
    } catch {}
  };

  useEffect(() => { fetchAddresses(); }, []);

  const save = async () => {
    try {
      let res: Response;
      if (editingId) {
        // Update existing address
        res = await fetch(`/api/profile/addresses?id=${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ ...form, isDefault: setAsDefault })
        });
      } else {
        // Create new address
        res = await fetch('/api/profile/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ ...form, isDefault: setAsDefault })
        });
      }
      const json = await res.json();
      if (json?.success) {
        toast.success(editingId ? 'Address updated' : 'Address saved');
        setForm({ fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '' });
        setSetAsDefault(false);
        setEditingId(null);
        fetchAddresses();
      } else {
        toast.error(json?.message || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save');
    }
  };

  const makeDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/profile/addresses?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ isDefault: true }) });
      const json = await res.json();
      if (json?.success) {
        toast.success('Default address updated');
        fetchAddresses();
      } else toast.error(json?.message || 'Failed to update');
    } catch { toast.error('Failed to update'); }
  };

  const remove = async (id: string) => {
    try {
      const res = await fetch(`/api/profile/addresses?id=${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const json = await res.json();
      if (json?.success) { toast.success('Address deleted'); fetchAddresses(); }
      else toast.error(json?.message || 'Failed to delete');
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold mb-4">Saved Addresses</h2>
        {addresses.length === 0 ? (
          <p className="text-gray-500 text-sm sm:text-base">No addresses saved yet.</p>
        ) : (
          <div className="space-y-3">
            {addresses.map((a) => (
              <div key={a._id} className={`border rounded p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between ${a.isDefault ? 'border-purple-400 bg-purple-50' : 'border-gray-200'}`}>
                <div className="min-w-0 flex-1">
                  <div className="font-medium break-words text-sm sm:text-base">{a.fullName}</div>
                  <div className="mt-2 grid grid-cols-1 text-xs sm:text-sm gap-y-1">
                    <div className="flex gap-2"><span className="text-gray-500 w-20 shrink-0">Phone:</span><span className="text-gray-700 break-words">{a.phone}</span></div>
                    <div className="flex gap-2"><span className="text-gray-500 w-20 shrink-0">Address:</span><span className="text-gray-700 break-words">{a.line1}</span></div>
                    {a.line2 && <div className="flex gap-2"><span className="text-gray-500 w-20 shrink-0">Address 2:</span><span className="text-gray-700 break-words">{a.line2}</span></div>}
                    <div className="flex gap-2"><span className="text-gray-500 w-20 shrink-0">City:</span><span className="text-gray-700">{a.city}</span></div>
                    <div className="flex gap-2"><span className="text-gray-500 w-20 shrink-0">State:</span><span className="text-gray-700">{a.state}</span></div>
                    <div className="flex gap-2"><span className="text-gray-500 w-20 shrink-0">PIN:</span><span className="text-gray-700">{a.postalCode}</span></div>
                  </div>
                  {a.isDefault && <div className="text-[10px] sm:text-xs text-purple-700 font-semibold mt-2">Default</div>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditingId(a._id!); setForm({ fullName: a.fullName, phone: a.phone, line1: a.line1, line2: a.line2, city: a.city, state: a.state, postalCode: a.postalCode }); setSetAsDefault(!!a.isDefault); }}>Edit</Button>
                  {!a.isDefault && <Button variant="outline" size="sm" onClick={() => makeDefault(a._id!)}>Make Default</Button>}
                  <Button variant="outline" size="sm" className="text-red-600" onClick={() => remove(a._id!)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold mb-4">{editingId ? 'Edit Address' : 'Add New Address'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="fullName" className="text-xs sm:text-sm">Full Name</Label>
            <Input id="fullName" value={form.fullName} onChange={(e) => setForm(a => ({ ...a, fullName: e.target.value }))} className="h-9 sm:h-10 text-sm" />
          </div>
          <div>
            <Label htmlFor="phone" className="text-xs sm:text-sm">Phone</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm(a => ({ ...a, phone: e.target.value }))} className="h-9 sm:h-10 text-sm" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="line1" className="text-xs sm:text-sm">Address Line 1</Label>
            <Input id="line1" value={form.line1} onChange={(e) => setForm(a => ({ ...a, line1: e.target.value }))} className="h-9 sm:h-10 text-sm" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="line2" className="text-xs sm:text-sm">Address Line 2 (optional)</Label>
            <Input id="line2" value={form.line2} onChange={(e) => setForm(a => ({ ...a, line2: e.target.value }))} className="h-9 sm:h-10 text-sm" />
          </div>
          <div>
            <Label htmlFor="city" className="text-xs sm:text-sm">City</Label>
            <Input id="city" value={form.city} onChange={(e) => setForm(a => ({ ...a, city: e.target.value }))} className="h-9 sm:h-10 text-sm" />
          </div>
          <div>
            <Label htmlFor="state" className="text-xs sm:text-sm">State</Label>
            <Input id="state" value={form.state} onChange={(e) => setForm(a => ({ ...a, state: e.target.value }))} className="h-9 sm:h-10 text-sm" />
          </div>
          <div>
            <Label htmlFor="postal" className="text-xs sm:text-sm">PIN Code</Label>
            <Input id="postal" value={form.postalCode} onChange={(e) => setForm(a => ({ ...a, postalCode: e.target.value }))} className="h-9 sm:h-10 text-sm" />
          </div>
          <div className="md:col-span-2 flex items-center gap-2 pt-1">
            <input id="default" type="checkbox" aria-label="Set as default address" className="h-4 w-4" checked={setAsDefault} onChange={(e) => setSetAsDefault(e.target.checked)} />
            <Label htmlFor="default" className="text-xs sm:text-sm">Set as default</Label>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          {editingId && (
            <Button variant="outline" size="sm" onClick={() => { setEditingId(null); setForm({ fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '' }); setSetAsDefault(false); }}>Cancel</Button>
          )}
          <Button onClick={save} size="sm" className="bg-purple-600 hover:bg-purple-700 min-w-[120px]">{editingId ? 'Update Address' : 'Save Address'}</Button>
        </div>
      </div>
    </motion.div>
  );
}
