import React, { useState, useMemo } from 'react';
import { 
  Table as TableIcon, 
  Plus, 
  Edit2, 
  Trash2, 
  UserPlus, 
  Eye, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Heart, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Users, 
  X
} from 'lucide-react';
import GenderAvatar from './GenderAvatar';
import './TableView.css';

export default function TableView({
  people,
  selectedPersonId,
  onSelectPerson,
  onEditPerson,
  onDeletePerson,
  onAddRelative,
  onAddPerson,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode
}) {
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'living' | 'deceased'
  const [maritalFilter, setMaritalFilter] = useState('all'); // 'all' | 'married' | 'single'

  // Lookup map for fast name resolutions (e.g. parents, spouses)
  const personMap = useMemo(() => {
    const map = new Map();
    people.forEach(p => map.set(p.id, p));
    return map;
  }, [people]);

  // Compute children count for each person
  const childrenCounts = useMemo(() => {
    const counts = new Map();
    people.forEach(p => {
      if (p.fatherId) counts.set(p.fatherId, (counts.get(p.fatherId) || 0) + 1);
      if (p.motherId) counts.set(p.motherId, (counts.get(p.motherId) || 0) + 1);
    });
    return counts;
  }, [people]);

  // Helper to calculate age or lifespan
  const calculateAge = (birthDate, deathDate, isDeceased) => {
    if (!birthDate) return null;
    const birthYear = parseInt(birthDate.substring(0, 4), 10);
    if (isNaN(birthYear)) return null;

    if (isDeceased || deathDate) {
      if (deathDate) {
        const deathYear = parseInt(deathDate.substring(0, 4), 10);
        if (!isNaN(deathYear) && deathYear >= birthYear) {
          return `${deathYear - birthYear} yrs (passed)`;
        }
      }
      return 'Deceased';
    }

    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    return `${age} yrs`;
  };

  // Toggle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtering
  const filteredPeople = useMemo(() => {
    return people.filter(p => {
      // 1. Gender filter (from viewMode)
      if (viewMode === 'male-only' && p.gender !== 'male') return false;
      if (viewMode === 'female-only' && p.gender !== 'female') return false;
      if (viewMode === 'couples-only' && !p.spouseId && !people.some(spouse => spouse.spouseId === p.id)) return false;

      // 2. Status filter
      if (statusFilter === 'living' && p.isDeceased) return false;
      if (statusFilter === 'deceased' && !p.isDeceased) return false;

      // 3. Marital filter
      const isMarried = !!p.spouseId || people.some(spouse => spouse.spouseId === p.id);
      if (maritalFilter === 'married' && !isMarried) return false;
      if (maritalFilter === 'single' && isMarried) return false;

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const father = p.fatherId ? personMap.get(p.fatherId) : null;
        const mother = p.motherId ? personMap.get(p.motherId) : null;
        const spouse = p.spouseId ? personMap.get(p.spouseId) : null;

        const matchName = p.name?.toLowerCase().includes(q);
        const matchArabic = p.arabicName?.toLowerCase().includes(q);
        const matchMaiden = p.maidenName?.toLowerCase().includes(q);
        const matchBirthPlace = p.birthPlace?.toLowerCase().includes(q);
        const matchJob = p.occupation?.toLowerCase().includes(q);
        const matchBio = p.bio?.toLowerCase().includes(q);
        const matchFather = father?.name?.toLowerCase().includes(q);
        const matchMother = mother?.name?.toLowerCase().includes(q);
        const matchSpouse = spouse?.name?.toLowerCase().includes(q);
        const matchCustom = p.customFields?.some(
          cf => cf.label.toLowerCase().includes(q) || cf.value.toLowerCase().includes(q)
        );

        if (!matchName && !matchArabic && !matchMaiden && !matchBirthPlace && !matchJob && !matchBio && !matchFather && !matchMother && !matchSpouse && !matchCustom) {
          return false;
        }
      }

      return true;
    });
  }, [people, viewMode, statusFilter, maritalFilter, searchQuery, personMap]);

  // Sorting
  const sortedPeople = useMemo(() => {
    return [...filteredPeople].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'gender':
          comparison = (a.gender || '').localeCompare(b.gender || '');
          break;
        case 'birthDate': {
          const dateA = a.birthDate || '9999';
          const dateB = b.birthDate || '9999';
          comparison = dateA.localeCompare(dateB);
          break;
        }
        case 'status': {
          const statusA = a.isDeceased ? 1 : 0;
          const statusB = b.isDeceased ? 1 : 0;
          comparison = statusA - statusB;
          break;
        }
        case 'birthPlace':
          comparison = (a.birthPlace || '').localeCompare(b.birthPlace || '');
          break;
        case 'occupation':
          comparison = (a.occupation || '').localeCompare(b.occupation || '');
          break;
        case 'children': {
          const countA = childrenCounts.get(a.id) || 0;
          const countB = childrenCounts.get(b.id) || 0;
          comparison = countA - countB;
          break;
        }
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredPeople, sortField, sortOrder, childrenCounts]);

  const stats = useMemo(() => {
    const total = people.length;
    const males = people.filter(p => p.gender === 'male').length;
    const females = people.filter(p => p.gender === 'female').length;
    const living = people.filter(p => !p.isDeceased).length;
    const deceased = people.filter(p => p.isDeceased).length;
    return { total, males, females, living, deceased };
  }, [people]);

  const renderSortIndicator = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={13} className="sort-icon-neutral" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp size={13} className="sort-icon-active" />
    ) : (
      <ArrowDown size={13} className="sort-icon-active" />
    );
  };

  const getGenderBadge = (gender) => {
    if (gender === 'male') return <span className="badge badge-male">Male</span>;
    if (gender === 'female') return <span className="badge badge-female">Female</span>;
    return <span className="badge badge-other">{gender}</span>;
  };

  return (
    <div className="table-view-container animate-fade-in">
      {/* Top Toolbar */}
      <div className="table-toolbar glass-panel">
        <div className="toolbar-left">
          <div className="view-title-wrap">
            <div className="table-icon-badge">
              <TableIcon size={18} />
            </div>
            <div>
              <h2 className="table-title">Members Directory</h2>
              <p className="table-subtitle">
                Showing {sortedPeople.length} of {people.length} family members
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="quick-metrics">
            <span className="metric-chip">
              <strong className="text-male">{stats.males}</strong> Men
            </span>
            <span className="metric-chip">
              <strong className="text-female">{stats.females}</strong> Women
            </span>
            <span className="metric-chip">
              <strong className="text-living">{stats.living}</strong> Living
            </span>
            {stats.deceased > 0 && (
              <span className="metric-chip">
                <strong className="text-deceased">{stats.deceased}</strong> Deceased
              </span>
            )}
          </div>
        </div>

        <div className="toolbar-right">
          {/* Status Filter */}
          <div className="filter-select-wrapper">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="table-filter-select"
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="living">Living Only</option>
              <option value="deceased">Deceased Only</option>
            </select>
          </div>

          {/* Marital Filter */}
          <div className="filter-select-wrapper">
            <select
              value={maritalFilter}
              onChange={(e) => setMaritalFilter(e.target.value)}
              className="table-filter-select"
              aria-label="Filter by marital status"
            >
              <option value="all">All Marriages</option>
              <option value="married">Married</option>
              <option value="single">Single</option>
            </select>
          </div>

          {(statusFilter !== 'all' || maritalFilter !== 'all' || viewMode !== 'all' || searchQuery) && (
            <button 
              onClick={() => {
                setStatusFilter('all');
                setMaritalFilter('all');
                setViewMode('all');
                setSearchQuery('');
              }}
              className="btn-clear-filters flex-center"
              title="Reset all filters"
            >
              <X size={14} style={{ marginRight: 4 }} />
              Reset
            </button>
          )}

          {/* Add Member CTA */}
          <button onClick={onAddPerson} className="btn-primary flex-center add-member-cta" id="btn-add-member-table">
            <Plus size={16} style={{ marginRight: 6 }} />
            Add Member
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="table-card glass-panel">
        <div className="table-responsive-wrapper">
          <table className="members-table" aria-label="Family members table">
            <thead>
              <tr>
                <th 
                  onClick={() => handleSort('name')} 
                  className="th-sortable col-member"
                  title="Sort by Member Name"
                >
                  <div className="th-content">
                    <span>Member</span>
                    {renderSortIndicator('name')}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('gender')} 
                  className="th-sortable col-gender"
                  title="Sort by Gender"
                >
                  <div className="th-content">
                    <span>Gender</span>
                    {renderSortIndicator('gender')}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('birthDate')} 
                  className="th-sortable col-dates"
                  title="Sort by Birth Date & Age"
                >
                  <div className="th-content">
                    <span>Dates & Age</span>
                    {renderSortIndicator('birthDate')}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('status')} 
                  className="th-sortable col-status"
                  title="Sort by Living / Deceased"
                >
                  <div className="th-content">
                    <span>Status</span>
                    {renderSortIndicator('status')}
                  </div>
                </th>

                <th className="col-relations">
                  <span>Parents</span>
                </th>

                <th className="col-spouse">
                  <span>Spouse</span>
                </th>

                <th 
                  onClick={() => handleSort('children')} 
                  className="th-sortable col-children"
                  title="Sort by Number of Children"
                >
                  <div className="th-content">
                    <span>Children</span>
                    {renderSortIndicator('children')}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('birthPlace')} 
                  className="th-sortable col-origin"
                  title="Sort by Origin & Profession"
                >
                  <div className="th-content">
                    <span>Origin & Career</span>
                    {renderSortIndicator('birthPlace')}
                  </div>
                </th>

                <th className="col-actions text-right">
                  <span>Actions</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {sortedPeople.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-table-cell">
                    <div className="empty-state-content">
                      <div className="empty-icon-wrap">
                        <Users size={32} />
                      </div>
                      <h3>No members found</h3>
                      <p>
                        {people.length === 0 
                          ? "Your family tree is currently empty. Start by adding your first family member."
                          : "No family members match your current search and filter settings."}
                      </p>
                      <div className="empty-actions">
                        {people.length > 0 && (
                          <button
                            onClick={() => {
                              setStatusFilter('all');
                              setMaritalFilter('all');
                              setViewMode('all');
                              setSearchQuery('');
                            }}
                            className="btn-secondary"
                          >
                            Clear Filters
                          </button>
                        )}
                        <button onClick={onAddPerson} className="btn-primary flex-center">
                          <Plus size={16} style={{ marginRight: 6 }} />
                          {people.length === 0 ? 'Add First Member' : 'Add New Member'}
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedPeople.map((person) => {
                  const isSelected = selectedPersonId === person.id;
                  const father = person.fatherId ? personMap.get(person.fatherId) : null;
                  const mother = person.motherId ? personMap.get(person.motherId) : null;
                  const spouse = person.spouseId ? personMap.get(person.spouseId) : null;
                  const numChildren = childrenCounts.get(person.id) || 0;
                  const ageString = calculateAge(person.birthDate, person.deathDate, person.isDeceased);

                  return (
                    <tr 
                      key={person.id} 
                      className={`member-row ${isSelected ? 'row-selected' : ''}`}
                      onClick={() => onSelectPerson(person.id)}
                      onDoubleClick={() => onEditPerson(person.id)}
                      title="Click to view details in sidebar, double-click to edit"
                    >
                      {/* 1. Member Profile */}
                      <td className="col-member">
                        <div className="member-cell">
                          <div className="avatar-wrapper">
                            {person.photoUrl ? (
                              <img
                                src={person.photoUrl}
                                alt={person.name}
                                className={`table-avatar-img fit-${person.photoFit || 'cover'}`}
                              />
                            ) : (
                              <GenderAvatar gender={person.gender} name={person.name} />
                            )}
                          </div>
                          <div className="member-text-details">
                            <div className="member-name-row">
                              <span className="member-name">{person.name}</span>
                              {person.arabicName && (
                                <span className="arabic-pill" dir="rtl" title="Arabic Name">
                                  {person.arabicName}
                                </span>
                              )}
                            </div>
                            {person.maidenName && (
                              <span className="maiden-name-sub">née {person.maidenName}</span>
                            )}
                            {person.bio && (
                              <span className="member-bio-snippet" title={person.bio}>
                                {person.bio}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Gender */}
                      <td className="col-gender">
                        {getGenderBadge(person.gender)}
                      </td>

                      {/* 3. Dates & Age */}
                      <td className="col-dates">
                        <div className="date-cell">
                          {person.birthDate ? (
                            <div className="birth-date-line">
                              <Calendar size={13} className="cell-sub-icon" />
                              <span>{person.birthDate}</span>
                            </div>
                          ) : (
                            <span className="text-muted">Birth date unknown</span>
                          )}
                          {ageString && (
                            <span className="age-pill">{ageString}</span>
                          )}
                        </div>
                      </td>

                      {/* 4. Status */}
                      <td className="col-status">
                        {person.isDeceased ? (
                          <div className="status-badge deceased">
                            <span className="status-dot deceased-dot"></span>
                            <span>Deceased</span>
                            {person.deathDate && <span className="death-year">({person.deathDate.substring(0, 4)})</span>}
                          </div>
                        ) : (
                          <div className="status-badge living">
                            <span className="status-dot living-dot"></span>
                            <span>Living</span>
                          </div>
                        )}
                      </td>

                      {/* 5. Parents */}
                      <td className="col-relations">
                        <div className="relations-cell">
                          {father ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectPerson(father.id);
                              }}
                              className="relation-pill father"
                              title={`Father: ${father.name}`}
                            >
                              <span className="relation-tag">F:</span> {father.name}
                            </button>
                          ) : null}
                          {mother ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectPerson(mother.id);
                              }}
                              className="relation-pill mother"
                              title={`Mother: ${mother.name}`}
                            >
                              <span className="relation-tag">M:</span> {mother.name}
                            </button>
                          ) : null}
                          {!father && !mother && (
                            <span className="text-muted">—</span>
                          )}
                        </div>
                      </td>

                      {/* 6. Spouse */}
                      <td className="col-spouse">
                        {spouse ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPerson(spouse.id);
                            }}
                            className="relation-pill spouse"
                            title={`Spouse: ${spouse.name}`}
                          >
                            <Heart size={12} className="heart-icon" />
                            <span>{spouse.name}</span>
                          </button>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>

                      {/* 7. Children */}
                      <td className="col-children">
                        {numChildren > 0 ? (
                          <span className="children-badge">
                            {numChildren} {numChildren === 1 ? 'child' : 'children'}
                          </span>
                        ) : (
                          <span className="text-muted">0</span>
                        )}
                      </td>

                      {/* 8. Origin & Career */}
                      <td className="col-origin">
                        <div className="origin-cell">
                          {person.occupation && (
                            <div className="origin-line" title={person.occupation}>
                              <Briefcase size={12} className="cell-sub-icon" />
                              <span className="truncate-text">{person.occupation}</span>
                            </div>
                          )}
                          {person.birthPlace && (
                            <div className="origin-line" title={person.birthPlace}>
                              <MapPin size={12} className="cell-sub-icon" />
                              <span className="truncate-text">{person.birthPlace}</span>
                            </div>
                          )}
                          {!person.occupation && !person.birthPlace && (
                            <span className="text-muted">—</span>
                          )}
                        </div>
                      </td>

                      {/* 9. Actions */}
                      <td className="col-actions">
                        <div className="action-buttons-group">
                          {/* Quick Inspect */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPerson(person.id);
                            }}
                            className="btn-action btn-action-view"
                            title="View member details in sidebar"
                            aria-label={`View ${person.name}`}
                          >
                            <Eye size={15} />
                          </button>

                          {/* Add Relative */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddRelative(person.id);
                            }}
                            className="btn-action btn-action-add"
                            title="Add relative (child, spouse) to this member"
                            aria-label={`Add relative to ${person.name}`}
                          >
                            <UserPlus size={15} />
                          </button>

                          {/* Edit Member */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditPerson(person.id);
                            }}
                            className="btn-action btn-action-edit"
                            title="Modify / Edit this member"
                            aria-label={`Edit ${person.name}`}
                          >
                            <Edit2 size={15} />
                          </button>

                          {/* Delete Member */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePerson(person.id);
                            }}
                            className="btn-action btn-action-delete"
                            title="Delete this member"
                            aria-label={`Delete ${person.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
