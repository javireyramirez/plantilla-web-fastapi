export interface ParsedDeviceInfo {
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  raw: string;
}

export function parseUserAgent(ua?: string | null): ParsedDeviceInfo {
  if (!ua) {
    return {
      browser: 'Desconocido',
      os: 'Desconocido',
      deviceType: 'unknown',
      raw: '',
    };
  }

  const raw = ua.trim();
  const lower = raw.toLowerCase();

  // 1. Detect OS
  let os = 'Desconocido';
  let deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'desktop';

  if (lower.includes('ipad')) {
    os = 'iPadOS';
    deviceType = 'tablet';
  } else if (lower.includes('iphone')) {
    os = 'iOS';
    deviceType = 'mobile';
  } else if (lower.includes('android')) {
    os = 'Android';
    deviceType = lower.includes('mobile') ? 'mobile' : 'tablet';
  } else if (lower.includes('windows nt 10.0')) {
    os = 'Windows 10/11';
  } else if (lower.includes('windows nt')) {
    os = 'Windows';
  } else if (lower.includes('macintosh') || lower.includes('mac os x')) {
    os = 'macOS';
  } else if (lower.includes('linux')) {
    os = 'Linux';
  }

  // 2. Detect Browser
  let browser = 'Desconocido';
  if (lower.includes('edg/') || lower.includes('edge/')) {
    const match = raw.match(/Edg(?:e)?\/([\d.]+)/);
    browser = match ? `Edge ${match[1].split('.')[0]}` : 'Edge';
  } else if (lower.includes('opr/') || lower.includes('opera/')) {
    const match = raw.match(/(?:OPR|Opera)\/([\d.]+)/);
    browser = match ? `Opera ${match[1].split('.')[0]}` : 'Opera';
  } else if (lower.includes('chrome/') || lower.includes('crios/')) {
    const match = raw.match(/(?:Chrome|CriOS)\/([\d.]+)/);
    browser = match ? `Chrome ${match[1].split('.')[0]}` : 'Chrome';
  } else if (lower.includes('firefox/') || lower.includes('fxios/')) {
    const match = raw.match(/(?:Firefox|FxiOS)\/([\d.]+)/);
    browser = match ? `Firefox ${match[1].split('.')[0]}` : 'Firefox';
  } else if (lower.includes('safari/') && !lower.includes('chrome')) {
    const match = raw.match(/Version\/([\d.]+)/);
    browser = match ? `Safari ${match[1].split('.')[0]}` : 'Safari';
  }

  return {
    browser,
    os,
    deviceType,
    raw,
  };
}

export interface SelectOption {
  value: string;
  label: string;
}

export function getSessionStatusOptions(t: (key: string, options?: any) => string): SelectOption[] {
  return [
    { value: 'true', label: t('sessions.statusOptions.active', { defaultValue: 'Activas' }) },
    { value: 'false', label: t('sessions.statusOptions.revoked', { defaultValue: 'Revocadas / Expiradas' }) },
  ];
}
