import { Service } from '../models/Service';
import { Vendor } from '../models/Vendor';
import { asyncHandler } from '../utils/errorHandler';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../middleware/auth';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getServices = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 12);

  const filter: Record<string, unknown> = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(String(req.query.search)), 'i');
    filter.$or = [{ name: rx }, { description: rx }];
  }
  if (req.query.minPrice || req.query.maxPrice) {
    const pf: Record<string, number> = {};
    if (req.query.minPrice) pf.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) pf.$lte = Number(req.query.maxPrice);
    filter.price = pf;
  }
  if (req.query.vendorId && /^[0-9a-fA-F]{24}$/.test(String(req.query.vendorId))) {
    filter.vendorId = req.query.vendorId;
  }

  let vendorFilterIds: string[] | null = null;
  if (req.query.location) {
    const vendors = await Vendor.find({
      location: new RegExp(escapeRegex(String(req.query.location)), 'i'),
    }).select('_id');
    vendorFilterIds = vendors.map((v) => String(v._id));
    filter.vendorId = { ...(filter.vendorId as object), $in: vendorFilterIds };
  }

  // Public listing only shows services from active+approved vendors
  const approvedVendors = await Vendor.find({ status: 'active', verificationStatus: 'approved' }).select('_id');
  const approvedIds = new Set(approvedVendors.map((v) => String(v._id)));
  const baseIds = vendorFilterIds ?? [...approvedIds];
  const intersected = baseIds.filter((id) => approvedIds.has(id));
  filter.vendorId = intersected.length
    ? { ...(typeof filter.vendorId === 'object' ? filter.vendorId : {}), $in: intersected }
    : { $in: [] };

  const [services, total] = await Promise.all([
    Service.find(filter)
      .populate('vendorId', 'businessName category location profileImage rating verified')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Service.countDocuments(filter),
  ]);

  res.json({ success: true, data: { services, total, page, pages: Math.ceil(total / limit) || 1 } });
});

export const getService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id).populate(
    'vendorId',
    'businessName category location profileImage rating reviewCount verified'
  );
  if (!service) throw ApiError.notFound('Service not found');
  res.json({ success: true, data: { service } });
});

export const createService = asyncHandler(async (req: AuthRequest, res) => {
  const vendor = await Vendor.findOne({ userId: req.user!.id });
  if (!vendor) throw ApiError.notFound('Vendor profile not found. Complete your profile first.');
  if (vendor.status !== 'active') throw ApiError.forbidden('Your account is suspended');

  const service = await Service.create({ ...req.body, vendorId: vendor._id });

  // Keep starting price in sync with the cheapest service
  const cheapest = await Service.findOne({ vendorId: vendor._id }).sort({ price: 1 });
  if (cheapest && cheapest.price !== vendor.startingPrice) {
    vendor.startingPrice = cheapest.price;
    await vendor.save();
  }

  res.status(201).json({ success: true, message: 'Service created', data: { service } });
});

export const updateService = asyncHandler(async (req: AuthRequest, res) => {
  const vendor = await Vendor.findOne({ userId: req.user!.id });
  const service = await Service.findById(req.params.id);
  if (!service) throw ApiError.notFound('Service not found');
  if (!vendor || String(service.vendorId) !== String(vendor._id)) {
    throw ApiError.forbidden('You can only modify your own services');
  }

  Object.assign(service, req.body);
  await service.save();

  const cheapest = await Service.findOne({ vendorId: vendor._id }).sort({ price: 1 });
  if (cheapest) {
    vendor.startingPrice = cheapest.price;
    await vendor.save();
  }

  res.json({ success: true, message: 'Service updated', data: { service } });
});

export const deleteService = asyncHandler(async (req: AuthRequest, res) => {
  const vendor = await Vendor.findOne({ userId: req.user!.id });
  const service = await Service.findById(req.params.id);
  if (!service) throw ApiError.notFound('Service not found');
  if (!vendor || String(service.vendorId) !== String(vendor._id)) {
    if (req.user!.role !== 'admin') throw ApiError.forbidden('You can only delete your own services');
  }

  await service.deleteOne();

  if (vendor) {
    const cheapest = await Service.findOne({ vendorId: vendor._id }).sort({ price: 1 });
    vendor.startingPrice = cheapest?.price ?? 0;
    await vendor.save();
  }

  res.json({ success: true, message: 'Service deleted' });
});

export const getMyServices = asyncHandler(async (req: AuthRequest, res) => {
  const vendor = await Vendor.findOne({ userId: req.user!.id });
  if (!vendor) throw ApiError.notFound('Vendor profile not found');
  const services = await Service.find({ vendorId: vendor._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: { services } });
});
