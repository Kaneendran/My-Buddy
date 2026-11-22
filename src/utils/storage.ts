import {
  AtsTemplateStyle,
  createId,
  normalizeForAts,
  ResumeDraft,
  ResumeRecord,
} from '../types/resume';

const STORAGE_KEY = 'my_buddy_resume_records_v1';

export function loadResumeRecords(): ResumeRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveResumeRecords(records: ResumeRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage quota errors safely
  }
}

export function createSubmittedRecord(draft: ResumeDraft): ResumeRecord {
  const now = new Date().toISOString();
  const normalized = normalizeForAts(draft);
  return {
    ...normalized,
    id: createId('rec'),
    status: 'submitted',
    atsStyle: 'classic',
    createdAt: now,
    updatedAt: now,
  };
}

export function updateExistingRecord(
  existing: ResumeRecord,
  draft: ResumeDraft
): ResumeRecord {
  const now = new Date().toISOString();
  const normalized = normalizeForAts(draft);
  return {
    ...existing,
    ...normalized,
    updatedAt: now,
  };
}

export function markRecordAsAtsConverted(
  existing: ResumeRecord,
  atsStyle?: AtsTemplateStyle
): ResumeRecord {
  const now = new Date().toISOString();
  const normalized = normalizeForAts(existing);
  return {
    ...existing,
    ...normalized,
    status: 'ats_converted',
    atsStyle: atsStyle ?? existing.atsStyle,
    convertedAt: existing.convertedAt ?? now,
    updatedAt: now,
  };
}
