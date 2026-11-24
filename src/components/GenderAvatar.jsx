import React, { useId } from 'react';
import './GenderAvatar.css';

/**
 * Professional SVG placeholder avatar for Male, Female, and Other genders
 */
export default function GenderAvatar({ gender = 'male', name = '', className = '' }) {
  const uniqueId = useId().replace(/:/g, '');

  if (gender === 'female') {
    return (
      <svg
        viewBox="0 0 100 100"
        className={`gender-avatar-svg gender-avatar-female ${className}`}
        aria-label={`${name ? name + ' - ' : ''}Female Avatar`}
        role="img"
      >
        <defs>
          <linearGradient id={`female-bg-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2e1026" />
            <stop offset="50%" stopColor="#1f1124" />
            <stop offset="100%" stopColor="#130d1b" />
          </linearGradient>
          <linearGradient id={`female-accent-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#db2777" />
          </linearGradient>
          <linearGradient id={`female-hair-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#be185d" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id={`female-skin-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <linearGradient id={`female-torso-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
        </defs>

        {/* Background & Subtle Border */}
        <rect width="100" height="100" rx="12" fill={`url(#female-bg-${uniqueId})`} />
        <rect width="98" height="98" x="1" y="1" rx="11" fill="none" stroke="#ec4899" strokeWidth="1" strokeOpacity="0.2" />

        {/* Back Hair Strands */}
        <path
          d="M 30 38 C 28 54, 30 68, 35 76 C 37 70, 40 66, 42 63 C 38 55, 36 46, 36 38 Z"
          fill={`url(#female-hair-${uniqueId})`}
          opacity="0.85"
        />
        <path
          d="M 70 38 C 72 54, 70 68, 65 76 C 63 70, 60 66, 58 63 C 62 55, 64 46, 64 38 Z"
          fill={`url(#female-hair-${uniqueId})`}
          opacity="0.85"
        />

        {/* Torso & Elegant Shoulders */}
        <path
          d="M 23 94 C 23 79, 34 71, 44 68 L 47 73 L 53 73 L 56 68 C 66 71, 77 79, 77 94 Z"
          fill={`url(#female-torso-${uniqueId})`}
        />

        {/* Neckline Accent */}
        <path
          d="M 44 69 Q 50 78 56 69 Z"
          fill={`url(#female-accent-${uniqueId})`}
          opacity="0.6"
        />

        {/* Neck */}
        <path
          d="M 46 55 L 46 68 L 54 68 L 54 55 Z"
          fill={`url(#female-skin-${uniqueId})`}
        />

        {/* Face Outline */}
        <path
          d="M 37 40 C 37 29, 42 23, 50 23 C 58 23, 63 29, 63 40 C 63 49, 58 55, 50 55 C 42 55, 37 49, 37 40 Z"
          fill={`url(#female-skin-${uniqueId})`}
        />

        {/* Hair Front / Silhouette Top */}
        <path
          d="M 31 38 C 31 22, 40 16, 50 16 C 60 16, 69 22, 69 38 C 66 31, 59 25, 50 25 C 41 25, 34 31, 31 38 Z"
          fill={`url(#female-hair-${uniqueId})`}
        />
      </svg>
    );
  }

  if (gender === 'male') {
    return (
      <svg
        viewBox="0 0 100 100"
        className={`gender-avatar-svg gender-avatar-male ${className}`}
        aria-label={`${name ? name + ' - ' : ''}Male Avatar`}
        role="img"
      >
        <defs>
          <linearGradient id={`male-bg-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f1d36" />
            <stop offset="50%" stopColor="#0b1528" />
            <stop offset="100%" stopColor="#080e1c" />
          </linearGradient>
          <linearGradient id={`male-accent-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id={`male-hair-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id={`male-skin-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
          <linearGradient id={`male-torso-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        {/* Background & Subtle Border */}
        <rect width="100" height="100" rx="12" fill={`url(#male-bg-${uniqueId})`} />
        <rect width="98" height="98" x="1" y="1" rx="11" fill="none" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.2" />

        {/* Shoulders & Torso */}
        <path
          d="M 20 94 C 20 77, 31 70, 42 67 L 45 74 L 55 74 L 58 67 C 69 70, 80 77, 80 94 Z"
          fill={`url(#male-torso-${uniqueId})`}
        />

        {/* Suit Collar V */}
        <path
          d="M 42 68 L 50 80 L 58 68 Z"
          fill="#0b1324"
          opacity="0.8"
        />
        <path
          d="M 49 71 L 50 82 L 51 71 Z"
          fill={`url(#male-accent-${uniqueId})`}
          opacity="0.7"
        />

        {/* Neck */}
        <path
          d="M 45 56 L 45 68 L 55 68 L 55 56 Z"
          fill={`url(#male-skin-${uniqueId})`}
        />

        {/* Head / Face */}
        <path
          d="M 36 39 C 36 28, 42 22, 50 22 C 58 22, 64 28, 64 39 C 64 49, 58 56, 50 56 C 42 56, 36 49, 36 39 Z"
          fill={`url(#male-skin-${uniqueId})`}
        />

        {/* Groomed Hair Silhouette */}
        <path
          d="M 33 37 C 33 24, 40 17, 50 17 C 59 17, 66 21, 67 31 C 64 30, 58 30, 52 26 C 46 28, 39 32, 35 38 Z"
          fill={`url(#male-hair-${uniqueId})`}
        />
      </svg>
    );
  }

  // Other / Neutral Avatar
  return (
    <svg
      viewBox="0 0 100 100"
      className={`gender-avatar-svg gender-avatar-other ${className}`}
      aria-label={`${name ? name + ' - ' : ''}Avatar`}
      role="img"
    >
      <defs>
        <linearGradient id={`other-bg-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a1c30" />
          <stop offset="100%" stopColor="#0c0e1a" />
        </linearGradient>
        <linearGradient id={`other-accent-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id={`other-skin-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>

      <rect width="100" height="100" rx="12" fill={`url(#other-bg-${uniqueId})`} />
      <rect width="98" height="98" x="1" y="1" rx="11" fill="none" stroke="#a78bfa" strokeWidth="1" strokeOpacity="0.2" />

      {/* Torso */}
      <path
        d="M 22 94 C 22 76, 33 69, 43 67 L 46 72 L 54 72 L 57 67 C 67 69, 78 76, 78 94 Z"
        fill="#334155"
      />

      {/* Neck */}
      <path
        d="M 45 56 L 45 68 L 55 68 L 55 56 Z"
        fill={`url(#other-skin-${uniqueId})`}
      />

      {/* Head */}
      <circle cx="50" cy="38" r="16" fill={`url(#other-skin-${uniqueId})`} />

      {/* Top Accent */}
      <path
        d="M 36 34 C 36 24, 43 19, 50 19 C 57 19, 64 24, 64 34 C 61 28, 55 25, 50 25 C 45 25, 39 28, 36 34 Z"
        fill={`url(#other-accent-${uniqueId})`}
      />
    </svg>
  );
}
