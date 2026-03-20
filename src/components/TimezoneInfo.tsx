import React, { useState, useEffect } from 'react';
import { MapPin, Globe, Clock, Navigation } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';

export const TimezoneInfo: React.FC = () => {
  const [info, setInfo] = useState({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    region: 'Detecting...',
    currentTime: new Date(),
    location: null as { lat: number; lng: number } | null
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setInfo(prev => ({ ...prev, currentTime: new Date() }));
    }, 1000);

    // Basic region detection from timezone
    const parts = info.timezone.split('/');
    const region = parts[0].replace('_', ' ');
    const city = parts[1]?.replace('_', ' ') || '';
    setInfo(prev => ({ ...prev, region: `${city}${city ? ', ' : ''}${region}` }));

    return () => clearInterval(timer);
  }, [info.timezone]);

  const requestLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setInfo(prev => ({
          ...prev,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }));
        // In a real app, we'd reverse geocode here. 
        // For now, we'll stick to the timezone-based region but acknowledge the precise location.
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-6 items-center justify-center text-neutral-700 text-sm">
      <button 
        onClick={requestLocation}
        className="flex items-center gap-2 hover:text-blue-600 transition-colors group"
      >
        <MapPin className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
        <span className="font-medium">{info.region}</span>
        {info.location && (
          <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md font-mono">
            {info.location.lat.toFixed(2)}, {info.location.lng.toFixed(2)}
          </span>
        )}
      </button>
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-indigo-500" />
        <span className="font-mono">{info.timezone}</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-pink-500" />
        <span className="font-mono">{formatInTimeZone(info.currentTime, info.timezone, 'HH:mm:ss')}</span>
      </div>
    </div>
  );
};
