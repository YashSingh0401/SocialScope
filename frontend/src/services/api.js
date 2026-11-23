export async function request(path, options = {}) {
  const url = path;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  };
  if (options.body && typeof options.body !== 'string') {
    config.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, config);
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('Server did not return valid JSON. Verify backend is running.');
  }

  if (!res.ok) {
    const msg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail || data);
    throw new Error(msg || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  getOverview: (query = '') => request(`/analytics/overview${query ? '?' + query : ''}`),
  getEvents: (query = '', limit = 20, offset = 0) => request(`/analytics/events?limit=${limit}&offset=${offset}${query ? '&' + query : ''}`),
  getTopics: (limit = 200) => request(`/analytics/topics?limit=${limit}`),
  getTrends: () => request('/analytics/trends'),
  getNetwork: (limit = 200) => request(`/analytics/network?limit=${limit}`),
  getAlerts: (limit = 200) => request(`/analytics/alerts?limit=${limit}`),
  getReport: (alertId) => request(`/analytics/reports/${encodeURIComponent(alertId)}`),
  generateReport: (payload) => request('/analytics/reports', { method: 'POST', body: payload }),
  getAudience: () => request('/analytics/audience'),
  getNarrative: (limit = 300) => request(`/analytics/narrative?limit=${limit}`),
  getInvestigations: () => request('/analytics/investigations'),
  getInvestigation: (id) => request(`/analytics/investigations/${encodeURIComponent(id)}`),
  postInvestigation: (payload) => request('/analytics/investigations', { method: 'POST', body: payload }),
  getSources: () => request('/analytics/sources'),
  getCompare: (platforms = 'reddit,youtube,telegram,x,instagram,facebook') => request(`/analytics/compare?platforms=${encodeURIComponent(platforms)}`),
  getPlatformAnalysis: (platform) => request(`/analytics/platforms/${encodeURIComponent(platform)}`),
  getReplays: () => request('/replays'),
  createReplay: (payload) => request('/replays', { method: 'POST', body: payload }),
  controlReplay: (id, action) => request(`/replays/${id}/${action}`, { method: 'POST' }),
  importEvents: (payload) => request('/events/import', { method: 'POST', body: payload })
};

export const DEMO_EVENTS = [
  {
    platform: 'twitter',
    source_id: 'tw-101',
    actor_ref: 'disinfo_seed_01',
    timestamp: '2026-03-01T08:00:00Z',
    text: 'BREAKING: Critical security breach reported in central communications grid. Do not trust updates.',
    hashtags: ['securityalert', 'blackout', 'alert'],
    interactions: [{ kind: 'mention', target_type: 'actor', target_source_id: 'amplifier_bot_99', target_platform: 'twitter' }]
  },
  {
    platform: 'telegram',
    source_id: 'tg-102',
    actor_ref: 'amplifier_bot_99',
    timestamp: '2026-03-01T08:01:15Z',
    text: 'BREAKING: Critical security breach reported in central communications grid. Do not trust updates.',
    hashtags: ['securityalert', 'grid'],
    interactions: [{ kind: 'reply', target_type: 'actor', target_source_id: 'disinfo_seed_01', target_platform: 'telegram' }]
  },
  {
    platform: 'twitter',
    source_id: 'tw-103',
    actor_ref: 'bot_relay_44',
    timestamp: '2026-03-01T08:01:45Z',
    text: 'BREAKING: Critical security breach reported in central communications grid. Do not trust updates.',
    hashtags: ['blackout', 'breaking'],
    interactions: [{ kind: 'share', target_type: 'actor', target_source_id: 'disinfo_seed_01', target_platform: 'twitter' }]
  },
  {
    platform: 'reddit',
    source_id: 'rd-104',
    actor_ref: 'citizen_observer',
    timestamp: '2026-03-01T08:15:00Z',
    text: 'Seeing suspicious copy-paste posts regarding a grid blackout. Local power is functioning completely normally.',
    hashtags: ['factcheck', 'local'],
    interactions: [{ kind: 'reply', target_type: 'actor', target_source_id: 'disinfo_seed_01', target_platform: 'reddit' }]
  },
  {
    platform: 'twitter',
    source_id: 'tw-105',
    actor_ref: 'official_press',
    timestamp: '2026-03-01T08:30:00Z',
    text: 'Notice: All operational networks and grid stations are operating under standard protocols without interruption.',
    hashtags: ['pressrelease', 'status'],
    interactions: [{ kind: 'share', target_type: 'actor', target_source_id: 'citizen_observer', target_platform: 'twitter' }]
  },
  {
    platform: 'dataset',
    source_id: 'hi-106',
    actor_ref: 'samachar_hindi',
    timestamp: '2026-03-01T08:35:00Z',
    text: 'अधिकारिक सूचना: विद्युत एवं संचार व्यवस्था पूरी तरह से सुरक्षित और सुचारू रूप से कार्य कर रही है। किसी भी अफ़वाह पर ध्यान न दें।',
    hashtags: ['सूचना', 'समाचार'],
    interactions: [{ kind: 'share', target_type: 'actor', target_source_id: 'official_press', target_platform: 'dataset' }]
  }
];
