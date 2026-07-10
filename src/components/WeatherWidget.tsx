import { useEffect, useState } from 'react';
import { siteConfig } from '../site.config';

interface WeatherData {
  city: string;
  wea: string;
  wea_img: string;
  tem: string;
}

/**
 * Live weather widget — fetches from yiketianqi free API.
 * Degrades gracefully: if the API fails, the widget hides itself.
 * Renders an animated SVG scene based on the weather code.
 */
export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const { apiUrl, appId, appSecret } = siteConfig.weather;
    const url = `${apiUrl}?unescape=1&version=v61&appid=${appId}&appsecret=${appSecret}`;

    fetch(url)
      .then((res) => res.json())
      .then((data: WeatherData) => {
        if (data && data.city) {
          setWeather(data);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true));
  }, []);

  if (error || !weather) return null;

  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[rgba(22,33,62,0.6)] px-4 py-2 backdrop-blur-sm"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <WeatherScene code={weather.wea_img} />
      <div className="flex flex-col text-sm">
        <span className="text-[var(--color-paper)]">{weather.city}</span>
        <span className="text-[var(--color-paper-dim)]">
          {weather.tem}° {weather.wea}
        </span>
      </div>
    </div>
  );
}

/**
 * Animated SVG weather scene.
 * Maps the API's pinyin weather code to an SVG illustration.
 */
function WeatherScene({ code }: { code: string }) {
  const scene = getWeatherScene(code);

  return (
    <div className="h-8 w-8" dangerouslySetInnerHTML={{ __html: scene }} />
  );
}

function getWeatherScene(code: string): string {
  // yiketianqi uses pinyin weather codes: qing, yun, yin, wu, lei, yu, xue, etc.
  const size = 32;

  switch (code) {
    case 'qing':
      // Sun with rotating rays
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#ffd700" stroke-width="2">
        <circle cx="12" cy="12" r="4" fill="#ffd700"/>
        <g style="transform-origin: 12px 12px; animation: spin 8s linear infinite;">
          <line x1="12" y1="2" x2="12" y2="5"/>
          <line x1="12" y1="19" x2="12" y2="22"/>
          <line x1="2" y1="12" x2="5" y2="12"/>
          <line x1="19" y1="12" x2="22" y2="12"/>
          <line x1="4.9" y1="4.9" x2="7" y2="7"/>
          <line x1="17" y1="17" x2="19.1" y2="19.1"/>
          <line x1="4.9" y1="19.1" x2="7" y2="17"/>
          <line x1="17" y1="7" x2="19.1" y2="4.9"/>
        </g>
        <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
      </svg>`;

    case 'yu':
      // Rain cloud
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#699bff" stroke-width="2">
        <path d="M16 13a4 4 0 0 0 0-8 6 6 0 0 0-11.3 2A4 4 0 0 0 6 15h10" fill="rgba(105,155,255,0.2)"/>
        <line x1="8" y1="18" x2="8" y2="21" stroke="#699bff"/>
        <line x1="12" y1="18" x2="12" y2="22" stroke="#699bff"/>
        <line x1="16" y1="18" x2="16" y2="21" stroke="#699bff"/>
      </svg>`;

    case 'xue':
      // Snow cloud
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#e5e7eb" stroke-width="2">
        <path d="M16 13a4 4 0 0 0 0-8 6 6 0 0 0-11.3 2A4 4 0 0 0 6 15h10" fill="rgba(229,231,235,0.2)"/>
        <text x="7" y="21" font-size="6" fill="#e5e7eb" stroke="none">❄</text>
        <text x="12" y="22" font-size="6" fill="#e5e7eb" stroke="none">❄</text>
        <text x="16" y="21" font-size="6" fill="#e5e7eb" stroke="none">❄</text>
      </svg>`;

    case 'lei':
      // Thunder
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#ff6821" stroke-width="2">
        <path d="M16 13a4 4 0 0 0 0-8 6 6 0 0 0-11.3 2A4 4 0 0 0 6 15h10" fill="rgba(255,104,33,0.2)"/>
        <polyline points="13,14 9,21 11,21 8,24" fill="#ff6821" stroke="#ff6821"/>
      </svg>`;

    case 'yun':
    case 'yin':
    case 'wu':
      // Cloud
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2">
        <path d="M16 13a4 4 0 0 0 0-8 6 6 0 0 0-11.3 2A4 4 0 0 0 6 15h10" fill="rgba(156,163,175,0.2)"/>
      </svg>`;

    default:
      // Windy / default
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#699bff" stroke-width="2">
        <path d="M3 8h12a3 3 0 1 0-3-3"/>
        <path d="M3 14h16a3 3 0 1 1-3 3"/>
        <path d="M3 11h8"/>
      </svg>`;
  }
}
