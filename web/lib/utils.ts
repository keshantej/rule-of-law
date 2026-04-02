import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatMinutes(minutes: number) {
  return `${minutes} min`;
}

export function normalizePresentationDuration(duration?: number) {
  const allowedDurations = [20, 45, 60];
  return duration && allowedDurations.includes(duration) ? duration : 45;
}
