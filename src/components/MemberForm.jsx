import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Plus, Trash2, Upload, Crop, Search, ChevronDown, Check } from 'lucide-react';
import GenderAvatar from './GenderAvatar';
import PhotoCropModal from './PhotoCropModal';
import './MemberForm.css';

export default function MemberForm({
  person, // if editing, otherwise null
  people,
  initialRelation, // e.g. { relationType: 'child'|'spouse'|'parent'|'sibling', relativeId }
  onClose,
  onSave
}) {
  const [name, setName] = useState('');
  const [arabicName, setArabicName] = useState('');
  const [maidenName, setMaidenName] = useState('');
  const [gender, setGender] = useState('male');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [isDeceased, setIsDeceased] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFit, setPhotoFit] = useState('cover');
  const [showCropModal, setShowCropModal] = useState(false);
  const [fatherId, setFatherId] = useState('');
  const [motherId, setMotherId] = useState('');
  const [spouseId, setSpouseId] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [occupation, setOccupation] = useState('');
  const [bio, setBio] = useState('');
  const [customFields, setCustomFields] = useState([]);
  const [activeRelationType, setActiveRelationType] = useState(
    initialRelation?.relationType || 'child'
  );

  const applyRelativePreset = (relType, relativeId) => {
    const relative = people.find((p) => p.id === relativeId);
    if (!relative) return;

    setFatherId('');
    setMotherId('');
    setSpouseId('');

    if (relType === 'child') {
      if (relative.gender === 'male') {
        setFatherId(relative.id);
        if (relative.spouseId) setMotherId(relative.spouseId);
      } else if (relative.gender === 'female') {
        setMotherId(relative.id);
        if (relative.spouseId) setFatherId(relative.spouseId);
      }
    } else if (relType === 'spouse') {
      setSpouseId(relative.id);
      if (relative.gender === 'male') setGender('female');
      else if (relative.gender === 'female') setGender('male');
    } else if (relType === 'sibling') {
      if (relative.fatherId) setFatherId(relative.fatherId);
      if (relative.motherId) setMotherId(relative.motherId);
    } else if (relType === 'parent') {
      // If the relative already has one parent, offer to link as spouse of that parent
      if (relative.fatherId && !relative.motherId) {
        setGender('female');
        setSpouseId(relative.fatherId);
      } else if (relative.motherId && !relative.fatherId) {
        setGender('male');
        setSpouseId(relative.motherId);
      }
    }
  };

  // Populate form on edit or relationship auto-fill
  useEffect(() => {
    if (person) {
      setName(person.name || '');
      setArabicName(person.arabicName || '');
      setMaidenName(person.maidenName || '');
      setGender(person.gender || 'male');
      setBirthDate(person.birthDate || '');
      setDeathDate(person.deathDate || '');
      setIsDeceased(person.isDeceased || false);
      setPhotoUrl(person.photoUrl || '');
      setPhotoFit(person.photoFit || 'cover');
      setFatherId(person.fatherId || '');
      setMotherId(person.motherId || '');
      setSpouseId(person.spouseId || '');
      setBirthPlace(person.birthPlace || '');
      setOccupation(person.occupation || '');
      setBio(person.bio || '');
      setCustomFields(person.customFields || []);
    } else {
      setName('');
      setArabicName('');
      setMaidenName('');
      setGender('male');
      setBirthDate('');
      setDeathDate('');
      setIsDeceased(false);
      setPhotoUrl('');
      setPhotoFit('cover');
      setFatherId('');
      setMotherId('');
      setSpouseId('');
      setBirthPlace('');
      setOccupation('');
      setBio('');
      setCustomFields([]);

      if (initialRelation) {
        const relType = initialRelation.relationType || 'child';
        setActiveRelationType(relType);
        applyRelativePreset(relType, initialRelation.relativeId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person, initialRelation, people]);

  const handleRelationTypeSwitch = (newType) => {
    setActiveRelationType(newType);
    if (initialRelation?.relativeId) {
      applyRelativePreset(newType, initialRelation.relativeId);
    }
  };

  // Handle Photo upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Custom Fields management
  const addCustomField = () => {
    setCustomFields([...customFields, { label: '', value: '' }]);
  };

  const updateCustomField = (index, key, value) => {
    const updated = [...customFields];
    updated[index][key] = value;
    setCustomFields(updated);
  };

  const removeCustomField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  // Submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const validCustomFields = customFields.filter(
      (f) => f.label.trim() && f.value.trim()
    );

    const savedPerson = {
      ...(person || {}),
      id: person ? person.id : `member-${Date.now()}`,
      name,
      arabicName: arabicName.trim() || undefined,
      maidenName: maidenName.trim() || undefined,
      gender,
      birthDate: birthDate || undefined,
      deathDate: isDeceased ? deathDate || undefined : undefined,
      isDeceased,
      photoUrl: photoUrl || undefined,
      photoFit: photoFit || undefined,
      fatherId: fatherId || undefined,
      motherId: motherId || undefined,
      spouseId: spouseId || undefined,
      birthPlace: birthPlace.trim() || undefined,
      occupation: occupation.trim() || undefined,
      bio: bio.trim() || undefined,
      customFields: validCustomFields.length > 0 ? validCustomFields : undefined
    };

    onSave(
      savedPerson,
      initialRelation
        ? {
            relationType: activeRelationType,
            relativeId: initialRelation.relativeId
          }
        : null
    );
  };

  const candidatePeople = people.filter((p) => !person || p.id !== person.id);
  const fathers = candidatePeople.filter((p) => p.gender === 'male');
  const mothers = candidatePeople.filter((p) => p.gender === 'female');
  const spouses = candidatePeople;

  const targetRelative = initialRelation?.relativeId
    ? people.find((p) => p.id === initialRelation.relativeId)
    : null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-fade-in">
        <div className="modal-header">
          <div>
            <h2>
              {person
                ? `Edit ${person.name}`
                : targetRelative
                ? `Add Relative to ${targetRelative.name}`
                : 'Add Family Member'}
            </h2>
          </div>
          <button onClick={onClose} className="btn-close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {!person && targetRelative && (
            <div className="relation-type-selector-bar">
              <span className="rel-bar-label">
                Relationship to <strong>{targetRelative.name}</strong>:
              </span>
              <div className="rel-type-pills">
                {[
                  { id: 'child', label: 'Child' },
                  { id: 'spouse', label: 'Spouse' },
                  { id: 'parent', label: 'Parent' },
                  { id: 'sibling', label: 'Sibling' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`rel-type-pill-btn ${
                      activeRelationType === opt.id ? 'active' : ''
                    }`}
                    onClick={() => handleRelationTypeSwitch(opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="form-sections-container">
            {/* Left Side: General Profile Info */}
            <div className="form-section flex-1">
              <h3>Personal Information</h3>

              <div className="avatar-upload-section">
                <div className={`avatar-preview fit-${photoFit}`}>
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Avatar Preview"
                      className={`avatar-img fit-${photoFit}`}
                    />
                  ) : (
                    <GenderAvatar gender={gender} name={name} />
                  )}
                </div>
                <div className="avatar-controls-cluster">
                  <label className="btn-secondary upload-btn">
                    <Upload size={14} style={{ marginRight: 6 }} />
                    {photoUrl ? 'Change Photo' : 'Upload Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setShowCropModal(true)}
                      className="btn-secondary crop-scale-btn"
                      title="Crop or scale photo"
                    >
                      <Crop size={14} style={{ marginRight: 6 }} />
                      Crop / Scale
                    </button>
                  )}
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoUrl('');
                        setPhotoFit('cover');
                      }}
                      className="btn-danger-sm"
                      title="Remove photo"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="member-name">Full Name *</label>
                <input
                  id="member-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jane Smith"
                />
              </div>

              <div className="form-group">
                <label htmlFor="member-arabic-name">Arabic Name (Optional)</label>
                <input
                  id="member-arabic-name"
                  type="text"
                  value={arabicName}
                  onChange={(e) => setArabicName(e.target.value)}
                  placeholder="e.g. الاسم بالكامل باللغة العربية"
                  dir="rtl"
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label htmlFor="member-gender">Gender</label>
                  <select
                    id="member-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group flex-1">
                  <label htmlFor="member-maiden">
                    Name Before Marriage (Maiden)
                  </label>
                  <input
                    id="member-maiden"
                    type="text"
                    value={maidenName}
                    onChange={(e) => setMaidenName(e.target.value)}
                    placeholder="e.g. Maiden surname"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label htmlFor="member-birth">Date of Birth</label>
                  <input
                    id="member-birth"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>

                <div className="form-group flex-1">
                  <label htmlFor="member-birthplace">Place of Birth</label>
                  <input
                    id="member-birthplace"
                    type="text"
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1 checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isDeceased}
                      onChange={(e) => setIsDeceased(e.target.checked)}
                    />
                    Deceased / Passed Away
                  </label>
                </div>

                {isDeceased && (
                  <div className="form-group flex-1">
                    <label htmlFor="member-death">Date of Death</label>
                    <input
                      id="member-death"
                      type="date"
                      value={deathDate}
                      onChange={(e) => setDeathDate(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="member-job">Occupation</label>
                <input
                  id="member-job"
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="e.g. Teacher, Engineer"
                />
              </div>

              <div className="form-group">
                <label htmlFor="member-bio">Biography</label>
                <textarea
                  id="member-bio"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell a story or add highlights about their life..."
                />
              </div>
            </div>

            {/* Right Side: Relationships & Custom Fields */}
            <div className="form-section flex-1 border-left-dev">
              <h3>Family Ties &amp; Attributes</h3>

              <SearchablePersonSelect
                id="member-father"
                label="Father"
                placeholder="-- Select Father --"
                value={fatherId}
                options={fathers}
                onChange={setFatherId}
              />

              <SearchablePersonSelect
                id="member-mother"
                label="Mother"
                placeholder="-- Select Mother --"
                value={motherId}
                options={mothers}
                onChange={setMotherId}
              />

              <SearchablePersonSelect
                id="member-spouse"
                label="Spouse"
                placeholder="-- Select Spouse --"
                value={spouseId}
                options={spouses}
                showGender
                onChange={setSpouseId}
              />

              {/* Custom fields section */}
              <div className="custom-fields-section">
                <div className="custom-fields-header">
                  <h4>Custom Data Fields</h4>
                  <button
                    type="button"
                    onClick={addCustomField}
                    className="btn-secondary-sm flex-center"
                  >
                    <Plus size={12} style={{ marginRight: 4 }} /> Add Field
                  </button>
                </div>

                <div className="custom-fields-rows">
                  {customFields.map((field, index) => (
                    <div key={index} className="custom-field-row">
                      <input
                        type="text"
                        placeholder="Label (e.g. Eye Color)"
                        value={field.label}
                        onChange={(e) =>
                          updateCustomField(index, 'label', e.target.value)
                        }
                        className="flex-1"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={field.value}
                        onChange={(e) =>
                          updateCustomField(index, 'value', e.target.value)
                        }
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomField(index)}
                        className="btn-icon-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {customFields.length === 0 && (
                    <p className="custom-fields-empty">
                      Add metadata fields like Nickname, Education, or Military Rank.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Member
            </button>
          </div>
        </form>
      </div>

      {showCropModal && (
        <PhotoCropModal
          person={{
            name,
            gender,
            birthDate,
            deathDate,
            isDeceased,
            photoUrl,
            photoFit
          }}
          onSave={({ photoUrl: newUrl, photoFit: newFit }) => {
            setPhotoUrl(newUrl);
            if (newFit) setPhotoFit(newFit);
          }}
          onClose={() => setShowCropModal(false)}
        />
      )}
    </div>
  );
}

function SearchablePersonSelect({
  id,
  label,
  placeholder,
  value,
  options,
  showGender = false,
  onChange
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedPerson = useMemo(
    () => options.find((p) => p.id === value) || null,
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((p) => {
      const matchName = p.name?.toLowerCase().includes(q);
      const matchArabic = p.arabicName?.toLowerCase().includes(q);
      const matchMaiden = p.maidenName?.toLowerCase().includes(q);
      const matchBirth = p.birthDate?.toLowerCase().includes(q);
      const matchPlace = p.birthPlace?.toLowerCase().includes(q);
      return (
        matchName || matchArabic || matchMaiden || matchBirth || matchPlace
      );
    });
  }, [options, query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Auto-focus search input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => searchInputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  const handleSelect = (newId) => {
    onChange(newId);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="form-group searchable-select-group" ref={wrapperRef}>
      <label htmlFor={id}>{label}</label>
      <div className="searchable-select-container">
        <button
          id={id}
          type="button"
          className={`searchable-select-trigger ${isOpen ? 'is-open' : ''} ${
            selectedPerson ? 'has-value' : ''
          }`}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="searchable-trigger-text">
            {selectedPerson ? (
              <>
                <span className="selected-person-name">
                  {selectedPerson.name}
                </span>
                {selectedPerson.arabicName && (
                  <span className="selected-person-arabic" dir="rtl">
                    {selectedPerson.arabicName}
                  </span>
                )}
                {showGender && (
                  <span className="selected-person-meta">
                    ({selectedPerson.gender})
                  </span>
                )}
              </>
            ) : (
              <span className="searchable-placeholder">{placeholder}</span>
            )}
          </span>

          <span className="searchable-trigger-icons">
            {selectedPerson && (
              <span
                role="button"
                tabIndex={0}
                className="searchable-clear-btn"
                title="Clear selection"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    handleSelect('');
                  }
                }}
              >
                <X size={13} />
              </span>
            )}
            <ChevronDown
              size={15}
              className={`searchable-chevron ${isOpen ? 'rotated' : ''}`}
            />
          </span>
        </button>

        {isOpen && (
          <div className="searchable-dropdown-popover glass-panel">
            <div className="searchable-input-wrap">
              <Search size={14} className="searchable-input-icon" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.stopPropagation();
                    setIsOpen(false);
                  } else if (
                    e.key === 'Enter' &&
                    filteredOptions.length > 0
                  ) {
                    e.preventDefault();
                    handleSelect(filteredOptions[0].id);
                  }
                }}
                placeholder={`Search ${label.toLowerCase()} by name, Arabic name, year...`}
                className="searchable-filter-input"
              />
              {query && (
                <button
                  type="button"
                  className="searchable-query-clear"
                  onClick={() => setQuery('')}
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="searchable-options-list" role="listbox">
              <button
                type="button"
                role="option"
                aria-selected={!value}
                className={`searchable-option-item none-option ${
                  !value ? 'is-selected' : ''
                }`}
                onClick={() => handleSelect('')}
              >
                <span>{placeholder} (None)</span>
                {!value && <Check size={14} className="option-check-icon" />}
              </button>

              {filteredOptions.length === 0 ? (
                <div className="searchable-no-results">
                  No matching family members found
                </div>
              ) : (
                filteredOptions.map((item) => {
                  const isSelected = item.id === value;
                  const birthYear = item.birthDate
                    ? item.birthDate.substring(0, 4)
                    : null;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`searchable-option-item ${
                        isSelected ? 'is-selected' : ''
                      }`}
                      onClick={() => handleSelect(item.id)}
                    >
                      <div className="searchable-option-main">
                        <div className="searchable-option-title">
                          <span className="opt-name">{item.name}</span>
                          {item.arabicName && (
                            <span className="opt-arabic" dir="rtl">
                              {item.arabicName}
                            </span>
                          )}
                          {item.maidenName && (
                            <span className="opt-maiden">
                              ({item.maidenName})
                            </span>
                          )}
                        </div>
                        <div className="searchable-option-sub">
                          {showGender && (
                            <span className={`opt-gender gender-${item.gender}`}>
                              {item.gender}
                            </span>
                          )}
                          {birthYear && <span>b. {birthYear}</span>}
                          {item.birthPlace && <span>• {item.birthPlace}</span>}
                        </div>
                      </div>
                      {isSelected && (
                        <Check size={14} className="option-check-icon" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
