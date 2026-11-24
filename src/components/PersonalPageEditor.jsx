import React, { useState, useEffect } from 'react';
import {
  Save,
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  BookOpen,
  Image as ImageIcon,
  Clock,
  Sliders,
  Sparkles,
  UserCheck,
  Layout
} from 'lucide-react';
import { compressImageFile } from '../utils/storageHelper';
import './PersonalPageEditor.css';

const CHAPTER_TEMPLATES = [
  { title: 'Early Life & Childhood', placeholder: 'Describe where they grew up, childhood memories, and early influences...' },
  { title: 'Education & Career', placeholder: 'Schools attended, professional journey, craftsmanship, or notable achievements...' },
  { title: 'Family Life & Marriage', placeholder: 'How they met their spouse, raising children, family traditions...' },
  { title: 'Personality, Hobbies & Passions', placeholder: 'What they loved doing, favorite sayings, music, travels, or hobbies...' },
  { title: 'Legacy & Memories', placeholder: 'Stories passed down, impact on the family, and cherished heirlooms...' }
];

export default function PersonalPageEditor({
  person,
  initialSection = 'story',
  onSave,
  onCancel
}) {
  const [activeTab, setActiveTab] = useState(initialSection || 'story'); // 'story' | 'gallery' | 'timeline' | 'attributes'
  const [bio, setBio] = useState('');
  const [tagline, setTagline] = useState('');
  const [coverPhotoUrl, setCoverPhotoUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [sections, setSections] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Sync state when person changes
  useEffect(() => {
    if (!person) return;
    setBio(person.bio || '');
    setPhotoUrl(person.photoUrl || '');
    setCustomFields(person.customFields ? [...person.customFields] : []);

    const pp = person.personalPage || {};
    setTagline(pp.tagline || '');
    setCoverPhotoUrl(pp.coverPhotoUrl || '');
    setSections(pp.sections ? pp.sections.map((s) => ({ ...s })) : []);
    setGallery(pp.gallery ? pp.gallery.map((g) => ({ ...g })) : []);
    setTimeline(pp.timeline ? pp.timeline.map((t) => ({ ...t })) : []);
  }, [person]);

  useEffect(() => {
    if (initialSection) {
      setActiveTab(initialSection);
    }
  }, [initialSection]);

  if (!person) return null;

  // --- Story Sections Helpers ---
  const handleAddSection = (presetTitle = '', presetPlaceholder = '') => {
    const newSec = {
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: presetTitle || 'New Story Chapter',
      content: '',
      placeholder: presetPlaceholder
    };
    setSections((prev) => [...prev, newSec]);
  };

  const handleUpdateSection = (id, key, val) => {
    setSections((prev) =>
      prev.map((sec) => (sec.id === id ? { ...sec, [key]: val } : sec))
    );
  };

  const handleRemoveSection = (id) => {
    setSections((prev) => prev.filter((sec) => sec.id !== id));
  };

  const handleMoveSection = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= sections.length) return;
    const copy = [...sections];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    setSections(copy);
  };

  // --- Cover & Gallery Upload Helpers ---
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const compressed = await compressImageFile(file, 1600, 900, 0.85);
      setCoverPhotoUrl(compressed);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGalleryFilesUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      const uploadedItems = [];
      for (const file of files) {
        const compressed = await compressImageFile(file, 1400, 1400, 0.85);
        uploadedItems.push({
          id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          url: compressed,
          caption: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          date: '',
          location: ''
        });
      }
      setGallery((prev) => [...prev, ...uploadedItems]);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleUpdatePhoto = (id, key, val) => {
    setGallery((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: val } : item))
    );
  };

  const handleRemovePhoto = (id) => {
    setGallery((prev) => prev.filter((item) => item.id !== id));
  };

  const handleMovePhoto = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= gallery.length) return;
    const copy = [...gallery];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    setGallery(copy);
  };

  // --- Timeline Helpers ---
  const handleAddTimelineEvent = () => {
    setTimeline((prev) => [
      ...prev,
      {
        id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date: '',
        title: '',
        description: '',
        location: ''
      }
    ]);
  };

  const handleUpdateTimelineEvent = (id, key, val) => {
    setTimeline((prev) =>
      prev.map((ev) => (ev.id === id ? { ...ev, [key]: val } : ev))
    );
  };

  const handleRemoveTimelineEvent = (id) => {
    setTimeline((prev) => prev.filter((ev) => ev.id !== id));
  };

  // --- Custom Attributes Helpers ---
  const handleAddCustomField = () => {
    setCustomFields((prev) => [...prev, { label: '', value: '' }]);
  };

  const handleUpdateCustomField = (idx, key, val) => {
    const copy = [...customFields];
    copy[idx] = { ...copy[idx], [key]: val };
    setCustomFields(copy);
  };

  const handleRemoveCustomField = (idx) => {
    setCustomFields((prev) => prev.filter((_, i) => i !== idx));
  };

  // --- Save Personal Page ---
  const handleSaveAll = (e) => {
    e.preventDefault();

    const cleanedSections = sections
      .filter((s) => s.title.trim() || s.content.trim())
      .map(({ id, title, content }) => ({
        id,
        title: title.trim() || 'Untitled Chapter',
        content: content.trim()
      }));

    const cleanedTimeline = timeline
      .filter((t) => t.title.trim() || t.date.trim())
      .map((t) => ({
        id: t.id,
        date: t.date.trim() || 'Milestone',
        title: t.title.trim() || 'Life Event',
        description: t.description?.trim() || undefined,
        location: t.location?.trim() || undefined
      }));

    const cleanedCustomFields = customFields.filter(
      (cf) => cf.label.trim() && cf.value.trim()
    );

    const updatedPerson = {
      ...person,
      bio: bio.trim() || undefined,
      photoUrl: photoUrl || undefined,
      customFields:
        cleanedCustomFields.length > 0 ? cleanedCustomFields : undefined,
      personalPage: {
        coverPhotoUrl: coverPhotoUrl || undefined,
        tagline: tagline.trim() || undefined,
        sections: cleanedSections,
        gallery: gallery,
        timeline: cleanedTimeline
      }
    };

    onSave(updatedPerson);
  };

  return (
    <div className="page-editor-container animate-fade-in">
      {/* Studio Sticky Header */}
      <div className="page-editor-header">
        <div className="editor-title-block">
          <span className="editor-badge">Personal Page Studio</span>
          <h2>Editing {person.name}&apos;s Page</h2>
        </div>

        <div className="editor-header-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary editor-cancel-btn"
          >
            <X size={15} style={{ marginRight: 5 }} />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="btn-primary flex-center editor-save-btn"
          >
            <Save size={15} style={{ marginRight: 6 }} />
            Save Personal Page
          </button>
        </div>
      </div>

      {/* Studio Sub-Navigation Tabs */}
      <div className="page-editor-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'story'}
          className={`editor-tab-btn ${activeTab === 'story' ? 'active' : ''}`}
          onClick={() => setActiveTab('story')}
        >
          <BookOpen size={15} />
          <span>Biography &amp; Chapters</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'gallery'}
          className={`editor-tab-btn ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => setActiveTab('gallery')}
        >
          <ImageIcon size={15} />
          <span>Photos &amp; Cover ({gallery.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'timeline'}
          className={`editor-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          <Clock size={15} />
          <span>Timeline ({timeline.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'attributes'}
          className={`editor-tab-btn ${activeTab === 'attributes' ? 'active' : ''}`}
          onClick={() => setActiveTab('attributes')}
        >
          <Sliders size={15} />
          <span>Facts &amp; Attributes</span>
        </button>
      </div>

      {/* Studio Form Body */}
      <form onSubmit={handleSaveAll} className="page-editor-body">
        {/* 1. STORY & BIOGRAPHY EDITOR */}
        {activeTab === 'story' && (
          <div className="editor-pane-stack animate-fade-in">
            {/* Tagline & Overview Bio */}
            <div className="editor-card glass-panel">
              <h3>Headline &amp; Overview Biography</h3>
              <p className="editor-helper">
                Write a short quote or tagline and a summary biography that introduces {person.name}.
              </p>

              <div className="form-group">
                <label htmlFor="editor-tagline">Personal Tagline / Quote</label>
                <input
                  id="editor-tagline"
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Master craftsman, loving grandfather, and keeper of family stories"
                  dir="auto"
                />
              </div>

              <div className="form-group">
                <label htmlFor="editor-bio">Overview Biography</label>
                <textarea
                  id="editor-bio"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={`Write an overview of ${person.name}'s life, character, and accomplishments...`}
                  dir="auto"
                />
              </div>
            </div>

            {/* Quick Chapter Templates Bar */}
            <div className="editor-card glass-panel">
              <div className="editor-section-top">
                <div>
                  <h3>Story Chapters ({sections.length})</h3>
                  <p className="editor-helper">
                    Break {person.name}&apos;s life story into organized chapters or articles.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-primary flex-center"
                  onClick={() => handleAddSection()}
                >
                  <Plus size={14} style={{ marginRight: 5 }} />
                  Add Blank Chapter
                </button>
              </div>

              <div className="chapter-presets-bar">
                <span className="preset-label">
                  <Sparkles size={12} /> Quick Add Chapter:
                </span>
                {CHAPTER_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.title}
                    type="button"
                    className="preset-chip-btn"
                    onClick={() => handleAddSection(tpl.title, tpl.placeholder)}
                  >
                    + {tpl.title}
                  </button>
                ))}
              </div>

              {sections.length === 0 ? (
                <div className="editor-empty-box">
                  <p>No custom story chapters yet. Click a quick template above or add a blank chapter.</p>
                </div>
              ) : (
                <div className="editor-chapters-list">
                  {sections.map((sec, idx) => (
                    <div key={sec.id} className="editor-chapter-item">
                      <div className="chapter-item-toolbar">
                        <span className="chapter-index-pill">
                          Chapter {idx + 1}
                        </span>
                        <div className="chapter-order-btns">
                          <button
                            type="button"
                            onClick={() => handleMoveSection(idx, -1)}
                            disabled={idx === 0}
                            className="btn-order-icon"
                            title="Move chapter up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveSection(idx, 1)}
                            disabled={idx === sections.length - 1}
                            className="btn-order-icon"
                            title="Move chapter down"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSection(sec.id)}
                            className="btn-order-icon danger"
                            title="Delete chapter"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Chapter Title</label>
                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) =>
                            handleUpdateSection(sec.id, 'title', e.target.value)
                          }
                          placeholder="e.g. Early Life & Childhood"
                          dir="auto"
                        />
                      </div>

                      <div className="form-group">
                        <label>Chapter Story / Content</label>
                        <textarea
                          rows={5}
                          value={sec.content}
                          onChange={(e) =>
                            handleUpdateSection(sec.id, 'content', e.target.value)
                          }
                          placeholder={
                            sec.placeholder ||
                            'Write the story, anecdotes, or historical notes for this chapter...'
                          }
                          dir="auto"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. PHOTO GALLERY & COVER BANNER EDITOR */}
        {activeTab === 'gallery' && (
          <div className="editor-pane-stack animate-fade-in">
            {/* Cover Banner Manager */}
            <div className="editor-card glass-panel">
              <div className="editor-section-top">
                <div>
                  <h3>Page Cover Banner</h3>
                  <p className="editor-helper">
                    Optional wide banner displayed at the top of {person.name}&apos;s personal page.
                  </p>
                </div>
                <div className="cover-actions-row">
                  <label className="btn-secondary flex-center upload-cover-label">
                    <Upload size={14} style={{ marginRight: 6 }} />
                    {coverPhotoUrl ? 'Change Banner' : 'Upload Banner'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {coverPhotoUrl && (
                    <button
                      type="button"
                      className="btn-danger-sm"
                      onClick={() => setCoverPhotoUrl('')}
                    >
                      Remove Banner
                    </button>
                  )}
                </div>
              </div>

              {coverPhotoUrl && (
                <div
                  className="editor-cover-preview"
                  style={{ backgroundImage: `url(${coverPhotoUrl})` }}
                />
              )}
            </div>

            {/* Gallery Album Manager */}
            <div className="editor-card glass-panel">
              <div className="editor-section-top">
                <div>
                  <h3>Photo Gallery Album ({gallery.length})</h3>
                  <p className="editor-helper">
                    Upload multiple photos, add captions, dates, and locations, or set any photo as the profile avatar.
                  </p>
                </div>
                <label className="btn-primary flex-center upload-gallery-label">
                  <Upload size={15} style={{ marginRight: 6 }} />
                  {isUploading ? 'Processing...' : 'Upload Photos'}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryFilesUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {gallery.length === 0 ? (
                <div className="editor-empty-box">
                  <ImageIcon size={32} style={{ opacity: 0.6 }} />
                  <p>No gallery photos uploaded yet. Select one or more images to start building the album.</p>
                </div>
              ) : (
                <div className="editor-gallery-list">
                  {gallery.map((photo, index) => (
                    <div key={photo.id} className="editor-photo-row">
                      <div className="editor-photo-preview-col">
                        <div className="editor-photo-thumb">
                          <img src={photo.url} alt={photo.caption || 'Gallery item'} />
                        </div>
                        <div className="photo-quick-use-btns">
                          <button
                            type="button"
                            className={`btn-mini-use ${
                              photoUrl === photo.url ? 'active' : ''
                            }`}
                            onClick={() => setPhotoUrl(photo.url)}
                            title="Use this picture as the member's main profile avatar"
                          >
                            <UserCheck size={11} />
                            <span>
                              {photoUrl === photo.url ? 'Main Avatar' : 'Set as Avatar'}
                            </span>
                          </button>
                          <button
                            type="button"
                            className={`btn-mini-use ${
                              coverPhotoUrl === photo.url ? 'active' : ''
                            }`}
                            onClick={() => setCoverPhotoUrl(photo.url)}
                            title="Use this picture as the personal page top banner"
                          >
                            <Layout size={11} />
                            <span>
                              {coverPhotoUrl === photo.url ? 'Cover Banner' : 'Set as Cover'}
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="editor-photo-fields-col">
                        <div className="photo-row-topbar">
                          <span className="chapter-index-pill">
                            Photo #{index + 1}
                          </span>
                          <div className="chapter-order-btns">
                            <button
                              type="button"
                              onClick={() => handleMovePhoto(index, -1)}
                              disabled={index === 0}
                              className="btn-order-icon"
                              title="Move earlier"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMovePhoto(index, 1)}
                              disabled={index === gallery.length - 1}
                              className="btn-order-icon"
                              title="Move later"
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(photo.id)}
                              className="btn-order-icon danger"
                              title="Delete photo"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Caption / Description</label>
                          <input
                            type="text"
                            value={photo.caption || ''}
                            onChange={(e) =>
                              handleUpdatePhoto(photo.id, 'caption', e.target.value)
                            }
                            placeholder="Describe who is in the photo or the occasion..."
                            dir="auto"
                          />
                        </div>

                        <div className="editor-two-col">
                          <div className="form-group">
                            <label>Date / Year</label>
                            <input
                              type="text"
                              value={photo.date || ''}
                              onChange={(e) =>
                                handleUpdatePhoto(photo.id, 'date', e.target.value)
                              }
                              placeholder="e.g. Summer 1978 or 1995-04-12"
                            />
                          </div>
                          <div className="form-group">
                            <label>Location</label>
                            <input
                              type="text"
                              value={photo.location || ''}
                              onChange={(e) =>
                                handleUpdatePhoto(photo.id, 'location', e.target.value)
                              }
                              placeholder="e.g. Edinburgh, Scotland"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. TIMELINE & MILESTONES EDITOR */}
        {activeTab === 'timeline' && (
          <div className="editor-pane-stack animate-fade-in">
            <div className="editor-card glass-panel">
              <div className="editor-section-top">
                <div>
                  <h3>Life Milestones &amp; Events ({timeline.length})</h3>
                  <p className="editor-helper">
                    Birth, children&apos;s births, and passing dates are included automatically. Add custom life milestones below.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-primary flex-center"
                  onClick={handleAddTimelineEvent}
                >
                  <Plus size={14} style={{ marginRight: 5 }} />
                  Add Event
                </button>
              </div>

              {timeline.length === 0 ? (
                <div className="editor-empty-box">
                  <Clock size={30} style={{ opacity: 0.6 }} />
                  <p>No custom milestones added yet. Click &ldquo;Add Event&rdquo; to record graduations, weddings, travels, or awards.</p>
                </div>
              ) : (
                <div className="editor-chapters-list">
                  {timeline.map((ev, index) => (
                    <div key={ev.id} className="editor-chapter-item">
                      <div className="chapter-item-toolbar">
                        <span className="chapter-index-pill">
                          Milestone #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTimelineEvent(ev.id)}
                          className="btn-order-icon danger"
                          title="Delete event"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="editor-two-col">
                        <div className="form-group">
                          <label>Date or Year *</label>
                          <input
                            type="text"
                            value={ev.date}
                            onChange={(e) =>
                              handleUpdateTimelineEvent(ev.id, 'date', e.target.value)
                            }
                            placeholder="e.g. 1965 or 1965-06-18"
                          />
                        </div>
                        <div className="form-group">
                          <label>Location (Optional)</label>
                          <input
                            type="text"
                            value={ev.location || ''}
                            onChange={(e) =>
                              handleUpdateTimelineEvent(
                                ev.id,
                                'location',
                                e.target.value
                              )
                            }
                            placeholder="e.g. London, UK"
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Milestone Title *</label>
                        <input
                          type="text"
                          value={ev.title}
                          onChange={(e) =>
                            handleUpdateTimelineEvent(ev.id, 'title', e.target.value)
                          }
                          placeholder="e.g. Graduated from University / Opened First Workshop"
                          dir="auto"
                        />
                      </div>

                      <div className="form-group">
                        <label>Details / Story</label>
                        <textarea
                          rows={2}
                          value={ev.description || ''}
                          onChange={(e) =>
                            handleUpdateTimelineEvent(
                              ev.id,
                              'description',
                              e.target.value
                            )
                          }
                          placeholder="Additional context about this milestone..."
                          dir="auto"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. CUSTOM ATTRIBUTES & FACTS EDITOR */}
        {activeTab === 'attributes' && (
          <div className="editor-pane-stack animate-fade-in">
            <div className="editor-card glass-panel">
              <div className="editor-section-top">
                <div>
                  <h3>Custom Facts &amp; Metadata ({customFields.length})</h3>
                  <p className="editor-helper">
                    Add key-value facts displayed on {person.name}&apos;s personal page (e.g., Nickname, Alma Mater, Languages, Blood Type, Titles).
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-primary flex-center"
                  onClick={handleAddCustomField}
                >
                  <Plus size={14} style={{ marginRight: 5 }} />
                  Add Attribute
                </button>
              </div>

              {customFields.length === 0 ? (
                <div className="editor-empty-box">
                  <p>No custom attributes added yet.</p>
                </div>
              ) : (
                <div className="editor-attributes-list">
                  {customFields.map((field, idx) => (
                    <div key={idx} className="editor-attribute-row">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) =>
                          handleUpdateCustomField(idx, 'label', e.target.value)
                        }
                        placeholder="Label (e.g. Nickname, Education)"
                      />
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) =>
                          handleUpdateCustomField(idx, 'value', e.target.value)
                        }
                        placeholder="Value"
                        dir="auto"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomField(idx)}
                        className="btn-order-icon danger"
                        title="Remove attribute"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
