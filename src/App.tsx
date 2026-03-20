import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Calendar, Sparkles, RefreshCcw, Camera, Share2, Info } from 'lucide-react';
import { AgeDisplay } from './components/AgeDisplay';
import { CelebrityComparison } from './components/CelebrityComparison';
import { TimezoneInfo } from './components/TimezoneInfo';
import { AdPlaceholder } from './components/AdPlaceholder';
import { Toast, ToastType } from './components/Toast';
import { calculateDetailedAge } from './utils/ageUtils';
import { AgeResult } from './types';
import { generateAgeVisualization } from './services/geminiService';

export default function App() {
  const [birthDate, setBirthDate] = useState<string>('');
  const [age, setAge] = useState<AgeResult | null>(null);
  const [isCalculated, setIsCalculated] = useState(false);
  const [visualImage, setVisualImage] = useState<string | null>(null);
  const [generatingVisual, setGeneratingVisual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false
  });
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const d = params.get('d');
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
      setBirthDate(d);
      setIsCalculated(true);
    }
  }, []);

  useEffect(() => {
    if (isCalculated && birthDate) {
      const updateAge = () => {
        const date = new Date(birthDate);
        try {
          if (!isNaN(date.getTime())) {
            setAge(calculateDetailedAge(date, new Date()));
            setError(null);
          }
        } catch (err: any) {
          setError(err.message);
          setIsCalculated(false);
        }
      };

      updateAge();
      timerRef.current = setInterval(updateAge, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCalculated, birthDate]);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (birthDate) {
      setError(null);
      setIsCalculated(true);
    }
  };

  const handleReset = () => {
    setIsCalculated(false);
    setAge(null);
    setBirthDate('');
    setVisualImage(null);
    setError(null);
  };

  const handleGenerateVisual = async () => {
    if (!age) return;
    setGeneratingVisual(true);
    setError(null);
    try {
      const description = `${age.years} years, ${age.months} months, and ${age.days} days old`;
      const img = await generateAgeVisualization(description);
      setVisualImage(img);
      showToast('AI Visualization generated!', 'success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeneratingVisual(false);
    }
  };

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type, isVisible: true });
  };

  const handleShare = async () => {
    if (!age || !birthDate) return;
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?d=${birthDate}`;
    const text = `I am exactly ${age.years} years, ${age.months} months, and ${age.days} days old! Check your exact age at Chronos Age Master.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Chronos Age Master',
          text: text,
          url: shareUrl
        });
        showToast('Shared successfully!', 'success');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard(shareUrl, 'Link copied to clipboard!');
        }
      }
    } else {
      copyToClipboard(shareUrl, 'Link copied to clipboard!');
    }
  };

  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMessage, 'success');
    } catch (err) {
      // Fallback for older browsers or restricted environments
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
      } catch (fallbackErr) {
        showToast('Failed to copy link', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 transition-colors duration-300 bg-white">
      {/* Header */}
      <header className="py-6 px-4 border-b border-neutral-100 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Calendar className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight font-serif italic text-neutral-900">Chronos Age Master</h1>
            </div>
          </div>
          <TimezoneInfo />
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-12 space-y-12">
        {/* Top Ad Section */}
        <AdPlaceholder slot="top-banner" className="w-full h-24" />

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-100 p-4 rounded-2xl text-red-600 text-center text-sm font-medium"
          >
            {error}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Input & Results */}
          <div className="lg:col-span-8 space-y-12">
            {!isCalculated ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8 md:p-12 rounded-[2.5rem] text-center space-y-8"
              >
                <div className="max-w-md mx-auto space-y-4">
                  <h2 className="text-4xl md:text-5xl font-bold font-serif leading-tight text-neutral-900">
                    Discover your <span className="text-blue-600 italic underline decoration-blue-100 underline-offset-8">exact</span> place in time.
                  </h2>
                  <p className="text-neutral-500 leading-relaxed">
                    Enter your birth date to calculate your age down to the second, compare with legends, and visualize your journey.
                  </p>
                </div>

                <form onSubmit={handleCalculate} className="max-w-sm mx-auto space-y-4">
                  <div className="relative group">
                    <input
                      type="date"
                      required
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full bg-white border border-neutral-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-lg font-medium text-neutral-900 placeholder:text-neutral-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-4 px-8 rounded-2xl font-bold text-lg hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-500/10 flex items-center justify-center gap-2"
                  >
                    Calculate Age <Sparkles className="w-5 h-5 text-white/80" />
                  </button>
                </form>
              </motion.div>
            ) : (
              <div className="space-y-12">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-blue-600 mb-1">Live Age Tracking</p>
                    <h2 className="text-3xl font-bold font-serif text-neutral-900">Your Journey So Far</h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                      <p className="text-neutral-500 text-sm italic">Born: {format(new Date(birthDate), 'MMMM do, yyyy')}</p>
                      <p className="text-neutral-400 text-sm italic">Today: {format(new Date(), 'MMMM do, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleShare}
                      className="p-3 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                      title="Share your age"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={handleReset}
                      className="p-3 bg-neutral-50 rounded-full hover:bg-neutral-100 transition-colors text-neutral-600"
                      title="Reset"
                    >
                      <RefreshCcw className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>

                {age && <AgeDisplay age={age} />}

                {/* AI Visualization Section */}
                <div className="glass-card p-8 rounded-[2.5rem] space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold font-serif text-neutral-900">AI Age Visualization</h3>
                      <p className="text-sm text-neutral-500">Generate a unique artistic representation of your time on Earth.</p>
                    </div>
                    <button
                      onClick={handleGenerateVisual}
                      disabled={generatingVisual}
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {generatingVisual ? 'Generating...' : 'Visualize'} <Camera className="w-4 h-4" />
                    </button>
                  </div>

                  <AnimatePresence>
                    {visualImage && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative aspect-video rounded-3xl overflow-hidden bg-neutral-50 border border-neutral-100"
                      >
                        <img 
                          src={visualImage} 
                          alt="AI Visualization" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 to-transparent flex items-end p-6">
                          <p className="text-white/90 text-xs italic">Artistic interpretation of {age?.years} years of life</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Middle Ad Section */}
            <AdPlaceholder slot="content-middle" className="w-full h-48" />

            {/* Comparison Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                  <Share2 className="w-4 h-4" />
                </div>
                <h3 className="text-xl font-bold font-serif text-neutral-900">Legendary Comparisons</h3>
              </div>
              <CelebrityComparison 
                userBirthDate={isCalculated && birthDate ? new Date(birthDate) : null} 
                onToast={showToast}
              />
            </div>
          </div>

          {/* Right Column: Sidebar Ads & Info */}
          <div className="lg:col-span-4 space-y-8">
            <div className="sticky top-32 space-y-8">
              <AdPlaceholder slot="sidebar-top" className="w-full h-[400px]" />
              
              <div className="bg-blue-600 text-white p-8 rounded-[2rem] space-y-4 shadow-xl shadow-blue-500/20">
                <Info className="w-6 h-6 text-white/80" />
                <h4 className="text-lg font-bold font-serif">Did you know?</h4>
                <p className="text-sm text-white/90 leading-relaxed">
                  The average human heart beats about 2.5 billion times in a lifetime. Every second you spend here is a unique moment in the history of the universe.
                </p>
              </div>

              <AdPlaceholder slot="sidebar-bottom" className="w-full h-[250px]" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-50 border-t border-neutral-100 py-12 px-4 mt-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-neutral-900" />
              <span className="font-bold font-serif italic">Chronos Age Master</span>
            </div>
            <p className="text-sm text-neutral-500 max-w-xs">
              The ultimate tool for tracking your most precious asset: Time.
            </p>
          </div>
          
          <div className="space-y-4">
            <h5 className="font-bold text-sm uppercase tracking-widest text-neutral-900">Legal</h5>
            <ul className="text-sm text-neutral-500 space-y-2">
              <li><a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Cookie Policy</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h5 className="font-bold text-sm uppercase tracking-widest text-neutral-900">Connect</h5>
            <p className="text-sm text-neutral-500">
              Built with precision and AI for the modern web.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-neutral-100 text-center text-xs text-neutral-400">
          © {new Date().getFullYear()} Chronos Age Master. All rights reserved.
        </div>
      </footer>

      <Toast 
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
