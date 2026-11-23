import React, { useState, useEffect } from 'react';
import { useFilters } from './context/FilterContext';
import { api } from './services/api';
import Sidebar from './components/Sidebar';
import TopScopeBar from './components/TopScopeBar';

// 17 Specification Pages
import Overview from './pages/Overview';
import TrendRadar from './pages/TrendRadar';
import TopicExplorer from './pages/TopicExplorer';
import NarrativeTimeline from './pages/NarrativeTimeline';
import Audience from './pages/Audience';
import Network from './pages/Network';
import Alerts from './pages/Alerts';
import Investigation from './pages/Investigation';
import Reports from './pages/Reports';
import SourcesAndReplay from './pages/SourcesAndReplay';
import ComparePlatforms from './pages/ComparePlatforms';
import RedditAnalysis from './pages/RedditAnalysis';
import YouTubeAnalysis from './pages/YouTubeAnalysis';
import TelegramAnalysis from './pages/TelegramAnalysis';
import XAnalysis from './pages/XAnalysis';
import InstagramAnalysis from './pages/InstagramAnalysis';
import FacebookAnalysis from './pages/FacebookAnalysis';

function getRouteFromHash() {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash || hash === '/' || hash === '') return '/overview';
  return hash;
}

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(getRouteFromHash());
  const [isConnected, setIsConnected] = useState(false);
  const [activeAlertId, setActiveAlertId] = useState('alert_cluster_top-01');

  // Live state from backend
  const [overviewData, setOverviewData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [topicsData, setTopicsData] = useState(null);
  const [networkData, setNetworkData] = useState(null);
  const [alertsData, setAlertsData] = useState(null);

  const { queryString, refreshKey, clearPlatformFilters } = useFilters();

  // Listen for browser back / forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const newRoute = getRouteFromHash();
      setCurrentRoute(newRoute);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (route) => {
    // If navigating to/from dedicated platform, clear platform-only filters
    if (route.startsWith('/platforms/') || currentRoute.startsWith('/platforms/')) {
      clearPlatformFilters();
    }
    window.location.hash = route;
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Poll or fetch data from FastAPI backend
  useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        const [o, tr, top, net, alt] = await Promise.all([
          api.getOverview(queryString).catch(() => null),
          api.getTrends().catch(() => null),
          api.getTopics().catch(() => null),
          api.getNetwork().catch(() => null),
          api.getAlerts().catch(() => null)
        ]);

        if (active) {
          if (o) setOverviewData(o);
          if (tr) setTrendsData(tr);
          if (top) setTopicsData(top);
          if (net) setNetworkData(net);
          if (alt) setAlertsData(alt);
          setIsConnected(true);
        }
      } catch {
        if (active) setIsConnected(false);
      }
    }

    fetchData();
  }, [queryString, refreshKey]);

  const handleSelectAlert = (id) => {
    setActiveAlertId(id);
    navigateTo(`/investigations/${id}`);
  };

  // Route matching
  const renderCurrentPage = () => {
    if (currentRoute === '/overview') {
      return (
        <Overview
          overview={overviewData}
          trends={trendsData}
          alerts={alertsData}
          onNavigate={navigateTo}
          onSelectAlert={handleSelectAlert}
        />
      );
    }
    if (currentRoute === '/trends') {
      return <TrendRadar trends={trendsData} topics={topicsData} onNavigate={navigateTo} />;
    }
    if (currentRoute === '/topics') {
      return <TopicExplorer topics={topicsData} onNavigate={navigateTo} />;
    }
    if (currentRoute === '/narratives') {
      return <NarrativeTimeline onNavigate={navigateTo} />;
    }
    if (currentRoute === '/audience') {
      return <Audience onNavigate={navigateTo} />;
    }
    if (currentRoute === '/network') {
      return <Network networkData={networkData} onNavigate={navigateTo} />;
    }
    if (currentRoute === '/alerts') {
      return <Alerts alertsData={alertsData} onSelectAlert={handleSelectAlert} onNavigate={navigateTo} />;
    }
    if (currentRoute.startsWith('/investigations')) {
      const parts = currentRoute.split('/');
      const id = parts[2] || activeAlertId || 'alert_cluster_top-01';
      return <Investigation alertId={id} onNavigate={navigateTo} />;
    }
    if (currentRoute === '/reports') {
      return <Reports onNavigate={navigateTo} />;
    }
    if (currentRoute === '/sources') {
      return <SourcesAndReplay onNavigate={navigateTo} />;
    }
    if (currentRoute === '/compare') {
      return <ComparePlatforms onNavigate={navigateTo} />;
    }
    // Dedicated Platforms
    if (currentRoute === '/platforms/reddit') {
      return <RedditAnalysis onNavigate={navigateTo} />;
    }
    if (currentRoute === '/platforms/youtube') {
      return <YouTubeAnalysis onNavigate={navigateTo} />;
    }
    if (currentRoute === '/platforms/telegram') {
      return <TelegramAnalysis onNavigate={navigateTo} />;
    }
    if (currentRoute === '/platforms/x') {
      return <XAnalysis onNavigate={navigateTo} />;
    }
    if (currentRoute === '/platforms/instagram') {
      return <InstagramAnalysis onNavigate={navigateTo} />;
    }
    if (currentRoute === '/platforms/facebook') {
      return <FacebookAnalysis onNavigate={navigateTo} />;
    }

    // Default fallback
    return (
      <Overview
        overview={overviewData}
        trends={trendsData}
        alerts={alertsData}
        onNavigate={navigateTo}
        onSelectAlert={handleSelectAlert}
      />
    );
  };

  return (
    <div className="app-shell">
      {/* 224px Persistent Left Rail Navigation */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={navigateTo}
        alertsCount={2}
        spikesCount={1}
      />

      <div className="main-wrapper">
        {/* Top Scope Bar: Dataset, Replay/Live mode, Date Range, Language, Timezone */}
        <TopScopeBar
          isConnected={isConnected}
          onOpenSources={() => navigateTo('/sources')}
        />

        {/* Dynamic Specification Screen View */}
        <main role="main">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
}
