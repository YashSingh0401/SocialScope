import React, { createContext, useContext, useState, useEffect } from 'react';

const FilterContext = createContext(null);

export function FilterProvider({ children }) {
  const [dataset, setDataset] = useState('power-grid-campaign-2026');
  const [mode, setMode] = useState('replay'); // 'live' or 'replay'
  const [dateRange, setDateRange] = useState('last-7-days');
  const [language, setLanguage] = useState('all');
  const [timezone, setTimezone] = useState('UTC');
  const [platform, setPlatform] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [search, setSearch] = useState('');
  const [activeAlertId, setActiveAlertId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync with URL query parameters or hash where helpful
  const queryParams = new URLSearchParams();
  if (language && language !== 'all') queryParams.set('language', language);
  if (sentiment) queryParams.set('sentiment', sentiment);
  if (platform) queryParams.set('platform', platform);
  const queryString = queryParams.toString();

  const resetFilters = () => {
    setLanguage('all');
    setSentiment('');
    setPlatform('');
    setSearch('');
  };

  const clearPlatformFilters = () => {
    setPlatform('');
  };

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <FilterContext.Provider
      value={{
        dataset,
        setDataset,
        mode,
        setMode,
        dateRange,
        setDateRange,
        language,
        setLanguage,
        timezone,
        setTimezone,
        platform,
        setPlatform,
        sentiment,
        setSentiment,
        search,
        setSearch,
        activeAlertId,
        setActiveAlertId,
        queryString,
        resetFilters,
        clearPlatformFilters,
        refreshKey,
        triggerRefresh
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
}
