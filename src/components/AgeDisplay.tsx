import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AgeResult } from '../types';
import { Clock, Calendar, Hourglass, Timer } from 'lucide-react';

interface AgeDisplayProps {
  age: AgeResult;
}

export const AgeDisplay: React.FC<AgeDisplayProps> = ({ age }) => {
  const stats = [
    { label: 'Years', value: age.years, icon: Calendar, color: 'text-blue-600' },
    { label: 'Months', value: age.months, icon: Calendar, color: 'text-indigo-600' },
    { label: 'Days', value: age.days, icon: Calendar, color: 'text-purple-600' },
    { label: 'Hours', value: age.hours, icon: Clock, color: 'text-pink-600' },
    { label: 'Minutes', value: age.minutes, icon: Timer, color: 'text-orange-600' },
    { label: 'Seconds', value: age.seconds, icon: Hourglass, color: 'text-red-600', isLive: true },
  ];

  const totalStats = [
    { label: 'Total Days', value: age.totalDays.toLocaleString() },
    { label: 'Total Hours', value: age.totalHours.toLocaleString() },
    { label: 'Total Minutes', value: age.totalMinutes.toLocaleString() },
    { label: 'Total Seconds', value: age.totalSeconds.toLocaleString() },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: stat.isLive ? [1, 1.02, 1] : 1
            }}
            transition={{ 
              delay: idx * 0.1,
              scale: stat.isLive ? { 
                duration: 1, 
                repeat: Infinity, 
                ease: "easeInOut" 
              } : {}
            }}
            className={`glass-card p-4 rounded-2xl flex flex-col items-center text-center group hover:scale-105 transition-transform ${stat.isLive ? 'border-red-500/20' : ''}`}
          >
            <stat.icon className={`w-6 h-6 mb-2 ${stat.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
            <AnimatePresence mode="wait">
              <motion.span
                key={stat.value}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-3xl font-bold font-mono tracking-tighter"
              >
                {stat.value}
              </motion.span>
            </AnimatePresence>
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold mt-1">{stat.label}</span>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {totalStats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + idx * 0.1 }}
            className="bg-neutral-50 border border-neutral-100 p-4 rounded-xl"
          >
            <span className="block text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-1">{stat.label}</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={stat.value}
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                className="text-xl font-mono font-medium text-neutral-700"
              >
                {stat.value}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
