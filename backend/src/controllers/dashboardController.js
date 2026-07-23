import Submission from '../models/Submission.js';
import PageView from '../models/PageView.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    totalPapers,
    todaysSubmissions,
    pendingReview,
    accepted,
    rejected,
    totalPayments,
    visitorsToday,
  ] = await Promise.all([
    Submission.countDocuments(),
    Submission.countDocuments({ submittedAt: { $gte: startOfToday } }),
    Submission.countDocuments({ status: { $in: ['pending', 'under-review'] } }),
    Submission.countDocuments({ status: 'accepted' }),
    Submission.countDocuments({ status: 'rejected' }),
    Submission.countDocuments({ paymentStatus: 'paid' }),
    PageView.countDocuments({ createdAt: { $gte: startOfToday } }),
  ]);

  res.json({
    success: true,
    data: { totalPapers, todaysSubmissions, pendingReview, accepted, rejected, totalPayments, visitorsToday },
  });
});
