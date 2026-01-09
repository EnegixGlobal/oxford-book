'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCart } from '@/components/providers/CartProvider';
import AuthModal from '@/components/auth/AuthModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, Truck, Home, CreditCard } from 'lucide-react';

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
  const { cartItems, getTotalItems, getTotalPrice, clearCart } = useCart();
  const [showAuth, setShowAuth] = useState(false);
  const [address, setAddress] = useState<Address>({ fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '' });
  const [addressSaved, setAddressSaved] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Check localStorage for cart items on mount (fallback for Buy Now race condition)
  // This ensures cart is available even if state hasn't updated yet
  const [localCartChecked, setLocalCartChecked] = useState(false);
  
  useEffect(() => {
    if (!localCartChecked && cartItems.length === 0 && typeof window !== 'undefined') {
      // Give CartProvider time to load and merge carts
      const timeoutId = setTimeout(() => {
        setLocalCartChecked(true);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else if (cartItems.length > 0) {
      // Cart has items, no need to wait
      setLocalCartChecked(true);
    }
  }, [cartItems.length, localCartChecked]);

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

  const [paying, setPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const canPay = useMemo(() => !!user && addressSaved && getTotalItems() > 0 && !paying, [user, addressSaved, getTotalItems, paying]);
  const subtotal = getTotalPrice();
  const shippingCost = 0; // Free shipping policy for now
  const grandTotal = subtotal + shippingCost; // Extend here if adding taxes / discounts later

  // Simplified flow: only Cart -> Checkout (includes shipping + payment)
  const steps = ['Cart', 'Checkout'];
  const currentStep = 1; // zero-based index, we are on Checkout page

  const startPayment = async () => {
    if (!canPay) return;
    setPaying(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      // 1. Create order
      const createRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: cartItems.map(ci => ({
            title: ci.title,
            price: ci.discountedPrice,
            quantity: ci.quantity,
            coverImage: ci.coverImage
          })),
          shippingAddress: address,
          paymentMethod: paymentMethod
        })
      });
      const createJson = await createRes.json();
      if (!createRes.ok || !createJson.success) {
        toast.error(createJson.message || 'Failed to create order');
        setPaying(false);
        return;
      }
      
      // For Cash on Delivery, skip payment gateway and redirect to success
      if (paymentMethod === 'cod') {
        clearCart();
        const orderId = createJson.data.id;
        window.location.href = `/checkout/success?orderId=${orderId}`;
        return;
      }
      
      // For online payment, proceed with payment gateway
      const merchantOrderId = createJson.data.orderId;
      // 2. Initiate payment
      const payRes = await fetch('/api/payments/phonepe/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({ orderId: merchantOrderId })
      });
      const payJson = await payRes.json();
      if (!payRes.ok || !payJson.success) {
        toast.error(payJson.message || 'Failed to initiate payment');
        // Don't clear cart if payment initiation fails
        // Delete the order immediately since payment couldn't be initiated
        try {
          const deleteRes = await fetch(`/api/orders/${createJson.data.id}`, {
            method: 'DELETE',
            headers
          });
          const deleteJson = await deleteRes.json();
          if (!deleteRes.ok || !deleteJson.success) {
            console.error('Failed to delete order:', deleteJson.message);
            // Fallback: try to cancel if deletion fails
            try {
              await fetch(`/api/orders/${createJson.data.id}`, {
                method: 'PATCH',
                headers
              });
            } catch (cancelErr) {
              console.error('Failed to cancel order after payment initiation failure:', cancelErr);
            }
          } else {
            console.log('Order deleted successfully after payment initiation failure');
          }
        } catch (deleteErr) {
          console.error('Failed to delete order after payment initiation failure:', deleteErr);
          // Fallback: try to cancel if deletion fails
          try {
            await fetch(`/api/orders/${createJson.data.id}`, {
              method: 'PATCH',
              headers
            });
          } catch (cancelErr) {
            console.error('Failed to cancel order after payment initiation failure:', cancelErr);
          }
        }
        setPaying(false);
        return;
      }
      // Don't clear cart yet - wait for payment confirmation
      // Cart will be cleared on success page after payment verification
      const redirectUrl = payJson.data.redirectUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        toast.success('Payment already completed');
        // Only clear cart if payment is already completed
        clearCart();
      }
    } catch (e) {
      console.error('Payment error', e);
      toast.error('Payment failed to start');
    } finally {
      setPaying(false);
    }
  };

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

  // Show empty cart message only after checking localStorage
  if (cartItems.length === 0 && localCartChecked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-600 mb-6">Your cart is empty.</p>
        <Link href="/"><Button>Continue Shopping</Button></Link>
      </div>
    );
  }
  
  // Show loading state briefly while checking localStorage
  if (cartItems.length === 0 && !localCartChecked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-600 mb-6">Loading cart...</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative min-h-screen py-10 overflow-hidden">
      {/* Soft decorative background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(168,85,247,0.18),transparent_60%),radial-gradient(circle_at_80%_30%,rgba(236,72,153,0.18),transparent_65%)]" />
      <div className="max-w-6xl relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600">Checkout</h1>
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-sm font-medium">
            {steps.map((s, i) => {
              const active = i === currentStep;
              const done = i < currentStep;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center border text-xs relative ${active ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white border-transparent shadow-lg shadow-purple-300/40' : done ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-500 border-gray-300'} transition-colors`}>{i+1}</div>
                  <span className={`hidden sm:inline ${active ? 'text-purple-700' : done ? 'text-green-600' : 'text-gray-500'}`}>{s}</span>
                  {i < steps.length - 1 && <div className={`w-10 h-[2px] rounded-full ${i < currentStep ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-300'}`} />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping Address */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur rounded-2xl shadow-xl shadow-purple-200/40 p-6 border border-white/60 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(circle_at_30%_20%,black,transparent_70%)] opacity-60" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2"><Home className="h-5 w-5 text-purple-600" /> Shipping Address</h2>
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
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mt-2">
                  <Button variant="outline" onClick={() => setShowAddForm(true)} className="w-full sm:w-auto">Ship to another address</Button>
                  {addressSaved && (
                    <span className="text-green-600 text-xs sm:text-sm bg-green-50 border border-green-200 rounded-md px-2 py-1 w-full sm:w-auto text-center sm:text-left">
                      Address selected. You can proceed to payment.
                    </span>
                  )}
                </div>
              </div>
            )}

            {(!user || addresses.length === 0 || showAddForm) && (
              <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" value={address.fullName} onChange={(e) => setAddress(a => ({ ...a, fullName: e.target.value }))} placeholder="John Doe" className="focus-visible:ring-purple-500" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={address.phone} onChange={(e) => setAddress(a => ({ ...a, phone: e.target.value }))} placeholder="9876543210" className="focus-visible:ring-purple-500" />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="line1">Address Line 1</Label>
          <Input id="line1" value={address.line1} onChange={(e) => setAddress(a => ({ ...a, line1: e.target.value }))} placeholder="House no, street" className="focus-visible:ring-purple-500" />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="line2">Address Line 2 (optional)</Label>
          <Input id="line2" value={address.line2} onChange={(e) => setAddress(a => ({ ...a, line2: e.target.value }))} placeholder="Area, landmark" className="focus-visible:ring-purple-500" />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
          <Input id="city" value={address.city} onChange={(e) => setAddress(a => ({ ...a, city: e.target.value }))} placeholder="Mumbai" className="focus-visible:ring-purple-500" />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
          <Input id="state" value={address.state} onChange={(e) => setAddress(a => ({ ...a, state: e.target.value }))} placeholder="Maharashtra" className="focus-visible:ring-purple-500" />
                  </div>
                  <div>
                    <Label htmlFor="postal">PIN Code</Label>
          <Input id="postal" value={address.postalCode} onChange={(e) => setAddress(a => ({ ...a, postalCode: e.target.value }))} placeholder="400001" className="focus-visible:ring-purple-500" />
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
                  <p className="text-green-600 mt-2 text-xs sm:text-sm bg-green-50 border border-green-200 rounded-md px-2 py-1">
                    Address saved. You can proceed to payment.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-gradient-to-b from-white/95 via-white/90 to-white/70 rounded-2xl p-6 lg:sticky lg:top-8 shadow-xl shadow-pink-200/40 border border-white/60">
            <h2 className="text-xl font-semibold mb-5 flex items-center gap-2"><CreditCard className="h-5 w-5 text-pink-600" /> Order Summary</h2>
            <div className="space-y-4 relative">
              <AnimatePresence initial={false}>
                {cartItems.map((item, index) => (
                  <motion.div
                    key={item.id ? `summary-${item.id}` : `summary-idx-${index}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="flex items-center justify-between border-b last:border-none pb-3 last:pb-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Image src={item.coverImage} alt={item.title} width={44} height={62} className="rounded-md object-cover ring-1 ring-purple-100" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm line-clamp-1" title={item.title}>{item.title}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-sm font-semibold whitespace-nowrap">₹{item.discountedPrice * item.quantity}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div className="mt-2 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 flex items-center gap-1">Shipping <Truck className="h-3 w-3" /></span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Items</span>
                  <span>{getTotalItems()}</span>
                </div>
                <div className="pt-2 border-t flex justify-between text-base font-bold">
                  <span>Grand Total</span>
                  <span className="text-purple-600">₹{grandTotal}</span>
                </div>
              </div>
            </div>

            <div className="mt-7 space-y-3">
              {!user && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">Please login to continue.</p>}
              {!addressSaved && <p className="text-sm text-orange-600 bg-orange-50 border border-orange-100 rounded-md px-3 py-2">Save your shipping address to enable payment.</p>}
              
              {/* Payment Method Selection */}
              {user && addressSaved && (
                <div className="space-y-2 border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment Method</h3>
                  <div className="space-y-2">
                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'online' 
                        ? 'border-purple-500 bg-purple-50 shadow-sm' 
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="online"
                        checked={paymentMethod === 'online'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'online' | 'cod')}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-purple-600" />
                          <span className="font-medium text-sm">Online Payment</span>
                        </div>
                        <span className="text-xs text-gray-500">Pay securely with PhonePe</span>
                      </div>
                    </label>
                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'cod' 
                        ? 'border-purple-500 bg-purple-50 shadow-sm' 
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'online' | 'cod')}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-purple-600" />
                          <span className="font-medium text-sm">Cash on Delivery</span>
                        </div>
                        <span className="text-xs text-gray-500">Pay when you receive your order</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}
              
              <div className="group relative">
                <Button disabled={!canPay} onClick={startPayment} className="w-full bg-gradient-to-r from-green-600 via-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-green-300/30 transition-all">
                  {paying ? 'Processing...' : paymentMethod === 'cod' ? 'Place Order' : 'Pay Now'}
                </Button>
                {paymentMethod === 'online' && (
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Lock className="h-3 w-3" /> Secure Payment
                  </div>
                )}
              </div>
              <Link href="/cart" className="block"><Button variant="outline" className="w-full border-dashed hover:border-purple-400 hover:bg-purple-50 transition-colors">Back to Cart</Button></Link>
            </div>
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} initialMode="login" />
    </motion.div>
  );
}
