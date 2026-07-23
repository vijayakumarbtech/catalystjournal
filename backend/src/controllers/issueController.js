import Issue from '../models/Issue.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const PAGE_SIZE = 12;

// Public: list issues that are NOT the current issue (i.e. archives).
// The current issue is surfaced via /issues/current; mixing it into
// the archive list confuses readers.
export const listIssues = asyncHandler(async (req, res) => {
  const { year, volume, page = 1 } = req.query;
  const filter = { isCurrent: { $ne: true } }; // ← FIXED: exclude current issue from archives
  if (year) filter.year = Number(year);
  if (volume) filter.volume = Number(volume);

  const skip = (Number(page) - 1) * PAGE_SIZE;
  const [items, totalCount] = await Promise.all([
    Issue.find(filter)
      .sort({ year: -1, volume: -1, issue: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .populate('articles'),
    Issue.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    page: Number(page),
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    totalCount,
  });
});

export const getCurrentIssue = asyncHandler(async (req, res) => {
  const issue = await Issue.findOne({ isCurrent: true }).populate('articles');
  if (!issue) {
    return res.json({ success: true, data: null });
  }
  res.json({ success: true, data: issue });
});

export const getIssueById = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id).populate('articles');
  if (!issue) throw new ApiError(404, 'Issue not found.');
  res.json({ success: true, data: issue });
});

// --- Admin ---

export const adminListIssues = asyncHandler(async (req, res) => {
  // Admin sees ALL issues (current + archives) so they can manage everything.
  const issues = await Issue.find().sort({ year: -1, volume: -1, issue: -1 }).populate('articles');
  res.json({ success: true, data: issues, page: 1, totalPages: 1, totalCount: issues.length });
});

// When creating a new issue with isCurrent: true, automatically demote any
// previously-current issue (isCurrent → false). This means all past issues
// remain in the database as archives; the Archives page shows everything
// that is NOT isCurrent. No issues are ever deleted.
async function demoteCurrentIfNeeded(isCurrentRequested) {
  if (isCurrentRequested) {
    await Issue.updateMany({ isCurrent: true }, { isCurrent: false });
  }
}

export const createIssue = asyncHandler(async (req, res) => {
  await demoteCurrentIfNeeded(req.body.isCurrent);
  const issue = await Issue.create(req.body);
  res.status(201).json({ success: true, data: issue });
});

export const updateIssue = asyncHandler(async (req, res) => {
  // If this update sets isCurrent to true, demote any existing current issue first.
  await demoteCurrentIfNeeded(req.body.isCurrent);
  const issue = await Issue.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!issue) throw new ApiError(404, 'Issue not found.');
  res.json({ success: true, data: issue });
});

export const deleteIssue = asyncHandler(async (req, res) => {
  const issue = await Issue.findByIdAndDelete(req.params.id);
  if (!issue) throw new ApiError(404, 'Issue not found.');
  res.json({ success: true, data: null });
});

// Explicitly promote an issue to current (e.g., from the "Set as current"
// button in AdminIssues). This automatically archives whatever was current.
export const setCurrentIssue = asyncHandler(async (req, res) => {
  // Demote all currently-current issues before promoting the new one.
  await Issue.updateMany({ isCurrent: true }, { isCurrent: false });
  const issue = await Issue.findByIdAndUpdate(req.params.id, { isCurrent: true }, { new: true });
  if (!issue) throw new ApiError(404, 'Issue not found.');
  res.json({ success: true, data: issue });
});
