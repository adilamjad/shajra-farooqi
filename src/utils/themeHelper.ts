export type ThemeMode = 'dark' | 'light' | 'custom';

export interface CustomThemeConfig {
  name?: string;
  isLight: boolean;
  bgPrimary: string;
  bgSurface: string;
  bgCard: string;
  textPrimary: string;
  textSecondary: string;
  accentColor: string;
  maleColor: string;
  femaleColor: string;
}

export const DEFAULT_CUSTOM_THEME: CustomThemeConfig = {
  name: 'Emerald Heritage',
  isLight: false,
  bgPrimary: '#071311',
  bgSurface: '#0d211d',
  bgCard: '#132e29',
  textPrimary: '#ecfdf5',
  textSecondary: '#a7f3d0',
  accentColor: '#10b981',
  maleColor: '#38bdf8',
  femaleColor: '#f472b6'
};

export const CUSTOM_THEME_PRESETS: CustomThemeConfig[] = [
  DEFAULT_CUSTOM_THEME,
  {
    name: 'Royal Parchment (Warm Light)',
    isLight: true,
    bgPrimary: '#f7f3e9',
    bgSurface: '#efe8d8',
    bgCard: '#ffffff',
    textPrimary: '#292018',
    textSecondary: '#665544',
    accentColor: '#b45309',
    maleColor: '#1d4ed8',
    femaleColor: '#be185d'
  },
  {
    name: 'Midnight Sapphire',
    isLight: false,
    bgPrimary: '#060c1a',
    bgSurface: '#0f1b33',
    bgCard: '#17284a',
    textPrimary: '#f0f7ff',
    textSecondary: '#93c5fd',
    accentColor: '#3b82f6',
    maleColor: '#38bdf8',
    femaleColor: '#ec4899'
  },
  {
    name: 'Rosewood & Gold',
    isLight: false,
    bgPrimary: '#180c12',
    bgSurface: '#28141e',
    bgCard: '#381c2a',
    textPrimary: '#fdf2f8',
    textSecondary: '#fbcfe8',
    accentColor: '#f59e0b',
    maleColor: '#60a5fa',
    femaleColor: '#f472b6'
  },
  {
    name: 'Sage Botanical (Soft Light)',
    isLight: true,
    bgPrimary: '#f1f6f3',
    bgSurface: '#e3ede7',
    bgCard: '#ffffff',
    textPrimary: '#14261c',
    textSecondary: '#436250',
    accentColor: '#059669',
    maleColor: '#2563eb',
    femaleColor: '#db2777'
  }
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const num = parseInt(full, 16);
  if (isNaN(num)) return { r: 139, g: 92, b: 246 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

/**
 * Determine if a hex color is perceived as light (luminance > 0.5)
 */
export function isHexColorLight(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55;
}

/**
 * Applies the selected theme mode ('dark' | 'light' | 'custom') and custom theme variables to :root
 */
export function applyThemeToDocument(
  mode: ThemeMode,
  custom: CustomThemeConfig = DEFAULT_CUSTOM_THEME
): void {
  const root = document.documentElement;
  root.dataset.theme = mode;

  const meta = document.querySelector('meta[name="color-scheme"]') as HTMLMetaElement | null;

  const customProps = [
    '--bg-primary',
    '--bg-secondary',
    '--bg-card',
    '--bg-elevated',
    '--bg-input',
    '--bg-canvas-gradient',
    '--text-primary',
    '--text-secondary',
    '--text-muted',
    '--border-color',
    '--border-active',
    '--color-accent',
    '--color-accent-hover',
    '--color-accent-bg',
    '--color-male',
    '--color-male-bg',
    '--color-male-border',
    '--color-female',
    '--color-female-bg',
    '--color-female-border',
    '--spouse-line-color',
    '--child-line-color',
    '--surface-hover',
    '--card-shadow',
    '--glow-shadow'
  ];

  if (mode !== 'custom') {
    // Clear inline custom theme variables so CSS [data-theme="dark" | "light"] rules take over
    customProps.forEach((prop) => root.style.removeProperty(prop));
    if (meta) {
      meta.content = mode === 'light' ? 'light' : 'dark';
    }
    return;
  }

  // Compute and apply custom theme tokens
  const isLight = isHexColorLight(custom.bgPrimary);
  if (meta) {
    meta.content = isLight ? 'light' : 'dark';
  }

  const surfRgb = hexToRgb(custom.bgSurface);
  const cardRgb = hexToRgb(custom.bgCard);
  const accRgb = hexToRgb(custom.accentColor);
  const maleRgb = hexToRgb(custom.maleColor);
  const femRgb = hexToRgb(custom.femaleColor);

  root.style.setProperty('--bg-primary', custom.bgPrimary);
  root.style.setProperty(
    '--bg-secondary',
    `rgba(${surfRgb.r}, ${surfRgb.g}, ${surfRgb.b}, ${isLight ? 0.88 : 0.82})`
  );
  root.style.setProperty(
    '--bg-card',
    `rgba(${cardRgb.r}, ${cardRgb.g}, ${cardRgb.b}, ${isLight ? 0.94 : 0.88})`
  );
  root.style.setProperty('--bg-elevated', custom.bgSurface);
  root.style.setProperty(
    '--bg-input',
    isLight
      ? 'rgba(255, 255, 255, 0.85)'
      : `rgba(${surfRgb.r}, ${surfRgb.g}, ${surfRgb.b}, 0.72)`
  );
  root.style.setProperty(
    '--bg-canvas-gradient',
    `radial-gradient(circle at center, rgba(${accRgb.r}, ${accRgb.g}, ${accRgb.b}, ${
      isLight ? 0.08 : 0.12
    }) 0%, ${custom.bgPrimary} 100%)`
  );

  root.style.setProperty('--text-primary', custom.textPrimary);
  root.style.setProperty('--text-secondary', custom.textSecondary);
  root.style.setProperty(
    '--text-muted',
    isLight ? 'rgba(60, 60, 67, 0.6)' : 'rgba(200, 205, 215, 0.55)'
  );

  root.style.setProperty(
    '--border-color',
    isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)'
  );
  root.style.setProperty(
    '--border-active',
    `rgba(${accRgb.r}, ${accRgb.g}, ${accRgb.b}, 0.5)`
  );
  root.style.setProperty(
    '--surface-hover',
    isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.07)'
  );

  root.style.setProperty('--color-accent', custom.accentColor);
  root.style.setProperty('--color-accent-hover', custom.accentColor);
  root.style.setProperty(
    '--color-accent-bg',
    `rgba(${accRgb.r}, ${accRgb.g}, ${accRgb.b}, 0.16)`
  );

  root.style.setProperty('--color-male', custom.maleColor);
  root.style.setProperty(
    '--color-male-bg',
    `rgba(${maleRgb.r}, ${maleRgb.g}, ${maleRgb.b}, 0.15)`
  );
  root.style.setProperty(
    '--color-male-border',
    `rgba(${maleRgb.r}, ${maleRgb.g}, ${maleRgb.b}, 0.4)`
  );

  root.style.setProperty('--color-female', custom.femaleColor);
  root.style.setProperty(
    '--color-female-bg',
    `rgba(${femRgb.r}, ${femRgb.g}, ${femRgb.b}, 0.15)`
  );
  root.style.setProperty(
    '--color-female-border',
    `rgba(${femRgb.r}, ${femRgb.g}, ${femRgb.b}, 0.4)`
  );

  root.style.setProperty(
    '--spouse-line-color',
    isLight ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.22)'
  );
  root.style.setProperty(
    '--child-line-color',
    `rgba(${accRgb.r}, ${accRgb.g}, ${accRgb.b}, 0.45)`
  );

  root.style.setProperty(
    '--card-shadow',
    isLight
      ? '0 8px 24px rgba(0, 0, 0, 0.08)'
      : '0 8px 32px rgba(0, 0, 0, 0.42)'
  );
  root.style.setProperty(
    '--glow-shadow',
    `0 0 20px rgba(${accRgb.r}, ${accRgb.g}, ${accRgb.b}, 0.25)`
  );
}
