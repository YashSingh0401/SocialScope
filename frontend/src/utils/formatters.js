export const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi (हिंदी)',
  fr: 'French',
  de: 'German',
  ar: 'Arabic',
  it: 'Italian',
  es: 'Spanish',
  pt: 'Portuguese',
  und: 'Undetermined',
  pending: 'Pending Analysis'
};

export function formatLanguage(code) {
  if (!code) return 'Undetermined';
  return LANGUAGE_NAMES[code] || code.toUpperCase();
}

export function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? String(isoString) : d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  } catch {
    return String(isoString);
  }
}

export function formatTimeOnly(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? String(isoString) : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return String(isoString);
  }
}

export function formatPercentage(val) {
  if (val == null || isNaN(val)) return '0%';
  return `${Math.round(val * 100)}%`;
}

export function getThreatColor(severity) {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL':
      return { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', badge: '#dc2626' };
    case 'HIGH':
      return { bg: '#ffedd5', border: '#f97316', text: '#9a3412', badge: '#ea580c' };
    case 'MEDIUM':
      return { bg: '#fef9c3', border: '#eab308', text: '#854d0e', badge: '#ca8a04' };
    default:
      return { bg: '#f1f5f9', border: '#94a3b8', text: '#334155', badge: '#64748b' };
  }
}

export function getScoreColor(score) {
  if (score >= 75) return '#ef4444';
  if (score >= 50) return '#f97316';
  if (score >= 25) return '#eab308';
  return '#10b981';
}
