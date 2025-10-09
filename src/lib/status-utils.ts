// Simplified status utilities for frontend
// Core status mapping - numeric to display
export const STATUS_MAP = {
  1: { label: 'Todo', color: 'text-gray-600 bg-gray-100' },
  2: { label: 'In Progress', color: 'text-blue-600 bg-blue-100' },
  3: { label: 'Done', color: 'text-green-600 bg-green-100' }
} as const;

/**
 * Get status info (label and color) from numeric status
 */
export function getStatusInfo(status: number | string | { name: string } | null | undefined) {
  // Convert to number if needed
  let numericStatus: number;

  if (typeof status === 'number') {
    numericStatus = status;
  } else if (typeof status === 'string') {
    numericStatus = getNumericStatus(status);
  } else if (status && typeof status === 'object' && 'name' in status) {
    numericStatus = getNumericStatus(status.name);
  } else {
    numericStatus = 1; // Default to Todo
  }

  return STATUS_MAP[numericStatus as keyof typeof STATUS_MAP] || STATUS_MAP[1];
}

/**
 * Convert various status formats to numeric status
 */
export function getNumericStatus(status: string | number | null | undefined): number {
  if (typeof status === 'number') return status;

  if (!status) return 1; // Default to Todo

  const normalized = status.toLowerCase().replace(/[-_\s]/g, '');

  switch (normalized) {
    case 'todo':
    case '1':
    case 'backlog':
    case 'notstarted':
      return 1;
    case 'inprogress':
    case 'in_progress':
    case '2':
    case 'doing':
    case 'active':
      return 2;
    case 'done':
    case '3':
    case 'completed':
    case 'complete':
      return 3;
    default:
      return 1; // Default fallback
  }
}

/**
 * Convert numeric status to display string
 */
export function getStatusLabel(status: number | string | { name: string } | null | undefined): string {
  const info = getStatusInfo(status);
  return info.label;
}

/**
 * Get status color classes
 */
export function getStatusColor(status: number | string | { name: string } | null | undefined): string {
  const info = getStatusInfo(status);
  return info.color;
}

/**
 * Normalize status for API calls
 */
export function normalizeStatusForAPI(status: string | number): string {
  const numeric = getNumericStatus(status);

  switch (numeric) {
    case 1: return 'todo';
    case 2: return 'in-progress';
    case 3: return 'done';
    default: return 'todo';
  }
}

/**
 * Normalize status from API response
 */
export function normalizeStatusFromAPI(apiStatus: string | number): number {
  if (typeof apiStatus === 'number') return apiStatus;

  switch (apiStatus?.toUpperCase()) {
    case 'TODO':
    case 'BACKLOG':
      return 1;
    case 'IN_PROGRESS':
    case 'DOING':
      return 2;
    case 'DONE':
    case 'COMPLETED':
      return 3;
    default:
      return 1;
  }
}
