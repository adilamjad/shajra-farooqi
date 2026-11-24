import React from 'react';
import { Heart, Award, Crop, Maximize2, StretchHorizontal, Briefcase, Pin } from 'lucide-react';
import GenderAvatar from './GenderAvatar';
import { getPersonAgeInfo } from '../utils/dataHelper';
import './PersonCard.css';

export default function PersonCard({
  person,
  role,
  isFilteredOut,
  onClick,
  onCropPhoto,
  onToggleFit,
  isPinned,
  onTogglePin,
  style,
  className = ''
}) {
  if (!person) return null;

  const { ageText, statusText, isDeceased, lifespanText } = getPersonAgeInfo(person);
  const photoFit = person.photoFit || 'cover'; // 'cover' (zoomed) | 'fill' (stretched)

  return (
    <div
      className={`professional-person-card gender-${person.gender} ${
        role === 'focus' ? 'card-focus' : ''
      } ${isPinned ? 'card-pinned' : ''} ${isFilteredOut ? 'card-filtered' : ''} ${
        isDeceased ? 'card-state-deceased' : 'card-state-alive'
      } ${className}`}
      style={style}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`${person.name}, ${statusText}, ${ageText}`}
    >
      {/* 1. Picture Box */}
      <div className="card-picture-container">
        <div className={`card-picture-box fit-${photoFit}`}>
          {person.photoUrl ? (
            <img
              src={person.photoUrl}
              alt={person.name}
              className={`card-photo-img fit-${photoFit}`}
              loading="lazy"
            />
          ) : (
            <GenderAvatar gender={person.gender} name={person.name} />
          )}

          {/* Quick Tool Button on hover to crop or scale */}
          {onCropPhoto && (
            <div className="picture-hover-actions">
              <button
                type="button"
                className="picture-tool-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onCropPhoto(person);
                }}
                title={person.photoUrl ? "Crop or scale picture" : "Upload & format picture"}
              >
                <Crop size={11} style={{ marginRight: 3 }} />
                <span>{person.photoUrl ? "Crop/Scale" : "Add Photo"}</span>
              </button>

              {/* Quick toggle between Zoomed (Cover) and Stretched (Fill) if photo uploaded */}
              {person.photoUrl && onToggleFit && (
                <button
                  type="button"
                  className="picture-fit-toggle-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFit(person, photoFit === 'cover' ? 'fill' : 'cover');
                  }}
                  title={photoFit === 'cover' ? "Switch to Stretched" : "Switch to Zoomed"}
                >
                  {photoFit === 'cover' ? <StretchHorizontal size={10} /> : <Maximize2 size={10} />}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Personal Information */}
      <div className="card-info-container">
        {/* Name & Maiden */}
        <div className="card-name-line">
          <h4 className="card-name-text" title={person.name}>
            {person.name}
          </h4>
          {person.maidenName && (
            <span className="card-maiden-text" title={`Maiden Name: ${person.maidenName}`}>
              ({person.maidenName})
            </span>
          )}
        </div>

        {/* Arabic Name (RTL) */}
        {person.arabicName && (
          <div className="card-arabic-text" dir="rtl" title={`Arabic Name: ${person.arabicName}`}>
            {person.arabicName}
          </div>
        )}

        {/* Alive Status & Age */}
        <div className="card-status-age-bar">
          <span className={`status-badge-pill ${isDeceased ? 'deceased' : 'alive'}`}>
            <span className="status-beacon-dot" />
            <span className="status-label">{statusText}</span>
          </span>
          <span className="age-badge-pill" title={`Lifespan: ${lifespanText}`}>
            {ageText}
          </span>
        </div>

        {/* Meta Line (Occupation or Lifespan years) */}
        <div className="card-meta-line">
          {person.occupation ? (
            <span className="card-occupation-chip" title={person.occupation}>
              <Briefcase size={9} style={{ marginRight: 3 }} />
              {person.occupation}
            </span>
          ) : lifespanText && lifespanText !== 'Living' && lifespanText !== 'Deceased' ? (
            <span className="card-lifespan-chip" title={lifespanText}>
              {lifespanText}
            </span>
          ) : null}
        </div>
      </div>

      {/* 3. Status Badges Corner */}
      <div className="card-indicators-corner">
        {onTogglePin && (
          <button
            type="button"
            className={`card-pin-indicator-btn ${isPinned ? 'is-pinned' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(person.id);
            }}
            title={isPinned ? 'Pinned as default card (click to unpin)' : 'Pin as default startup card'}
            aria-label={isPinned ? 'Unpin card' : 'Pin card'}
          >
            <Pin size={11} className={isPinned ? 'pin-icon-pinned' : 'pin-icon-unpinned'} />
          </button>
        )}
        {person.spouseId && (
          <span className="indicator-badge spouse-indicator" title="Married / Spouse connected">
            <Heart size={10} />
          </span>
        )}
        {role === 'focus' && (
          <span className="indicator-badge focus-indicator" title="Focal Person">
            <Award size={10} />
          </span>
        )}
      </div>
    </div>
  );
}
