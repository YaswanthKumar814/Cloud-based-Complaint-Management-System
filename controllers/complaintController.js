import * as complaintService from '../services/complaintService.js';
import {
  assertNonEmptyString,
  assertValidStatus,
  parseLimit,
} from '../utils/validation.js';
import { AppError } from '../utils/AppError.js';

export async function createComplaint(req, res) {
  const { title, description, category, reporterEmail } = req.body ?? {};

  const complaint = await complaintService.createComplaint({
    title: assertNonEmptyString(title, 'title'),
    description: assertNonEmptyString(description, 'description'),
    category: category ? assertNonEmptyString(category, 'category') : undefined,
    reporterEmail: reporterEmail
      ? assertNonEmptyString(reporterEmail, 'reporterEmail')
      : undefined,
  });

  res.status(201).json({
    success: true,
    data: complaint,
  });
}

export async function getComplaints(req, res) {
  const { status, limit: limitParam } = req.query;
  const normalizedStatus = status ? assertValidStatus(status) : undefined;

  const result = await complaintService.listComplaints({
    status: normalizedStatus,
    limit: parseLimit(limitParam),
  });

  res.status(200).json({
    success: true,
    data: result.items,
    meta: {
      count: result.count,
      scannedCount: result.scannedCount,
    },
  });
}

export async function updateStatus(req, res) {
  const { complaintId, status } = req.body ?? {};

  if (!complaintId || typeof complaintId !== 'string') {
    throw new AppError('complaintId is required', 400);
  }

  const updated = await complaintService.updateComplaintStatus(
    complaintId.trim(),
    assertValidStatus(status),
  );

  res.status(200).json({
    success: true,
    data: updated,
  });
}
