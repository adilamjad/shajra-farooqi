import React from 'react';
import { X, Sun, Moon, Palette, RotateCcw, Check, Sparkles } from 'lucide-react';
import {
  DEFAULT_CUSTOM_THEME,
  CUSTOM_THEME_PRESETS
} from '../utils/themeHelper';
import './ThemeModal.css';

export default function ThemeModal({
  themeMode,
  setThemeMode,
  customTheme,
  setCustomTheme,
  onClose
}) {
  const handleColorChange = (key, value) => {
    setThemeMode('custom');
    setCustomTheme((prev) => ({
      ...prev,
      name: 'Custom Palette',
      [key]: value
    }));
  };

  const handleApplyPreset = (preset) => {
    setThemeMode('custom');
    setCustomTheme({ ...preset });
  };

  const handleResetCustom = () => {
    setThemeMode('custom');
    setCustomTheme({ ...DEFAULT_CUSTOM_THEME });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-panel theme-modal animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="theme-modal-title"
      >
        <div className="modal-header">
          <div className="theme-header-title">
            <Palette size={20} className="theme-header-icon" />
            <div>
              <h2 id="theme-modal-title">Appearance &amp; Theme Studio</h2>
              <p className="theme-header-sub">
                Choose Light, Dark, or craft a Custom color palette for your family tree
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-close" title="Close">
            <X size={20} />
          </button>
        </div>

        <div className="theme-modal-body">
          {/* 1. Primary Mode Selector: Light, Dark, Custom */}
          <div className="theme-modes-grid">
            {/* Dark Mode Card */}
            <button
              type="button"
              className={`theme-mode-card ${themeMode === 'dark' ? 'active' : ''}`}
              onClick={() => setThemeMode('dark')}
            >
              <div className="mode-preview-swatch swatch-dark">
                <div className="swatch-card-mini" />
                <div className="swatch-accent-dot" />
              </div>
              <div className="mode-card-meta">
                <div className="mode-card-title">
                  <Moon size={15} />
                  <span>Dark Theme</span>
                </div>
                <span className="mode-card-desc">
                  Deep obsidian canvas with violet glassmorphic cards
                </span>
              </div>
              {themeMode === 'dark' && (
                <span className="mode-active-check">
                  <Check size={14} />
                </span>
              )}
            </button>

            {/* Light Mode Card */}
            <button
              type="button"
              className={`theme-mode-card ${themeMode === 'light' ? 'active' : ''}`}
              onClick={() => setThemeMode('light')}
            >
              <div className="mode-preview-swatch swatch-light">
                <div className="swatch-card-mini" />
                <div className="swatch-accent-dot" />
              </div>
              <div className="mode-card-meta">
                <div className="mode-card-title">
                  <Sun size={15} />
                  <span>Light Theme</span>
                </div>
                <span className="mode-card-desc">
                  Crisp alabaster canvas with soft shadows &amp; high contrast
                </span>
              </div>
              {themeMode === 'light' && (
                <span className="mode-active-check">
                  <Check size={14} />
                </span>
              )}
            </button>

            {/* Custom Mode Card */}
            <button
              type="button"
              className={`theme-mode-card ${themeMode === 'custom' ? 'active' : ''}`}
              onClick={() => setThemeMode('custom')}
            >
              <div
                className="mode-preview-swatch"
                style={{ background: customTheme.bgPrimary }}
              >
                <div
                  className="swatch-card-mini"
                  style={{
                    background: customTheme.bgCard,
                    borderColor: customTheme.accentColor
                  }}
                />
                <div
                  className="swatch-accent-dot"
                  style={{ background: customTheme.accentColor }}
                />
              </div>
              <div className="mode-card-meta">
                <div className="mode-card-title">
                  <Palette size={15} />
                  <span>Custom Theme</span>
                </div>
                <span className="mode-card-desc">
                  {customTheme.name || 'Personalized colors & accents'}
                </span>
              </div>
              {themeMode === 'custom' && (
                <span className="mode-active-check">
                  <Check size={14} />
                </span>
              )}
            </button>
          </div>

          {/* 2. Custom Theme Studio & Curated Presets */}
          <div className="custom-theme-studio glass-panel">
            <div className="studio-top-row">
              <div>
                <h3>
                  <Sparkles size={15} style={{ marginRight: 6 }} />
                  Custom Theme Palette &amp; Presets
                </h3>
                <p className="studio-sub">
                  Pick a curated heritage preset or customize individual colors below (selecting any color activates Custom Theme).
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetCustom}
                className="btn-secondary-sm flex-center"
                title="Reset custom colors to Emerald Heritage default"
              >
                <RotateCcw size={12} style={{ marginRight: 5 }} />
                Reset Custom
              </button>
            </div>

            {/* Curated Custom Presets */}
            <div className="custom-presets-strip">
              {CUSTOM_THEME_PRESETS.map((preset) => {
                const isCurrentPreset =
                  themeMode === 'custom' &&
                  customTheme.bgPrimary === preset.bgPrimary &&
                  customTheme.accentColor === preset.accentColor;

                return (
                  <button
                    key={preset.name}
                    type="button"
                    className={`custom-preset-pill ${
                      isCurrentPreset ? 'active' : ''
                    }`}
                    onClick={() => handleApplyPreset(preset)}
                  >
                    <span
                      className="preset-color-dot"
                      style={{
                        background: preset.bgPrimary,
                        borderColor: preset.accentColor
                      }}
                    >
                      <span
                        className="preset-inner-dot"
                        style={{ background: preset.accentColor }}
                      />
                    </span>
                    <span>{preset.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Color Pickers Grid */}
            <div className="color-pickers-grid">
              <ColorField
                label="Workspace Background"
                value={customTheme.bgPrimary}
                onChange={(val) => handleColorChange('bgPrimary', val)}
              />
              <ColorField
                label="Panel & Header Surface"
                value={customTheme.bgSurface}
                onChange={(val) => handleColorChange('bgSurface', val)}
              />
              <ColorField
                label="Member Card Background"
                value={customTheme.bgCard}
                onChange={(val) => handleColorChange('bgCard', val)}
              />
              <ColorField
                label="Brand / Accent Color"
                value={customTheme.accentColor}
                onChange={(val) => handleColorChange('accentColor', val)}
              />
              <ColorField
                label="Primary Text Color"
                value={customTheme.textPrimary}
                onChange={(val) => handleColorChange('textPrimary', val)}
              />
              <ColorField
                label="Secondary Text Color"
                value={customTheme.textSecondary}
                onChange={(val) => handleColorChange('textSecondary', val)}
              />
              <ColorField
                label="Male Card Accent"
                value={customTheme.maleColor}
                onChange={(val) => handleColorChange('maleColor', val)}
              />
              <ColorField
                label="Female Card Accent"
                value={customTheme.femaleColor}
                onChange={(val) => handleColorChange('femaleColor', val)}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-primary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <label className="color-picker-item">
      <span className="color-picker-label">{label}</span>
      <div className="color-input-row">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="native-color-input"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
              onChange(val);
            }
          }}
          className="hex-text-input"
          maxLength={7}
        />
      </div>
    </label>
  );
}
