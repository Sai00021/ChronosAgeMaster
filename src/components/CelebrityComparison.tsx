import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getCelebrityBirthdate, getCelebritySuggestions, generateAgeVisualization } from '../services/geminiService';
import { Celebrity } from '../types';
import { Search, Star, Loader2, User, Users, Calendar as CalendarIcon, Share2, Check, Copy, Globe, Award, Info, RefreshCcw, Image as ImageIcon, Sparkles } from 'lucide-react';
import { differenceInDays, format, intervalToDuration } from 'date-fns';

import { Toast, ToastType } from './Toast';

interface CelebrityComparisonProps {
  userBirthDate?: Date | null;
  onToast?: (message: string, type?: ToastType) => void;
}

export const CelebrityComparison: React.FC<CelebrityComparisonProps> = ({ userBirthDate, onToast }) => {
  const [mode, setMode] = useState<'celebrity' | 'manual'>('celebrity');
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [manualDate, setManualDate] = useState('');
  const [manualName, setManualName] = useState('');
  const [loading, setLoading] = useState(false);
  const [celebrity, setCelebrity] = useState<Celebrity | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [visualizing, setVisualizing] = useState(false);
  const [visualizationUrl, setVisualizationUrl] = useState<string | null>(null);
  const [localToast, setLocalToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false
  });
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    if (onToast) {
      onToast(message, type);
    } else {
      setLocalToast({ message, type, isVisible: true });
    }
  };

  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMessage, 'success');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast(successMessage, 'success');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        showToast('Failed to copy', 'error');
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (search.length >= 2 && mode === 'celebrity') {
        const results = await getCelebritySuggestions(search);
        
        const searchLower = search.toLowerCase().trim();
        const exactMatch = results.find(r => r.toLowerCase().trim() === searchLower);

        if (exactMatch) {
          // If exact match found, only show that prominently
          setSuggestions([exactMatch]);
        } else {
          // Sort results: starts with first, then partial matches
          const sortedResults = [...results].sort((a, b) => {
            const aLower = a.toLowerCase();
            const bLower = b.toLowerCase();
            
            const aStarts = aLower.startsWith(searchLower);
            const bStarts = bLower.startsWith(searchLower);
            
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            
            return 0;
          });

          setSuggestions(sortedResults);
        }
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [search, mode]);

  const handleSearch = async (e?: React.FormEvent, name?: string) => {
    if (e) e.preventDefault();
    const query = name || search;
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setShowSuggestions(false);
    try {
      const data = await getCelebrityBirthdate(query);
      setCelebrity(data);
      setSearch(''); // Clear input after search
      
      // Update URL without reload
      const url = new URL(window.location.href);
      url.searchParams.set('c', data.name);
      url.searchParams.delete('md');
      window.history.replaceState({}, '', url.toString());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get('c');
    const md = params.get('md');
    
    if (c) {
      setSearch(c);
      handleSearch(undefined, c);
    } else if (md && /^\d{4}-\d{2}-\d{2}$/.test(md)) {
      setMode('manual');
      setManualDate(md);
    }
  }, []);

  useEffect(() => {
    if (mode === 'manual' && manualDate && /^\d{4}-\d{2}-\d{2}$/.test(manualDate)) {
      const url = new URL(window.location.href);
      url.searchParams.set('md', manualDate);
      url.searchParams.delete('c');
      window.history.replaceState({}, '', url.toString());
    }
  }, [mode, manualDate]);

  const calculateDiff = (otherDateStr: string) => {
    const otherDate = new Date(otherDateStr);
    if (isNaN(otherDate.getTime())) return null;

    if (!userBirthDate) {
      return {
        years: 0,
        months: 0,
        days: 0,
        hours: 0,
        isOlder: false,
        date: otherDate,
        noUserDate: true
      };
    }

    const diffDays = differenceInDays(userBirthDate, otherDate);
    const isOlder = diffDays < 0;
    
    // Detailed duration
    const duration = intervalToDuration({ 
      start: isOlder ? userBirthDate : otherDate, 
      end: isOlder ? otherDate : userBirthDate 
    });

    return {
      years: duration.years || 0,
      months: duration.months || 0,
      days: duration.days || 0,
      hours: duration.hours || 0,
      isOlder,
      date: otherDate,
      noUserDate: false
    };
  };

  const diff = celebrity ? calculateDiff(celebrity.birthDate) : (manualDate ? calculateDiff(manualDate) : null);

  const handleGenerateVisualization = async () => {
    if (!diff || diff.noUserDate) return;
    
    setVisualizing(true);
    try {
      const ageDesc = `${diff.years} years, ${diff.months} months, and ${diff.days} days`;
      const url = await generateAgeVisualization(ageDesc);
      setVisualizationUrl(url);
      showToast('Visualization generated!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate visualization', 'error');
    } finally {
      setVisualizing(false);
    }
  };

  const handleShare = async () => {
    if (!diff || diff.noUserDate) return;
    const name = celebrity ? celebrity.name : (manualName || 'my friend');
    const text = `I am ${diff.years}y ${diff.months}m ${diff.days}d ${diff.isOlder ? 'older' : 'younger'} than ${name}! Calculate your age at Chronos Age Master.`;
    
    // Ensure URL is up to date
    const url = new URL(window.location.href);
    if (celebrity) {
      url.searchParams.set('c', celebrity.name);
      url.searchParams.delete('md');
    } else if (manualDate) {
      url.searchParams.set('md', manualDate);
      url.searchParams.delete('c');
    }
    const shareUrl = url.toString();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Chronos Age Comparison',
          text: text,
          url: shareUrl
        });
        showToast('Shared successfully!', 'success');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard(shareUrl, 'Comparison link copied to clipboard!');
        }
      }
    } else {
      copyToClipboard(shareUrl, 'Comparison link copied to clipboard!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex p-1 bg-neutral-100 rounded-2xl w-fit mx-auto">
        <button
          onClick={() => setMode('celebrity')}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${mode === 'celebrity' ? 'bg-white shadow-md text-blue-600' : 'text-neutral-500 hover:text-neutral-700'}`}
        >
          <Star className={`w-4 h-4 ${mode === 'celebrity' ? 'fill-blue-600' : ''}`} /> Celebrity
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${mode === 'manual' ? 'bg-white shadow-md text-blue-600' : 'text-neutral-500 hover:text-neutral-700'}`}
        >
          <Users className={`w-4 h-4 ${mode === 'manual' ? 'fill-blue-600' : ''}`} /> Friend/Manual
        </button>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'celebrity' ? (
          <motion.div 
            key="celeb-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative max-w-2xl mx-auto"
            ref={suggestionsRef}
          >
            <form onSubmit={(e) => handleSearch(e)} className="relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-neutral-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => search.length >= 2 && setShowSuggestions(true)}
                placeholder="Search celebrity (e.g. Albert Einstein)"
                className="w-full bg-white border-2 border-neutral-100 rounded-[2rem] py-5 pl-14 pr-20 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-lg shadow-neutral-200/50 text-neutral-900 placeholder:text-neutral-400 text-lg"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-3 top-3 bottom-3 bg-blue-600 text-white px-6 rounded-[1.5rem] hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20 font-bold"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
              </button>
            </form>

            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute z-50 w-full mt-3 bg-white border border-neutral-100 rounded-[2rem] shadow-2xl overflow-hidden p-2"
                >
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSearch(undefined, suggestion)}
                      className="w-full text-left px-6 py-4 hover:bg-blue-50 rounded-2xl transition-colors text-base font-medium text-neutral-700 flex items-center gap-4 group"
                    >
                      <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center group-hover:bg-white transition-colors">
                        <User className="w-4 h-4 text-neutral-400 group-hover:text-blue-500" />
                      </div>
                      {suggestion}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {!celebrity && !loading && search.length === 0 && (
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <p className="w-full text-center text-xs text-neutral-400 uppercase tracking-widest font-bold mb-1">Popular Comparisons</p>
                {['Albert Einstein', 'Leonardo da Vinci', 'Marie Curie', 'Steve Jobs', 'Taylor Swift'].map((name) => (
                  <button
                    key={name}
                    onClick={() => handleSearch(undefined, name)}
                    className="px-4 py-2 bg-neutral-50 hover:bg-blue-50 text-neutral-600 hover:text-blue-600 rounded-full text-sm font-medium transition-all border border-neutral-100 hover:border-blue-100"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="manual-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-md mx-auto space-y-4"
          >
            <div className="relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-neutral-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Friend's Name (Optional)"
                className="w-full bg-white border-2 border-neutral-100 rounded-[2rem] py-5 pl-14 pr-6 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-lg shadow-neutral-200/50 text-neutral-900 text-lg font-medium placeholder:text-neutral-400"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <CalendarIcon className="w-5 h-5 text-neutral-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="w-full bg-white border-2 border-neutral-100 rounded-[2rem] py-5 pl-14 pr-14 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-lg shadow-neutral-200/50 text-neutral-900 text-lg font-medium"
              />
              {manualDate && (
                <button
                  onClick={() => setManualDate('')}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-2 hover:bg-neutral-100 rounded-full text-neutral-400 transition-colors"
                  title="Clear date"
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            {manualDate && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-blue-50/50 border border-blue-100/50 p-4 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-blue-600/60">Selected Date</p>
                    <p className="text-sm font-bold text-neutral-900">{format(new Date(manualDate), 'MMMM do, yyyy')}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-red-500 text-sm text-center font-medium"
          >
            {error}
          </motion.p>
        )}

        {diff && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-8 rounded-[2.5rem] border-2 border-blue-500/5 shadow-2xl shadow-blue-500/5 max-w-3xl mx-auto"
          >
            <div className="flex flex-col md:flex-row gap-8">
              {celebrity?.imageUrl && mode === 'celebrity' && (
                <div className="w-full md:w-48 h-48 rounded-[2rem] overflow-hidden bg-neutral-100 flex-shrink-0 border-4 border-white shadow-xl">
                  <img 
                    src={celebrity.imageUrl} 
                    alt={celebrity.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${celebrity.name}/200/200`;
                    }}
                  />
                </div>
              )}
              
              <div className="flex-grow space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    {celebrity && mode === 'celebrity' ? (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 bg-yellow-50 rounded-full flex items-center gap-1.5">
                            <Star className="w-3 h-3 text-yellow-600 fill-yellow-600" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-700">{celebrity.category}</span>
                          </div>
                        </div>
                        <h3 className="text-3xl font-bold font-serif text-neutral-900">{celebrity.name}</h3>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 bg-blue-50 rounded-full flex items-center gap-1.5">
                            <Users className="w-3 h-3 text-blue-600 fill-blue-600" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700">Manual Comparison</span>
                          </div>
                        </div>
                        <h3 className="text-3xl font-bold font-serif text-neutral-900">{manualName || 'Friend / Other'}</h3>
                      </>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
                      <p className="text-neutral-500 text-sm font-medium">Born: <span className="text-neutral-900">{format(diff.date, 'MMMM do, yyyy')}</span></p>
                      <p className="text-neutral-400 text-sm italic">Today: {format(new Date(), 'MMMM do, yyyy')}</p>
                    </div>
                  </div>
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                    <CalendarIcon className="w-7 h-7" />
                  </div>
                </div>

                {celebrity && mode === 'celebrity' && (
                  <div className="space-y-4">
                    <p className="text-neutral-600 text-base leading-relaxed">{celebrity.description}</p>
                    
                    <div className="flex flex-wrap gap-4">
                      {celebrity.nationality && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 rounded-xl text-xs font-semibold text-neutral-600">
                          <Globe className="w-3.5 h-3.5 text-blue-500" />
                          {celebrity.nationality}
                        </div>
                      )}
                      {celebrity.knownFor && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 rounded-xl text-xs font-semibold text-neutral-600">
                          <Info className="w-3.5 h-3.5 text-indigo-500" />
                          {celebrity.knownFor}
                        </div>
                      )}
                    </div>

                    {celebrity.achievements && celebrity.achievements.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-[10px] uppercase tracking-widest font-black text-neutral-400">Key Achievements</p>
                        <div className="flex flex-wrap gap-2">
                          {celebrity.achievements.map((ach, i) => (
                            <span key={i} className="text-[10px] bg-blue-50/50 border border-blue-100 px-3 py-1.5 rounded-lg text-blue-700 font-bold flex items-center gap-2">
                              <Award className="w-3 h-3" /> {ach}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-100 p-8 rounded-[2rem] relative group shadow-sm overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                  <div className="relative z-10">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-blue-600 font-bold mb-3">Comparison Result</p>
                    
                    {diff.noUserDate ? (
                      <div className="space-y-3">
                        <p className="text-lg text-neutral-700">
                          Enter your birthday above to see how you compare with {celebrity ? celebrity.name : 'this date'}.
                        </p>
                        <div className="h-1 w-12 bg-blue-500 rounded-full" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xl font-medium text-neutral-700">
                          You are <span className="text-blue-600 font-bold underline decoration-blue-200 underline-offset-4">{diff.isOlder ? 'older' : 'younger'}</span> than them by:
                        </p>
                        <p className="text-4xl font-bold text-blue-600 tracking-tight">
                          {diff.years}y {diff.months}m {diff.days}d {diff.hours}h
                        </p>
                      </div>
                    )}
                    
                    {visualizationUrl && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-6 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl"
                      >
                        <img src={visualizationUrl} alt="Age Visualization" className="w-full h-auto object-cover" />
                      </motion.div>
                    )}

                    {!diff.noUserDate && (
                      <div className="flex flex-wrap justify-end gap-3 pt-4">
                        <button
                          onClick={handleGenerateVisualization}
                          disabled={visualizing}
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl hover:from-indigo-700 hover:to-blue-700 transition-all text-white shadow-lg shadow-blue-500/20 font-bold text-sm disabled:opacity-50"
                        >
                          {visualizing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Visualizing...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              <span>Generate AI Art</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleShare}
                          className="flex items-center gap-2 px-6 py-3 bg-white rounded-2xl hover:bg-blue-100 transition-all text-blue-600 border-2 border-blue-100 shadow-sm font-bold text-sm"
                        >
                          {copied ? (
                            <>
                              <Check className="w-4 h-4 text-green-600" />
                              <span className="text-green-600">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-4 h-4" />
                              <span>Share Comparison</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!onToast && (
        <Toast 
          message={localToast.message}
          type={localToast.type}
          isVisible={localToast.isVisible}
          onClose={() => setLocalToast(prev => ({ ...prev, isVisible: false }))}
        />
      )}
    </div>
  );
};
