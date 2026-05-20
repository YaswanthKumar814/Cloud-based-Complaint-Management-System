/**
 * Beginner-friendly keyword rules (no ML training required).
 * Comprehend handles sentiment + key phrases; these rules pick category + priority.
 */

export const CATEGORY_RULES = [
  { name: 'Internet', keywords: ['wifi', 'internet', 'network'] },
  { name: 'Electrical', keywords: ['electricity', 'power', 'light', 'electric'] },
  { name: 'Hostel', keywords: ['hostel', 'room', 'bathroom'] },
  { name: 'Cleanliness', keywords: ['dirty', 'garbage', 'cleaning', 'clean'] },
  { name: 'Infrastructure', keywords: ['chair', 'bench', 'projector', 'desk'] },
];

export const PRIORITY_RULES = {
  HIGH: ['fire', 'sparks', 'emergency', 'electric shock', 'shock', 'danger'],
  MEDIUM: ['broken', 'damaged', 'leak', 'leaking'],
  LOW: ['slow', 'delay', 'waiting'],
};

/** Comprehend text limit is 5000 bytes */
export const COMPREHEND_MAX_CHARS = 5000;
