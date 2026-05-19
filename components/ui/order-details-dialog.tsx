import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface OrderSummaryRow {
  _id: string;
  orderId: string;
  customer: string;
  createdAt: string;
  totalAmount: number;
  status: string;
  // paymentStatus intentionally omitted from summary listing per new requirement
}

interface OrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderSummaryRow | null;
  onUpdate?: (orderId: string, fields: { status?: string }) => void;
}

interface FullOrderItem { title: string; price: number; quantity: number; subtotal: number; }
interface FullOrderData {
  _id: string;
  orderId: string;
  items: FullOrderItem[];
  totalAmount: number;
  paymentStatus: string;
  status: string;
  shippingAddress?: { fullName:string; phone:string; line1:string; line2?:string; city:string; state:string; postalCode:string };
  createdAt: string;
  trackingInfo?: any;
  shiprocketShipmentId?: number;
  shiprocketAWB?: string;
  shiprocketCourierName?: string;
  shiprocketTrackingUrl?: string;
}

export function OrderDetailsDialog({ open, onOpenChange, order, onUpdate }: OrderDetailsDialogProps) {
  const [status, setStatus] = useState('');
  // paymentStatus removed from interactive editing
  const [loading, setLoading] = useState(false);
  const [syncingShiprocket, setSyncingShiprocket] = useState(false);
  const [fullOrder, setFullOrder] = useState<FullOrderData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetails = async () => {
    if (!order?._id) return;
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
      const r = await fetch(`/api/orders/${order._id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const j = await r.json();
      if (j.success) {
        setFullOrder(j.data);
        setStatus(j.data.status);
      } else {
        setError(j.message || 'Failed to load order');
      }
    } catch {
      setError('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && order?._id) {
      fetchOrderDetails();
    } else if (!open) {
      setFullOrder(null);
    }
  }, [open, order?._id]);

  const handleCreateShipment = async () => {
    if (!fullOrder?._id) return;
    setSyncingShiprocket(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
      const res = await fetch('/api/shiprocket/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ orderId: fullOrder._id })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'Shiprocket shipment created successfully');
        await fetchOrderDetails();
        if (onUpdate) {
          onUpdate(fullOrder.orderId, { status: 'shipped' });
        }
      } else {
        toast.error(json.message || 'Failed to create Shiprocket shipment');
      }
    } catch (err: any) {
      console.error('Shiprocket creation error:', err);
      toast.error('An error occurred while creating shipment');
    } finally {
      setSyncingShiprocket(false);
    }
  };

  const handleSave = async () => {
    if (!order) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
      const res = await fetch(`/api/admin/orders/${order._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (json.success) {
        setFullOrder(json.data);
        if (onUpdate) onUpdate(order.orderId, { status: json.data.status });
        toast.success('Order updated');
      } else {
        toast.error(json.message || 'Update failed');
      }
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] md:max-w-[760px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Order Details - {order?.orderId}</DialogTitle>
        </DialogHeader>
        {loading && (
          <div className="py-10 flex flex-col items-center gap-3 text-gray-600"><Loader2 className="w-6 h-6 animate-spin" /> Loading order...</div>
        )}
        {error && !loading && (
          <div className="py-8 text-center text-red-600 text-sm">{error}</div>
        )}
        {!loading && !error && fullOrder && (
          <>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold mb-2">Customer & Status</h3>
              <p className="text-gray-700">Customer: {order?.customer}</p>
              <p className="text-gray-700">Order Date: {new Date(fullOrder.createdAt).toLocaleString()}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div className="space-y-1">
                  <span className="text-gray-600 text-sm">Order Status</span>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created">Created</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-600 text-sm">Payment Status</span>
                  <div>
                    <Badge variant={fullOrder.paymentStatus === 'paid' ? 'default' : fullOrder.paymentStatus === 'failed' ? 'destructive' : 'secondary'}>
                      {fullOrder.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            <div className="border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase text-xs">Item</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase text-xs">Qty</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase text-xs">Price</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase text-xs">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {fullOrder.items.map((it, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2">{it.title}</td>
                      <td className="px-4 py-2">{it.quantity}</td>
                      <td className="px-4 py-2">₹{it.price}</td>
                      <td className="px-4 py-2">₹{it.subtotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Order Summary</h3>
              <div className="flex justify-between text-sm">
                <span>Total:</span>
                <span className="font-semibold">₹{fullOrder.totalAmount}</span>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Shipping Address</h3>
              {fullOrder.shippingAddress ? (
                <p className="text-gray-700 text-sm leading-relaxed">
                  {fullOrder.shippingAddress.fullName}<br />
                  {fullOrder.shippingAddress.line1}{fullOrder.shippingAddress.line2 ? <><br />{fullOrder.shippingAddress.line2}</> : null}<br />
                  {fullOrder.shippingAddress.city}, {fullOrder.shippingAddress.state} {fullOrder.shippingAddress.postalCode}<br />
                  Phone: {fullOrder.shippingAddress.phone}
                </p>
              ) : (
                <p className="text-gray-500 text-sm">No shipping address saved.</p>
              )}
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-purple-100">
              <h3 className="font-semibold mb-2 flex items-center justify-between">
                <span>Shiprocket Shipment</span>
                {fullOrder.shiprocketShipmentId ? (
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">Synced</Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">Not Synced</Badge>
                )}
              </h3>
              {fullOrder.shiprocketShipmentId ? (
                <div className="text-sm text-gray-700 space-y-1">
                  <p><span className="font-medium text-gray-600">Shipment ID:</span> {fullOrder.shiprocketShipmentId}</p>
                  {fullOrder.shiprocketAWB && (
                    <p><span className="font-medium text-gray-600">AWB Code:</span> {fullOrder.shiprocketAWB}</p>
                  )}
                  {fullOrder.shiprocketCourierName && (
                    <p><span className="font-medium text-gray-600">Courier Partner:</span> {fullOrder.shiprocketCourierName}</p>
                  )}
                  {fullOrder.shiprocketTrackingUrl && (
                    <p className="mt-2">
                      <a 
                        href={fullOrder.shiprocketTrackingUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-purple-600 hover:text-purple-700 font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        Track Shipment &rarr;
                      </a>
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">
                    This order is not currently synced with Shiprocket. You can sync it manually below.
                  </p>
                  <Button 
                    onClick={handleCreateShipment} 
                    disabled={syncingShiprocket}
                    variant="outline"
                    className="w-full border-purple-200 hover:border-purple-300 bg-white text-purple-700 hover:bg-purple-50 hover:text-purple-800"
                  >
                    {syncingShiprocket ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Syncing with Shiprocket...
                      </>
                    ) : (
                      'Sync & Create Shiprocket Shipment'
                    )}
                  </Button>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSave} disabled={!status}>Save Changes</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
