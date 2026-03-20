export interface AgeResult {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
}

export interface Celebrity {
  name: string;
  birthDate: string; // ISO format
  description: string;
  category: string;
  imageUrl?: string;
  nationality?: string;
  knownFor?: string;
  achievements?: string[];
}

export interface ComparisonResult {
  difference: string;
  older: boolean;
}
