'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCart } from '@/components/providers/CartProvider';
import AuthModal from '@/components/auth/AuthModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';

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

export default function CheckoutPage() {
  const { user, loading } = useAuth();
  const { cartItems, getTotalItems, getTotalPrice } = useCart();
  const [showAuth, setShowAuth] = useState(false);
  const [address, setAddress] = useState<Address>({ fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '' });
  const [addressSaved, setAddressSaved] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // If user not logged in, show login modal automatically
  useEffect(() => {
    if (!loading && !user) setShowAuth(true);
  }, [user, loading]);

  // Initialize/clear address based on auth state and persist only for logged-in users
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (user) {
      // When logging in, prefer saved backend addresses; fall back to local saved if present
      setShowAddForm(false);
      const token = localStorage.getItem('bookhaven-token');
      // Fetch addresses from backend
      fetch('/api/profile/addresses', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
        .then(res => res.json())
        .then(json => {
          if (json?.success) {
            const list: Address[] = json.data || [];
            setAddresses(list);
            if (list.length > 0) {
              const def = list.find(a => a.isDefault) || list[0];
              setSelectedId(def._id || null);
              setAddress({
                fullName: def.fullName,
                phone: def.phone,
                line1: def.line1,
                line2: def.line2,
                city: def.city,
                state: def.state,
                postalCode: def.postalCode
              });
              setAddressSaved(true);
            } else {
              const saved = localStorage.getItem('bookhaven-shipping');
              if (saved) {
                try {
                  const parsed = JSON.parse(saved);
                  setAddress((prev) => ({ ...prev, ...parsed }));
                  setAddressSaved(true);
                } catch {}
              } else {
                setAddress({ fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '' });
                setAddressSaved(false);
              }
            }
          }
        })
        .catch(() => {
          // ignore for now
        });
    } else {
      // on logout or unauthenticated, clear address and any persisted value
      setAddress({ fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '' });
      setAddressSaved(false);
      setAddresses([]);
      setSelectedId(null);
      setShowAddForm(false);
      localStorage.removeItem('bookhaven-shipping');
    }
  }, [user]);

  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      localStorage.setItem('bookhaven-shipping', JSON.stringify(address));
    }
  }, [address, user]);

  const canPay = useMemo(() => {
    return !!user && addressSaved && getTotalItems() > 0;
  }, [user, addressSaved, getTotalItems]);

  const selectSavedAddress = (id: string) => {
    setSelectedId(id);
    const found = addresses.find(a => a._id === id);
    if (found) {
      setAddress({
        fullName: found.fullName,
        phone: found.phone,
        line1: found.line1,
        line2: found.line2,
        city: found.city,
        state: found.state,
        postalCode: found.postalCode,
      });
      setAddressSaved(true);
    }
  };

  const saveNewAddress = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
      const res = await fetch('/api/profile/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ...address, isDefault: addresses.length === 0 })
      });
      const json = await res.json();
      if (json?.success) {
        const created: Address = json.data;
        // Refresh list and select the created one
        const listRes = await fetch('/api/profile/addresses', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const listJson = await listRes.json();
        if (listJson?.success) {
          setAddresses(listJson.data || []);
        }
        setSelectedId(created._id || null);
        setAddress({
          fullName: created.fullName,
          phone: created.phone,
          line1: created.line1,
          line2: created.line2,
          city: created.city,
          state: created.state,
          postalCode: created.postalCode,
        });
        setAddressSaved(true);
        setShowAddForm(false);
        toast.success('Address added');
      } else {
        toast.error(json?.message || 'Failed to add address');
      }
    } catch {
      toast.error('Failed to add address');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-600 mb-6">Your cart is empty.</p>
        <Link href="/"><Button>Continue Shopping</Button></Link>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shipping Address */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Shipping Address</h2>
              {!user && (
                <Button variant="outline" onClick={() => setShowAuth(true)}>Login</Button>
              )}
            </div>

            {user && addresses.length > 0 && !showAddForm && (
              <div className="space-y-3">
                <h3 className="font-medium mb-1">Saved Addresses</h3>
                <div className="space-y-2">
                  {addresses.map(a => (
                    <label key={a._id} className={`flex items-start gap-3 border rounded p-3 cursor-pointer ${selectedId === a._id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                      <input type="radio" name="saved-address" checked={selectedId === a._id} onChange={() => selectSavedAddress(a._id!)} className="mt-1" />
                      <div className="min-w-0">
                        <div className="font-medium break-words">{a.fullName}</div>
                        <div className="mt-1 grid grid-cols-[110px_1fr] gap-x-2 gap-y-1 text-sm">
                          <div className="text-gray-500">Phone:</div>
                          <div className="text-gray-700 break-words">{a.phone}</div>
                          <div className="text-gray-500">Address:</div>
                          <div className="text-gray-700 break-words">{a.line1}</div>
                          {a.line2 && (
                            <>
                              <div className="text-gray-500">Second Address:</div>
                              <div className="text-gray-700 break-words">{a.line2}</div>
                            </>
                          )}
                          <div className="text-gray-500">City:</div>
                          <div className="text-gray-700">{a.city}</div>
                          <div className="text-gray-500">State:</div>
                          <div className="text-gray-700">{a.state}</div>
                          <div className="text-gray-500">PIN:</div>
                          <div className="text-gray-700">{a.postalCode}</div>
                        </div>
                        {a.isDefault && <div className="text-xs text-purple-700 font-semibold mt-1">Default</div>}
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-2">
                  <Button variant="outline" onClick={() => setShowAddForm(true)}>Ship to another address</Button>
                  {addressSaved && <span className="text-green-600 text-sm">Address selected. You can proceed to payment.</span>}
                </div>
              </div>
            )}

            {(!user || addresses.length === 0 || showAddForm) && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" value={address.fullName} onChange={(e) => setAddress(a => ({ ...a, fullName: e.target.value }))} placeholder="John Doe" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={address.phone} onChange={(e) => setAddress(a => ({ ...a, phone: e.target.value }))} placeholder="9876543210" />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="line1">Address Line 1</Label>
                    <Input id="line1" value={address.line1} onChange={(e) => setAddress(a => ({ ...a, line1: e.target.value }))} placeholder="House no, street" />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="line2">Address Line 2 (optional)</Label>
                    <Input id="line2" value={address.line2} onChange={(e) => setAddress(a => ({ ...a, line2: e.target.value }))} placeholder="Area, landmark" />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={address.city} onChange={(e) => setAddress(a => ({ ...a, city: e.target.value }))} placeholder="Mumbai" />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input id="state" value={address.state} onChange={(e) => setAddress(a => ({ ...a, state: e.target.value }))} placeholder="Maharashtra" />
                  </div>
                  <div>
                    <Label htmlFor="postal">PIN Code</Label>
                    <Input id="postal" value={address.postalCode} onChange={(e) => setAddress(a => ({ ...a, postalCode: e.target.value }))} placeholder="400001" />
                  </div>
                </div>

                <div className="mt-4 flex justify-between">
                  {user && addresses.length > 0 && (
                    <Button variant="outline" onClick={() => setShowAddForm(false)}>Back to saved</Button>
                  )}
                  <div className="ml-auto flex gap-2">
                    {user ? (
                      <Button onClick={saveNewAddress} className="bg-purple-600 hover:bg-purple-700">Save & Select</Button>
                    ) : (
                      <Button onClick={() => setAddressSaved(true)} className="bg-purple-600 hover:bg-purple-700">Save Address</Button>
                    )}
                  </div>
                </div>

                {addressSaved && (
                  <p className="text-green-600 mt-2">Address saved. You can proceed to payment.</p>
                )}
              </>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow p-6 lg:sticky lg:top-8">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-4">
              {cartItems.map((item, index) => (
                <div key={item.id ? `summary-${item.id}` : `summary-idx-${index}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Image src={item.coverImage} alt={item.title} width={40} height={56} className="rounded object-cover" />
                    <div>
                      <p className="font-medium text-sm line-clamp-1">{item.title}</p>
                      <p className="text-xs text-gray-500">x{item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-sm font-semibold">₹{item.discountedPrice * item.quantity}</div>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-purple-600">₹{getTotalPrice()}</span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              {!user && <p className="text-sm text-red-600">Please login to continue.</p>}
              {!addressSaved && <p className="text-sm text-orange-600">Save your shipping address to enable payment.</p>}
              <Button disabled={!canPay} className="w-full bg-green-600 hover:bg-green-700">Pay Now</Button>
              <Link href="/cart"><Button variant="outline" className="w-full">Back to Cart</Button></Link>
            </div>
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} initialMode="login" />
    </motion.div>
  );
}
