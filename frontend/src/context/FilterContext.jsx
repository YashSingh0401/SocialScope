import React, { createContext, useContext, useState } from 'react';

const FilterContext = createContext(null);

export function FilterProvider({ children }) {
  const [language, setLanguage] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [platform, setPlatform] = useState('');
  const [search, setSearch] = useState('');
  const [activeAlertId, setActiveAlertId] = useState(null);
  const [activeTopicId, setActiveTopicId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const queryParams = new URLSearchParams();
  if (language) queryParams.set('language', language);
  if (sentiment) queryParams.set('sentiment', sentiment);
  if (platform) queryParams.set('platform', platform);
  const queryString = queryParams.toString();

  const resetFilters = () => {
    setLanguage('');
    setSentiment('');
    setPlatform('');
    setSearch('');
  };

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <FilterContext.Provider
      value={{
        language,
        setLanguage,
        sentiment,
        setSentiment,
        platform,
        setPlatform,
        search,
        setSearch,
        activeAlertId,
        setActiveAlertId,
        activeTopicId,
        setActiveTopicId,
        queryString,
        resetFilters,
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
