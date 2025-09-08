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

interface OrderDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: any
  onUpdate?: (id: string, fields: { status?: string; paymentStatus?: string }) => void
}

const sampleOrderItems = [
  { id: 1, title: 'Atomic Habits', price: 699, quantity: 1 },
  { id: 2, title: 'The Psychology of Money', price: 899, quantity: 1 },
  { id: 3, title: 'Deep Work', price: 899, quantity: 1 },
];

export function OrderDetailsDialog({
  open,
  onOpenChange,
  order,
  onUpdate
}: OrderDetailsDialogProps) {
  const [status, setStatus] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('');

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setPaymentStatus(order.paymentStatus);
    }
  }, [order]);

  const handleSave = () => {
    if (order && onUpdate) {
      onUpdate(order.id, { status, paymentStatus });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Order Details - {order?.id}</DialogTitle>
        </DialogHeader>

        {/* Customer Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold mb-2">Customer Information</h3>
          <p className="text-gray-700">Name: {order?.customer}</p>
          <p className="text-gray-700">Order Date: {order?.date}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div className="space-y-1">
              <span className="text-gray-600 text-sm">Order Status</span>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Shipped">Shipped</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <span className="text-gray-600 text-sm">Payment Status</span>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Refunded">Refunded</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="border rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sampleOrderItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-sm">{item.title}</td>
                  <td className="px-4 py-3 text-sm">{item.quantity}</td>
                  <td className="px-4 py-3 text-sm">₹{item.price}</td>
                  <td className="px-4 py-3 text-sm">₹{item.price * item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order Summary */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>₹{order?.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping:</span>
              <span>₹0</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Total:</span>
              <span>₹{order?.total}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Shipping Address</h3>
          <p className="text-gray-700">
            123 Main Street<br />
            Apartment 4B<br />
            Mumbai, Maharashtra 400001<br />
            India
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={!order || !status || !paymentStatus}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
