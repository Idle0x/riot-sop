import { type Signal, type SignalPhase, type LifecycleChapter } from '../types';

/**
 * Handles the logic of closing the current phase chapter and opening a new one.
 * Returns the updated lifecycle array.
 */
export const transitionLifecycle = (
  signal: Signal, 
  nextPhase: SignalPhase, 
  currentTotalHours: number,
  notes?: string
): LifecycleChapter[] => {
  const now = new Date().toISOString();
  
  // 1. Get current history or initialize if empty (legacy support)
  const history = signal.lifecycle || [{
    phase: signal.phase,
    enteredAt: signal.createdAt,
    hoursAtEntry: 0
  }];

  // 2. Close the active chapter (The last one in the array)
  const activeChapterIndex = history.length - 1;
  const activeChapter = { ...history[activeChapterIndex] };
  
  if (!activeChapter.exitedAt) {
    activeChapter.exitedAt = now;
    activeChapter.hoursAtExit = currentTotalHours;
  }

  // 3. Create the new chapter
  const newChapter: LifecycleChapter = {
    phase: nextPhase,
    enteredAt: now,
    hoursAtEntry: currentTotalHours,
    notes: notes || 'Phase Transition'
  };

  // 4. Return new array with closed chapter + new open chapter
  // Use slice to ensure we don't mutate the original array in place
  return [...history.slice(0, activeChapterIndex), activeChapter, newChapter];
};

/**
 * Calculates duration in days between two dates
 */
export const getDurationDays = (start: string, end?: string): number => {
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : new Date().getTime();
  return parseFloat(((e - s) / (1000 * 60 * 60 * 24)).toFixed(1));
};
