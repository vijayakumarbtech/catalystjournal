import NavItem from '../models/NavItem.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

// Public: returns enabled nav items (with only enabled children), sorted
// by order, grouped by location. The frontend Navbar/Footer render from
// this instead of a hardcoded list.
export const getPublicNav = asyncHandler(async (req, res) => {
  const items = await NavItem.find({ enabled: true }).sort({ order: 1 });

  const shaped = items.map((item) => ({
    _id: item._id,
    location: item.location,
    label: item.label,
    path: item.path,
    order: item.order,
    children: (item.children || [])
      .filter((c) => c.enabled)
      .sort((a, b) => a.order - b.order)
      .map((c) => ({ _id: c._id, label: c.label, path: c.path })),
  }));

  res.json({ success: true, data: shaped });
});

// --- Admin ---

export const adminListNav = asyncHandler(async (req, res) => {
  const items = await NavItem.find().sort({ location: 1, order: 1 });
  res.json({ success: true, data: items });
});

export const createNavItem = asyncHandler(async (req, res) => {
  const item = await NavItem.create(req.body);
  res.status(201).json({ success: true, data: item });
});

export const updateNavItem = asyncHandler(async (req, res) => {
  const item = await NavItem.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!item) throw new ApiError(404, 'Navigation item not found.');
  res.json({ success: true, data: item });
});

export const deleteNavItem = asyncHandler(async (req, res) => {
  const item = await NavItem.findByIdAndDelete(req.params.id);
  if (!item) throw new ApiError(404, 'Navigation item not found.');
  res.json({ success: true, data: null });
});

// Swaps the `order` value of two items in the same location, so the admin
// UI can offer simple up/down reordering without a drag-and-drop library.
export const reorderNavItem = asyncHandler(async (req, res) => {
  const { direction } = req.body; // 'up' | 'down'
  const item = await NavItem.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Navigation item not found.');

  const neighborQuery = { location: item.location, _id: { $ne: item._id } };
  const neighbor = await NavItem.findOne(
    direction === 'up' ? { ...neighborQuery, order: { $lt: item.order } } : { ...neighborQuery, order: { $gt: item.order } }
  ).sort(direction === 'up' ? { order: -1 } : { order: 1 });

  if (!neighbor) {
    return res.json({ success: true, data: item }); // already at the edge
  }

  const itemOrder = item.order;
  item.order = neighbor.order;
  neighbor.order = itemOrder;
  await Promise.all([item.save(), neighbor.save()]);

  res.json({ success: true, data: item });
});

export const addNavChild = asyncHandler(async (req, res) => {
  const item = await NavItem.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Navigation item not found.');

  item.children.push({
    label: req.body.label,
    path: req.body.path,
    order: item.children.length,
    enabled: true,
  });
  await item.save();

  res.status(201).json({ success: true, data: item });
});

export const updateNavChild = asyncHandler(async (req, res) => {
  const item = await NavItem.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Navigation item not found.');

  const child = item.children.id(req.params.childId);
  if (!child) throw new ApiError(404, 'Sub-menu item not found.');

  Object.assign(child, req.body);
  await item.save();

  res.json({ success: true, data: item });
});

export const deleteNavChild = asyncHandler(async (req, res) => {
  const item = await NavItem.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Navigation item not found.');

  item.children.id(req.params.childId)?.deleteOne();
  await item.save();

  res.json({ success: true, data: item });
});
