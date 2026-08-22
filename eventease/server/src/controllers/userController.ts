import { User } from '../models/User';
import { asyncHandler } from '../utils/errorHandler';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../middleware/auth';

export const search = asyncHandler(async (req: AuthRequest, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) {
    res.json({ success: true, data: { events: [], venues: [], vendors: [], services: [] } });
    return;
  }

  const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  const [events, venues, vendors, services] = await Promise.all([
    Event.find({ userId: req.user!.id, $or: [{ name: rx }, { location: rx }, { type: rx }] }).limit(5).lean(),
    (async () => {
      const VenueModule = await import('../models/Venue');
      return VenueModule.Venue.find({
        status: 'active', verificationStatus: 'approved',
        $or: [{ name: rx }, { location: rx }],
      }).limit(5).lean();
    })(),
    (async () => {
      const VendorModule = await import('../models/Vendor');
      const filter: Record<string, unknown> = {
        status: 'active', verificationStatus: 'approved',
        $or: [{ businessName: rx }, { location: rx }, { category: rx }],
      };
      // Vendors can only see other approved vendors
      if (req.user!.role === 'vendor') return VendorModule.Vendor.find(filter).limit(5).lean();
      return VendorModule.Vendor.find(filter).limit(5).lean();
    })(),
    (async () => {
      const ServiceModule = await import('../models/Service');
      const svc = await ServiceModule.Service.find({ status: 'active', name: rx })
        .populate('vendorId', 'businessName category')
        .limit(5)
        .lean();
      const approvedVendors = await (await import('../models/Vendor')).Vendor.find({ verificationStatus: 'approved' }).select('_id').lean();
      const okIds = new Set(approvedVendors.map((v) => String(v._id)));
      return svc.filter((s) => {
        const vid = s.vendorId as unknown as { _id?: { toString(): string } };
        return vid && okIds.has(String(vid._id ?? vid));
      });
    })(),
  ]);

  res.json({ success: true, data: { events, venues, vendors, services } });
});

export const getProfile = asyncHandler(async (req: AuthRequest, res) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw ApiError.notFound('User not found');
  const { password, ...safeUser } = user.toObject();
  res.json({ success: true, data: { user: safeUser } });
});
