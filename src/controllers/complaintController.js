import * as complaintService from '../services/complaintService.js';
import { parseCreateComplaintBody, parseStatusUpdateBody } from '../utils/complaintValidation.js';

export async function postComplaint(req, res) {
  const { title, description, category } = parseCreateComplaintBody(req.body);
  const complaint = await complaintService.createComplaint({ title, description, category });
  res.status(201).json({ success: true, data: complaint });
}

export async function getComplaints(_req, res) {
  const complaints = await complaintService.listComplaints();
  res.status(200).json({ success: true, count: complaints.length, data: complaints });
}

export async function getComplaintById(req, res) {
  const { id } = req.params;
  const complaint = await complaintService.getComplaintById(id);
  res.status(200).json({ success: true, data: complaint });
}

export async function putComplaintStatus(req, res) {
  const { id } = req.params;
  const status = parseStatusUpdateBody(req.body);
  const updated = await complaintService.updateComplaintStatus(id, status);
  res.status(200).json({ success: true, data: updated });
}
