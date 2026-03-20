import { 
  differenceInDays, 
  differenceInHours, 
  differenceInMinutes, 
  differenceInSeconds,
  intervalToDuration,
  isAfter,
  isValid
} from 'date-fns';
import { AgeResult } from '../types';

export function calculateDetailedAge(birthDate: Date, now: Date): AgeResult {
  if (!isValid(birthDate)) {
    throw new Error('The provided birth date is invalid.');
  }

  if (isAfter(birthDate, now)) {
    throw new Error('Birth date cannot be in the future.');
  }

  const duration = intervalToDuration({ start: birthDate, end: now });
  
  const totalDays = differenceInDays(now, birthDate);
  const totalHours = differenceInHours(now, birthDate);
  const totalMinutes = differenceInMinutes(now, birthDate);
  const totalSeconds = differenceInSeconds(now, birthDate);

  return {
    years: duration.years || 0,
    months: duration.months || 0,
    days: duration.days || 0,
    hours: duration.hours || 0,
    minutes: duration.minutes || 0,
    seconds: duration.seconds || 0,
    totalDays,
    totalHours,
    totalMinutes,
    totalSeconds
  };
}
