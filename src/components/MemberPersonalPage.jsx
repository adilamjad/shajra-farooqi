import React, { useState, useMemo } from 'react';
import {
  Edit,
  Trash2,
  UserPlus,
  Heart,
  Briefcase,
  MapPin,
  Calendar,
  Crop,
  Pin,
  BookOpen,
  Image as ImageIcon,
  Clock,
  Users,
  Sparkles,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  FileEdit,
  Compass
} from 'lucide-react';
import GenderAvatar from './GenderAvatar';
import { getPersonAgeInfo } from '../utils/dataHelper';
import './MemberPersonalPage.css';

export default function MemberPersonalPage({
  person,
  people,
  isAdmin = false,
  onSelectPerson,
  onEditMember,
  onEditPersonalPage,
  onDelete,
  onAddRelative,
  onCropPhoto,
  isPinned,
  onTogglePin
}) {
  const [activeTab, setActiveTab] = useState('story'); // 'story' | 'gallery' | 'timeline' | 'family'
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Build combined timeline (automatic vital milestones + custom timeline events)
  const fullTimeline = useMemo(() => {
    if (!person) return [];
    const items = [];

    if (person.birthDate) {
      items.push({
        id: 'vital-birth',
        date: person.birthDate,
        title: 'Born',
        description: person.birthPlace
          ? `Born in ${person.birthPlace}.`
          : 'Date of birth recorded.',
        location: person.birthPlace,
        isAuto: true,
        badge: 'Birth'
      });
    }

    // Custom events from personalPage
    const customEvents = person.personalPage?.timeline || [];
    customEvents.forEach((ev) => {
      items.push({
        ...ev,
        isAuto: false,
        badge: 'Milestone'
      });
    });

    // Children births
    const children = people.filter(
      (p) => p.fatherId === person.id || p.motherId === person.id
    );
    children.forEach((child) => {
      if (child.birthDate) {
        items.push({
          id: `vital-child-${child.id}`,
          date: child.birthDate,
          title: `Birth of ${child.name}`,
          description: `${child.gender === 'female' ? 'Daughter' : child.gender === 'male' ? 'Son' : 'Child'} ${child.name} was born.`,
          location: child.birthPlace,
          isAuto: true,
          badge: 'Family',
          relatedPersonId: child.id
        });
      }
    });

    if (person.isDeceased && person.deathDate) {
      items.push({
        id: 'vital-death',
        date: person.deathDate,
        title: 'Passed Away',
        description: `Passed away on ${person.deathDate}.`,
        isAuto: true,
        badge: 'Passing'
      });
    }

    return items.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [person, people]);

  if (!person) {
    const firstRoot =
      people.find((p) => !p.fatherId && !p.motherId) || people[0];

    return (
      <div className="personal-page-empty">
        <div className="empty-page-card glass-panel">
          <div className="empty-page-icon">
            <Compass size={36} />
          </div>
          <h2>Select a Family Member</h2>
          <p>
            Click any card in the family tree on the left (or a row in the table) to view their details, biography, photo album, and personal page here.
          </p>
          {firstRoot && (
            <button
              type="button"
              className="btn-primary flex-center"
              onClick={() => onSelectPerson(firstRoot.id)}
            >
              <Sparkles size={16} style={{ marginRight: 8 }} />
              Explore {firstRoot.name}&apos;s Personal Page
            </button>
          )}
        </div>
      </div>
    );
  }

  const { ageText, statusText, isDeceased, lifespanText } = getPersonAgeInfo(person);

  // Relationships
  const father = person.fatherId ? people.find((p) => p.id === person.fatherId) : null;
  const mother = person.motherId ? people.find((p) => p.id === person.motherId) : null;
  const spouse = person.spouseId ? people.find((p) => p.id === person.spouseId) : null;
  const children = people.filter(
    (p) => p.fatherId === person.id || p.motherId === person.id
  );
  const siblings = people.filter(
    (p) =>
      p.id !== person.id &&
      ((person.fatherId && p.fatherId === person.fatherId) ||
        (person.motherId && p.motherId === person.motherId))
  );

  const personalPage = person.personalPage || {};
  const sections = personalPage.sections || [];
  const gallery = personalPage.gallery || [];
  const coverPhotoUrl = personalPage.coverPhotoUrl;
  const tagline = personalPage.tagline;

  const getGenderBadgeClass = (gender) => {
    if (gender === 'male') return 'badge-male';
    if (gender === 'female') return 'badge-female';
    return 'badge-other';
  };

  return (
    <div className="personal-page-container">
      {/* Hero Banner & Profile Header */}
      <div className="personal-hero">
        <div
          className={`personal-cover-banner gender-${person.gender} ${
            coverPhotoUrl ? 'has-cover-img' : ''
          }`}
          style={
            coverPhotoUrl
              ? { backgroundImage: `url(${coverPhotoUrl})` }
              : undefined
          }
        >
          <div className="personal-cover-overlay" />

          {/* Top Floating Actions Bar */}
          <div className="personal-top-bar">
            <div className="top-bar-left">
              {isAdmin && onTogglePin ? (
                <button
                  type="button"
                  className={`personal-pin-chip ${isPinned ? 'is-pinned' : ''}`}
                  onClick={() => onTogglePin(person.id)}
                  title={
                    isPinned
                      ? 'Unpin this member'
                      : 'Pin as default startup member'
                  }
                >
                  <Pin size={13} />
                  <span>{isPinned ? 'Pinned Default' : 'Pin Default'}</span>
                </button>
              ) : isPinned ? (
                <span className="personal-pin-chip is-pinned">
                  <Pin size={13} />
                  <span>Pinned Default</span>
                </span>
              ) : null}
            </div>

            {isAdmin && (
              <div className="top-bar-actions">
                <button
                  type="button"
                  className="btn-hero-action primary-studio-btn"
                  onClick={() => onEditPersonalPage(person)}
                  title="Open Personal Page Editor (Biography, Chapters, Photos, Timeline)"
                >
                  <FileEdit size={14} />
                  <span>Edit Personal Page</span>
                </button>
                <button
                  type="button"
                  className="btn-hero-action"
                  onClick={() => onAddRelative(person.id)}
                  title="Add Relative (Child, Spouse, Parent, Sibling)"
                >
                  <UserPlus size={14} />
                  <span>Add Relative</span>
                </button>
                <button
                  type="button"
                  className="btn-hero-action"
                  onClick={() => onEditMember(person.id)}
                  title="Edit Vital Info & Family Links"
                >
                  <Edit size={14} />
                  <span>Edit Info</span>
                </button>
                <button
                  type="button"
                  className="btn-hero-action danger"
                  onClick={() => onDelete(person.id)}
                  title="Delete Member"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Identity Row */}
        <div className="personal-identity-bar">
          <div className="personal-avatar-wrap">
            <div className="personal-avatar-frame">
              {person.photoUrl ? (
                <img
                  src={person.photoUrl}
                  alt={person.name}
                  className={`personal-avatar-img fit-${person.photoFit || 'cover'}`}
                />
              ) : (
                <GenderAvatar gender={person.gender} name={person.name} />
              )}
            </div>
            {isAdmin && onCropPhoto && (
              <button
                type="button"
                className="personal-avatar-crop-btn"
                onClick={() => onCropPhoto(person)}
                title={person.photoUrl ? 'Crop or scale portrait' : 'Upload portrait'}
              >
                <Crop size={12} />
                <span>{person.photoUrl ? 'Crop' : 'Photo'}</span>
              </button>
            )}
          </div>

          <div className="personal-headings">
            <div className="personal-title-line">
              <h1 className="personal-name">{person.name}</h1>
              {person.arabicName && (
                <span className="personal-arabic-name" dir="rtl">
                  {person.arabicName}
                </span>
              )}
            </div>

            {person.maidenName && (
              <p className="personal-maiden">
                Name before marriage: <strong>{person.maidenName}</strong>
              </p>
            )}

            {tagline && <p className="personal-tagline">&ldquo;{tagline}&rdquo;</p>}

            <div className="personal-badges-row">
              <span
                className={`status-badge-pill ${isDeceased ? 'deceased' : 'alive'}`}
              >
                <span className="status-beacon-dot" />
                {statusText}
              </span>
              <span className="age-badge-pill" title={lifespanText}>
                {ageText}
              </span>
              {lifespanText &&
                lifespanText !== 'Living' &&
                lifespanText !== 'Deceased' && (
                  <span className="lifespan-badge-pill">{lifespanText}</span>
                )}
              <span className={`badge ${getGenderBadgeClass(person.gender)}`}>
                {person.gender.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Vital Facts Strip */}
      <div className="personal-vitals-strip">
        <div className="vital-fact-card">
          <Calendar size={15} className="vital-icon" />
          <div className="vital-text">
            <span className="vital-label">Born</span>
            <span className="vital-value">{person.birthDate || 'Unknown'}</span>
          </div>
        </div>

        {person.isDeceased && (
          <div className="vital-fact-card">
            <Calendar size={15} className="vital-icon deceased" />
            <div className="vital-text">
              <span className="vital-label">Passed Away</span>
              <span className="vital-value">{person.deathDate || 'Recorded'}</span>
            </div>
          </div>
        )}

        <div className="vital-fact-card">
          <MapPin size={15} className="vital-icon" />
          <div className="vital-text">
            <span className="vital-label">Birthplace</span>
            <span className="vital-value">{person.birthPlace || 'Not specified'}</span>
          </div>
        </div>

        <div className="vital-fact-card">
          <Briefcase size={15} className="vital-icon" />
          <div className="vital-text">
            <span className="vital-label">Occupation</span>
            <span className="vital-value">{person.occupation || 'Not specified'}</span>
          </div>
        </div>
      </div>

      {/* Personal Page Section Tabs */}
      <div className="personal-nav-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'story'}
          className={`personal-tab-btn ${activeTab === 'story' ? 'active' : ''}`}
          onClick={() => setActiveTab('story')}
        >
          <BookOpen size={15} />
          <span>Biography & Story</span>
          {sections.length > 0 && (
            <span className="tab-count-pill">{sections.length}</span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'gallery'}
          className={`personal-tab-btn ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => setActiveTab('gallery')}
        >
          <ImageIcon size={15} />
          <span>Photo Gallery</span>
          <span className="tab-count-pill">{gallery.length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'timeline'}
          className={`personal-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          <Clock size={15} />
          <span>Life Timeline</span>
          <span className="tab-count-pill">{fullTimeline.length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'family'}
          className={`personal-tab-btn ${activeTab === 'family' ? 'active' : ''}`}
          onClick={() => setActiveTab('family')}
        >
          <Users size={15} />
          <span>Family Ties</span>
        </button>
      </div>

      {/* Main Personal Page Body */}
      <div className="personal-body-content">
        {/* TAB 1: BIOGRAPHY & STORY CHAPTERS */}
        {activeTab === 'story' && (
          <div className="personal-tab-pane animate-fade-in">
            {/* Core Overview Biography */}
            <section className="story-card glass-panel">
              <div className="story-card-header">
                <h3>Biography Overview</h3>
                {isAdmin && (
                  <button
                    type="button"
                    className="btn-inline-edit"
                    onClick={() => onEditPersonalPage(person, 'story')}
                  >
                    <FileEdit size={13} />
                    <span>Edit Story</span>
                  </button>
                )}
              </div>
              {person.bio ? (
                <p className="story-paragraph" dir="auto">
                  {person.bio}
                </p>
              ) : (
                <div className="story-empty-prompt">
                  <p>No overview biography has been written for {person.name} yet.</p>
                  {isAdmin && (
                    <button
                      type="button"
                      className="btn-secondary-sm"
                      onClick={() => onEditPersonalPage(person, 'story')}
                    >
                      <Plus size={13} style={{ marginRight: 4 }} /> Write Biography
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* Custom Story Sections / Chapters */}
            {sections.length > 0 ? (
              <div className="story-chapters-list">
                {sections.map((sec) => (
                  <article key={sec.id} className="story-card chapter-card glass-panel">
                    <h3 className="chapter-title" dir="auto">
                      {sec.title}
                    </h3>
                    <div className="chapter-content" dir="auto">
                      {sec.content.split('\n').map((para, idx) =>
                        para.trim() ? <p key={idx}>{para}</p> : <br key={idx} />
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : isAdmin ? (
              <div className="add-chapter-callout glass-panel">
                <div className="callout-text">
                  <h4>Add Personal Story Chapters</h4>
                  <p>
                    Enrich {person.name}&apos;s personal page with chapters like Early Life, Career &amp; Achievements, Favourite Memories, or Family Heritage.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-primary flex-center"
                  onClick={() => onEditPersonalPage(person, 'story')}
                >
                  <Plus size={15} style={{ marginRight: 6 }} />
                  Add Story Chapters
                </button>
              </div>
            ) : null}

            {/* Custom Attributes / Quick Facts */}
            {person.customFields && person.customFields.length > 0 && (
              <section className="story-card glass-panel">
                <div className="story-card-header">
                  <h3>Personal Attributes &amp; Notes</h3>
                </div>
                <div className="personal-attributes-grid">
                  {person.customFields.map((field, index) => (
                    <div key={index} className="attribute-chip-card">
                      <span className="attr-label">{field.label}</span>
                      <span className="attr-value" dir="auto">
                        {field.value}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Quick Photo Preview strip if photos exist */}
            {gallery.length > 0 && (
              <section className="story-card glass-panel">
                <div className="story-card-header">
                  <h3>Featured Memories ({gallery.length})</h3>
                  <button
                    type="button"
                    className="btn-inline-edit"
                    onClick={() => setActiveTab('gallery')}
                  >
                    <span>View All Photos</span>
                  </button>
                </div>
                <div className="story-gallery-preview">
                  {gallery.slice(0, 4).map((photo, idx) => (
                    <div
                      key={photo.id}
                      className="story-photo-thumb"
                      onClick={() => setLightboxIndex(idx)}
                    >
                      <img src={photo.url} alt={photo.caption || person.name} />
                      {photo.caption && (
                        <span className="thumb-caption">{photo.caption}</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* TAB 2: PHOTO GALLERY */}
        {activeTab === 'gallery' && (
          <div className="personal-tab-pane animate-fade-in">
            <div className="pane-action-header">
              <div>
                <h3>Photo Album &amp; Media</h3>
                <p className="pane-sub">
                  Portraits, historical documents, and family memories of {person.name}
                </p>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  className="btn-primary flex-center"
                  onClick={() => onEditPersonalPage(person, 'gallery')}
                >
                  <Plus size={15} style={{ marginRight: 6 }} />
                  Add / Manage Photos
                </button>
              )}
            </div>

            {gallery.length === 0 ? (
              <div className="empty-gallery-box glass-panel">
                <ImageIcon size={36} className="empty-box-icon" />
                <h4>No Photos in {person.name}&apos;s Album Yet</h4>
                <p>
                  {isAdmin
                    ? 'Upload historical portraits, family gatherings, or documents with captions, dates, and locations.'
                    : 'No photos have been added to this album yet.'}
                </p>
                {isAdmin && (
                  <button
                    type="button"
                    className="btn-primary flex-center"
                    onClick={() => onEditPersonalPage(person, 'gallery')}
                  >
                    <Plus size={15} style={{ marginRight: 6 }} />
                    Upload Photos to Page
                  </button>
                )}
              </div>
            ) : (
              <div className="personal-gallery-grid">
                {gallery.map((photo, index) => (
                  <figure
                    key={photo.id}
                    className="gallery-card glass-panel"
                    onClick={() => setLightboxIndex(index)}
                  >
                    <div className="gallery-img-wrap">
                      <img
                        src={photo.url}
                        alt={photo.caption || `${person.name} photo ${index + 1}`}
                        loading="lazy"
                      />
                    </div>
                    {(photo.caption || photo.date || photo.location) && (
                      <figcaption className="gallery-card-meta">
                        {photo.caption && (
                          <p className="gallery-caption" dir="auto">
                            {photo.caption}
                          </p>
                        )}
                        <div className="gallery-sub-tags">
                          {photo.date && (
                            <span className="gallery-tag">
                              <Calendar size={11} /> {photo.date}
                            </span>
                          )}
                          {photo.location && (
                            <span className="gallery-tag">
                              <MapPin size={11} /> {photo.location}
                            </span>
                          )}
                        </div>
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LIFE TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="personal-tab-pane animate-fade-in">
            <div className="pane-action-header">
              <div>
                <h3>Chronological Life Timeline</h3>
                <p className="pane-sub">
                  Key milestones, family events, and historical moments
                </p>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  className="btn-primary flex-center"
                  onClick={() => onEditPersonalPage(person, 'timeline')}
                >
                  <Plus size={15} style={{ marginRight: 6 }} />
                  Add Milestone
                </button>
              )}
            </div>

            {fullTimeline.length === 0 ? (
              <div className="empty-gallery-box glass-panel">
                <Clock size={36} className="empty-box-icon" />
                <h4>No Timeline Events Yet</h4>
                <p>
                  {isAdmin
                    ? 'Add birth dates, education, marriage, travels, or career milestones to build a chronological story.'
                    : 'No timeline milestones have been recorded for this member yet.'}
                </p>
                {isAdmin && (
                  <button
                    type="button"
                    className="btn-primary flex-center"
                    onClick={() => onEditPersonalPage(person, 'timeline')}
                  >
                    <Plus size={15} style={{ marginRight: 6 }} />
                    Add First Milestone
                  </button>
                )}
              </div>
            ) : (
              <div className="personal-timeline-list">
                {fullTimeline.map((item) => (
                  <div
                    key={item.id}
                    className={`timeline-node-item ${
                      item.isAuto ? 'is-auto' : 'is-custom'
                    }`}
                  >
                    <div className="timeline-marker-col">
                      <span className="timeline-dot" />
                      <span className="timeline-stem" />
                    </div>
                    <div className="timeline-card glass-panel">
                      <div className="timeline-card-top">
                        <span className="timeline-date-chip">{item.date}</span>
                        <span className={`timeline-type-badge badge-${item.badge?.toLowerCase()}`}>
                          {item.badge}
                        </span>
                      </div>
                      <h4 className="timeline-title" dir="auto">
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="timeline-desc" dir="auto">
                          {item.description}
                        </p>
                      )}
                      {item.location && (
                        <span className="timeline-location">
                          <MapPin size={12} /> {item.location}
                        </span>
                      )}
                      {item.relatedPersonId && (
                        <button
                          type="button"
                          className="timeline-person-link"
                          onClick={() => onSelectPerson(item.relatedPersonId)}
                        >
                          View Personal Page →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: FAMILY TIES & IMMEDIATE RELATIVES */}
        {activeTab === 'family' && (
          <div className="personal-tab-pane animate-fade-in">
            <div className="pane-action-header">
              <div>
                <h3>Immediate Family Connections</h3>
                <p className="pane-sub">
                  Click any relative to center them in the tree and open their personal page
                </p>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  className="btn-primary flex-center"
                  onClick={() => onAddRelative(person.id)}
                >
                  <UserPlus size={15} style={{ marginRight: 6 }} />
                  Add Relative
                </button>
              )}
            </div>

            <div className="family-groups-stack">
              {/* Parents */}
              {(father || mother) && (
                <div className="family-group-block">
                  <h4 className="family-group-heading">Parents</h4>
                  <div className="family-cards-grid">
                    {father && (
                      <RelativeMiniCard
                        relative={father}
                        relationLabel="Father"
                        onClick={() => onSelectPerson(father.id)}
                      />
                    )}
                    {mother && (
                      <RelativeMiniCard
                        relative={mother}
                        relationLabel="Mother"
                        onClick={() => onSelectPerson(mother.id)}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Spouse */}
              {spouse && (
                <div className="family-group-block">
                  <h4 className="family-group-heading">Spouse</h4>
                  <div className="family-cards-grid">
                    <RelativeMiniCard
                      relative={spouse}
                      relationLabel="Spouse"
                      isSpouse
                      onClick={() => onSelectPerson(spouse.id)}
                    />
                  </div>
                </div>
              )}

              {/* Children */}
              {children.length > 0 && (
                <div className="family-group-block">
                  <h4 className="family-group-heading">
                    Children ({children.length})
                  </h4>
                  <div className="family-cards-grid">
                    {children.map((child) => (
                      <RelativeMiniCard
                        key={child.id}
                        relative={child}
                        relationLabel={
                          child.gender === 'male'
                            ? 'Son'
                            : child.gender === 'female'
                            ? 'Daughter'
                            : 'Child'
                        }
                        onClick={() => onSelectPerson(child.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Siblings */}
              {siblings.length > 0 && (
                <div className="family-group-block">
                  <h4 className="family-group-heading">
                    Siblings ({siblings.length})
                  </h4>
                  <div className="family-cards-grid">
                    {siblings.map((sib) => (
                      <RelativeMiniCard
                        key={sib.id}
                        relative={sib}
                        relationLabel={
                          sib.gender === 'male'
                            ? 'Brother'
                            : sib.gender === 'female'
                            ? 'Sister'
                            : 'Sibling'
                        }
                        onClick={() => onSelectPerson(sib.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {!father &&
                !mother &&
                !spouse &&
                children.length === 0 &&
                siblings.length === 0 && (
                  <div className="empty-gallery-box glass-panel">
                    <Users size={36} className="empty-box-icon" />
                    <h4>No Direct Relatives Linked Yet</h4>
                    <p>
                      {isAdmin
                        ? `Connect parents, a spouse, siblings, or children to build ${person.name}'s branch of the family tree.`
                        : 'No immediate relatives have been linked to this member yet.'}
                    </p>
                    {isAdmin && (
                      <button
                        type="button"
                        className="btn-primary flex-center"
                        onClick={() => onAddRelative(person.id)}
                      >
                        <UserPlus size={15} style={{ marginRight: 6 }} />
                        Link a Relative
                      </button>
                    )}
                  </div>
                )}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal for Gallery Photos */}
      {lightboxIndex !== null && gallery[lightboxIndex] && (
        <div
          className="personal-lightbox-overlay animate-fade-in"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="personal-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="lightbox-close-btn"
              onClick={() => setLightboxIndex(null)}
              title="Close Lightbox"
            >
              <X size={20} />
            </button>

            {gallery.length > 1 && (
              <button
                type="button"
                className="lightbox-nav-btn prev"
                onClick={() =>
                  setLightboxIndex(
                    (lightboxIndex - 1 + gallery.length) % gallery.length
                  )
                }
                title="Previous Photo"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            <div className="lightbox-stage">
              <img
                src={gallery[lightboxIndex].url}
                alt={gallery[lightboxIndex].caption || person.name}
              />
              <div className="lightbox-caption-bar">
                <div className="lightbox-caption-main">
                  {gallery[lightboxIndex].caption || person.name}
                </div>
                <div className="lightbox-caption-meta">
                  {gallery[lightboxIndex].date && (
                    <span>
                      <Calendar size={12} /> {gallery[lightboxIndex].date}
                    </span>
                  )}
                  {gallery[lightboxIndex].location && (
                    <span>
                      <MapPin size={12} /> {gallery[lightboxIndex].location}
                    </span>
                  )}
                  <span>
                    {lightboxIndex + 1} of {gallery.length}
                  </span>
                </div>
              </div>
            </div>

            {gallery.length > 1 && (
              <button
                type="button"
                className="lightbox-nav-btn next"
                onClick={() =>
                  setLightboxIndex((lightboxIndex + 1) % gallery.length)
                }
                title="Next Photo"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RelativeMiniCard({ relative, relationLabel, isSpouse, onClick }) {
  const { ageText, lifespanText } = getPersonAgeInfo(relative);
  return (
    <button
      type="button"
      className={`relative-mini-card gender-${relative.gender} glass-panel`}
      onClick={onClick}
    >
      <div className="rel-mini-avatar">
        {relative.photoUrl ? (
          <img
            src={relative.photoUrl}
            alt={relative.name}
            className={`fit-${relative.photoFit || 'cover'}`}
          />
        ) : (
          <GenderAvatar gender={relative.gender} name={relative.name} />
        )}
      </div>
      <div className="rel-mini-info">
        <span className={`rel-mini-role ${isSpouse ? 'role-spouse' : ''}`}>
          {isSpouse && <Heart size={10} style={{ marginRight: 3 }} />}
          {relationLabel}
        </span>
        <span className="rel-mini-name">{relative.name}</span>
        {relative.arabicName && (
          <span className="rel-mini-arabic" dir="rtl">
            {relative.arabicName}
          </span>
        )}
        <span className="rel-mini-meta">
          {lifespanText} • {ageText}
        </span>
      </div>
    </button>
  );
}
