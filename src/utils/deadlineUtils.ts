import { Project } from '../types';

/**
 * Gets the target deadline Date for a project.
 * Uses reminderDateTime if scheduled; otherwise uses endDate (at 18:00:00 local time).
 */
export function getProjectDeadline(project: Project): Date {
  if (project.reminderDateTime) {
    return new Date(project.reminderDateTime);
  }
  if (project.endDate) {
    if (project.endDate.includes('T')) {
      return new Date(project.endDate);
    }
    return new Date(`${project.endDate}T18:00:00`);
  }
  return new Date();
}

/**
 * Calculates the exact 24-hour early warning timestamp (in ms).
 */
export function getEarlyWarningTimestamp(deadline: Date): number {
  return deadline.getTime() - (24 * 60 * 60 * 1000);
}

/**
 * Formats a deadline Date or ISO string into a concise, readable string.
 */
export function formatDeadlineDisplay(deadline: Date | string): string {
  try {
    const d = typeof deadline === 'string' ? new Date(deadline.includes('T') ? deadline : `${deadline}T18:00:00`) : deadline;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(deadline).replace('T', ' at ');
  }
}

/**
 * Dispatches an in-app custom early warning toast notification event.
 */
export function dispatchEarlyWarningToast(project: Project, customDeadlineText?: string) {
  const deadlineText = customDeadlineText || formatDeadlineDisplay(getProjectDeadline(project));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ultra_jects_toast', {
        detail: {
          id: `early-warn-${Date.now()}-${project.id}`,
          projectId: project.id,
          projectName: project.name,
          type: 'early_warning',
          deadlineText: deadlineText,
          message: `The deadline for "${project.name}" is in 24 hours (${deadlineText}). Review pending milestones and finalize deliverables!`
        }
      })
    );
  }
}
