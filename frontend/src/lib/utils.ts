import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatViews(views?: number): string {
  if (!views && views !== 0) return '';
  if (views >= 1_000_000) {
    return `${(views / 1_000_000).toFixed(1)}M visualizações`;
  }
  if (views >= 1_000) {
    return `${(views / 1_000).toFixed(1)}k visualizações`;
  }
  return `${views} visualizações`;
}

