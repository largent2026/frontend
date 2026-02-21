import { AdminCouponsClient } from '@/app/admin/coupons/AdminCouponsClient';

export default function AdminCouponsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Coupons</h1>
      <AdminCouponsClient />
    </div>
  );
}
