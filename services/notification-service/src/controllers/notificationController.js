import { HttpError } from '../utils/HttpError.js';
import {
  notifyComplaintCreated,
  notifyStatusUpdated,
} from '../services/notificationService.js';

function requireComplaint(body) {
  const complaint = body?.complaint;
  if (!complaint || typeof complaint !== 'object') {
    throw new HttpError(400, 'Request body must include { "complaint": { ... } }');
  }
  if (!complaint.complaintId || !complaint.title) {
    throw new HttpError(400, 'complaint must include complaintId and title');
  }
  return complaint;
}

export async function postComplaintCreated(req, res, next) {
  try {
    const complaint = requireComplaint(req.body);
    const result = await notifyComplaintCreated(complaint);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function postStatusUpdated(req, res, next) {
  try {
    const complaint = requireComplaint(req.body);
    const result = await notifyStatusUpdated(complaint);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}
