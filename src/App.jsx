import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GripVertical, PanelRightClose, PanelRightOpen, Maximize2 } from 'lucide-react';
import Header from './components/Header';
import TreeViewer from './components/TreeViewer';
import TableView from './components/TableView';
import MemberPersonalPage from './components/MemberPersonalPage';
import PersonalPageEditor from './components/PersonalPageEditor';
import MemberForm from './components/MemberForm';
import BulkImport from './components/BulkImport';
import ExportModal from './components/ExportModal';
import PhotoCropModal from './components/PhotoCropModal';
import ThemeModal from './components/ThemeModal';
import AuthModal from './components/AuthModal';
import { initialPeople } from './utils/mockData';
import {
  loadFamilyTreeFromDB,
  saveFamilyTreeToDB,
  fetchFamilyTreeFromServer,
  saveFamilyTreeToServer,
  fetchCurrentUser,
  setStoredAuthToken
} from './utils/storageHelper';
import {
  DEFAULT_CUSTOM_THEME,
  applyThemeToDocument
} from './utils/themeHelper';
import './App.css';

export default function App() {
  // Load family tree from localStorage initially, then hydrate from IndexedDB if available
  const [people, setPeople] = useState(() => {
    try {
      const saved = localStorage.getItem('shajra_family_tree');
      return saved ? JSON.parse(saved) : initialPeople;
    } catch {
      return initialPeople;
    }
  });

  const [dbHydrated, setDbHydrated] = useState(false);

  // Hydrate from shared server API first (/api/tree), falling back to local IndexedDB
  useEffect(() => {
    let mounted = true;

    async function hydrateTreeData() {
      const [serverData, localDbPeople] = await Promise.all([
        fetchFamilyTreeFromServer(),
        loadFamilyTreeFromDB()
      ]);

      if (!mounted) return;

      if (serverData && serverData.initialized && Array.isArray(serverData.people)) {
        // 1. Server has the shared family tree -> use it everywhere (Incognito, other devices, etc.)
        setPeople(serverData.people);
        if (serverData.pinnedPersonId) {
          setPinnedPersonId(serverData.pinnedPersonId);
          localStorage.setItem('shajra_pinned_person_id', serverData.pinnedPersonId);
          setSelectedPersonId(serverData.pinnedPersonId);
        } else if (serverData.people.length > 0) {
          const root =
            serverData.people.find((p) => !p.fatherId && !p.motherId) ||
            serverData.people[0];
          setSelectedPersonId(root.id);
        }
      } else if (Array.isArray(localDbPeople) && localDbPeople.length > 0) {
        // 2. Server is fresh/uninitialized, but this browser already has a tree in IndexedDB -> migrate it to the server!
        setPeople(localDbPeople);
        const currentPin = localStorage.getItem('shajra_pinned_person_id') || null;
        if (serverData && !serverData.initialized) {
          saveFamilyTreeToServer(localDbPeople, currentPin);
        }
      } else if (serverData && !serverData.initialized) {
        // 3. Both server and browser are brand new -> seed server with initialPeople
        const currentPin = localStorage.getItem('shajra_pinned_person_id') || null;
        saveFamilyTreeToServer(initialPeople, currentPin);
      }

      setDbHydrated(true);
    }

    hydrateTreeData();
    return () => {
      mounted = false;
    };
  }, []);

  // View selection state (persisted to localStorage and URL)
  const [activeView, setActiveView] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      if (viewParam === 'table' || viewParam === 'tree') return viewParam;
      return localStorage.getItem('shajra_active_view') || 'tree';
    } catch {
      return 'tree';
    }
  });

  const handleViewChange = (view) => {
    setActiveView(view);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('view', view);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore
    }
  };

  // Pinned person state (persisted to localStorage)
  const [pinnedPersonId, setPinnedPersonId] = useState(() => {
    try {
      return localStorage.getItem('shajra_pinned_person_id') || null;
    } catch {
      return null;
    }
  });

  // Selected person state: default to pinned person on load, or first root member
  const [selectedPersonId, setSelectedPersonId] = useState(() => {
    try {
      const pinned = localStorage.getItem('shajra_pinned_person_id');
      const saved = localStorage.getItem('shajra_family_tree');
      const list = saved ? JSON.parse(saved) : initialPeople;
      if (pinned && list.some((p) => p.id === pinned)) {
        return pinned;
      }
      const root = list.find((p) => !p.fatherId && !p.motherId) || list[0];
      return root ? root.id : null;
    } catch {
      return initialPeople[0]?.id || null;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('all'); // all | male-only | female-only | couples-only

  // Movable Split-Screen State (percentage width of the left pane: 22% to 78%)
  const [leftPanePercent, setLeftPanePercent] = useState(() => {
    try {
      const saved = Number(localStorage.getItem('shajra_split_percent'));
      return saved >= 22 && saved <= 78 ? saved : 54;
    } catch {
      return 54;
    }
  });
  const [isRightPaneCollapsed, setIsRightPaneCollapsed] = useState(false);
  const [isResizingSplit, setIsResizingSplit] = useState(false);
  const workspaceRef = useRef(null);

  // Personal Page Editor State (rendered inside the Right Pane)
  const [isEditingPersonalPage, setIsEditingPersonalPage] = useState(false);
  const [editorInitialSection, setEditorInitialSection] = useState('story');

  // Modals state
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [formPerson, setFormPerson] = useState(null); // Person object if editing
  const [initialRelation, setInitialRelation] = useState(null); // { relationType, relativeId }
  const [cropModalPerson, setCropModalPerson] = useState(null); // Person object for photo crop/scale modal

  // User Role State: defaults to Viewer mode on load
  const [currentUser, setCurrentUser] = useState({
    username: 'viewer',
    role: 'viewer',
    isDefaultViewer: true
  });
  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    let mounted = true;
    fetchCurrentUser().then((user) => {
      if (mounted && user) {
        setCurrentUser(user);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogoutToViewer = () => {
    setStoredAuthToken(null);
    setCurrentUser((prev) => ({
      username: 'viewer',
      role: 'viewer',
      isDefaultViewer: true,
      accountsInfo: prev.accountsInfo
    }));
    setIsEditingPersonalPage(false);
    setShowForm(false);
    setShowImport(false);
    setCropModalPerson(null);
  };

  // Theme State: 'dark' | 'light' | 'custom'
  const [themeMode, setThemeMode] = useState(() => {
    try {
      const saved = localStorage.getItem('shajra_theme_mode');
      if (saved === 'light' || saved === 'dark' || saved === 'custom') {
        return saved;
      }
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  const [customTheme, setCustomTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('shajra_custom_theme');
      return saved
        ? { ...DEFAULT_CUSTOM_THEME, ...JSON.parse(saved) }
        : DEFAULT_CUSTOM_THEME;
    } catch {
      return DEFAULT_CUSTOM_THEME;
    }
  });

  // Apply and persist theme whenever themeMode or customTheme changes
  useEffect(() => {
    applyThemeToDocument(themeMode, customTheme);
    try {
      localStorage.setItem('shajra_theme_mode', themeMode);
      localStorage.setItem('shajra_custom_theme', JSON.stringify(customTheme));
    } catch {
      // ignore storage errors
    }
  }, [themeMode, customTheme]);

  // Handle movable split-pane drag
  const handleDividerPointerDown = (e) => {
    if (e.target.closest('button')) return;
    e.preventDefault();
    setIsResizingSplit(true);
  };

  const handleGlobalPointerMove = useCallback(
    (e) => {
      if (!isResizingSplit || !workspaceRef.current) return;
      const rect = workspaceRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const rawPercent = ((clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(78, Math.max(22, Number(rawPercent.toFixed(1))));
      setLeftPanePercent(clamped);
      if (isRightPaneCollapsed && clamped < 76) {
        setIsRightPaneCollapsed(false);
      }
    },
    [isResizingSplit, isRightPaneCollapsed]
  );

  const handleGlobalPointerUp = useCallback(() => {
    if (isResizingSplit) {
      setIsResizingSplit(false);
      try {
        localStorage.setItem('shajra_split_percent', String(leftPanePercent));
      } catch {
        // ignore
      }
    }
  }, [isResizingSplit, leftPanePercent]);

  useEffect(() => {
    if (isResizingSplit) {
      window.addEventListener('mousemove', handleGlobalPointerMove);
      window.addEventListener('mouseup', handleGlobalPointerUp);
      window.addEventListener('touchmove', handleGlobalPointerMove);
      window.addEventListener('touchend', handleGlobalPointerUp);
      return () => {
        window.removeEventListener('mousemove', handleGlobalPointerMove);
        window.removeEventListener('mouseup', handleGlobalPointerUp);
        window.removeEventListener('touchmove', handleGlobalPointerMove);
        window.removeEventListener('touchend', handleGlobalPointerUp);
      };
    }
  }, [isResizingSplit, handleGlobalPointerMove, handleGlobalPointerUp]);

  const handleDividerKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setLeftPanePercent((prev) => {
        const next = Math.max(22, prev - 3);
        localStorage.setItem('shajra_split_percent', String(next));
        return next;
      });
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setLeftPanePercent((prev) => {
        const next = Math.min(78, prev + 3);
        localStorage.setItem('shajra_split_percent', String(next));
        return next;
      });
    }
  };

  const handleOpenCropModal = (person) => {
    setCropModalPerson(person);
  };

  const handleSaveCroppedPhoto = ({ photoUrl, photoFit }) => {
    if (!cropModalPerson) return;
    const updated = {
      ...cropModalPerson,
      photoUrl: photoUrl || undefined,
      photoFit: photoFit || cropModalPerson.photoFit || 'cover'
    };
    handleSavePerson(updated);
    setCropModalPerson(null);
  };

  const handleTogglePhotoFit = (person, newFit) => {
    const updated = {
      ...person,
      photoFit: newFit
    };
    handleSavePerson(updated);
  };

  // Toggle pin on a member (only one member pinned at a time)
  const handleTogglePinPerson = (id) => {
    setPinnedPersonId((prev) => {
      const next = prev === id ? null : id;
      if (next) {
        localStorage.setItem('shajra_pinned_person_id', next);
        setSelectedPersonId(next);
      } else {
        localStorage.removeItem('shajra_pinned_person_id');
      }
      return next;
    });
  };

  // Jump to pinned default member in tree view
  const handleGoToPinned = () => {
    if (pinnedPersonId) {
      setSelectedPersonId(pinnedPersonId);
      setActiveView('tree');
      setIsRightPaneCollapsed(false);
    }
  };

  // Sync to Server API, IndexedDB & localStorage once initial hydration completes
  useEffect(() => {
    if (!dbHydrated) return;
    saveFamilyTreeToDB(people);
    if (isAdmin) {
      saveFamilyTreeToServer(people, pinnedPersonId);
    }
  }, [people, pinnedPersonId, dbHydrated, isAdmin]);

  useEffect(() => {
    localStorage.setItem('shajra_active_view', activeView);
  }, [activeView]);

  // Handle member selection
  const handleSelectPerson = (id) => {
    setSelectedPersonId(id);
    if (isRightPaneCollapsed) {
      setIsRightPaneCollapsed(false);
    }
  };

  // Handle member deletions
  const handleDeletePerson = (id) => {
    if (window.confirm('Are you sure you want to remove this family member?')) {
      const updatedPeople = people
        .filter((p) => p.id !== id)
        .map((p) => {
          const copy = { ...p };
          if (copy.fatherId === id) delete copy.fatherId;
          if (copy.motherId === id) delete copy.motherId;
          if (copy.spouseId === id) delete copy.spouseId;
          return copy;
        });
      setPeople(updatedPeople);
      if (selectedPersonId === id) {
        setSelectedPersonId(updatedPeople[0]?.id || null);
        setIsEditingPersonalPage(false);
      }
      if (pinnedPersonId === id) {
        setPinnedPersonId(null);
        localStorage.removeItem('shajra_pinned_person_id');
      }
    }
  };

  // Add/Edit Save callback (with bidirectional spouse & relative link syncing)
  const handleSavePerson = (savedPerson, relationLinkInfo) => {
    const existingRecord = people.find((p) => p.id === savedPerson.id);
    const previousSpouseId = existingRecord?.spouseId;
    let updatedPeople = [];

    if (existingRecord) {
      updatedPeople = people.map((p) =>
        p.id === savedPerson.id ? savedPerson : p
      );
    } else {
      updatedPeople = [...people, savedPerson];
    }

    // If previous spouse was cleared or changed, unlink old spouse
    if (previousSpouseId && previousSpouseId !== savedPerson.spouseId) {
      updatedPeople = updatedPeople.map((p) => {
        if (p.id === previousSpouseId && p.spouseId === savedPerson.id) {
          const copy = { ...p };
          delete copy.spouseId;
          return copy;
        }
        return p;
      });
    }

    // Bidirectionally sync new spouse references
    if (savedPerson.spouseId) {
      updatedPeople = updatedPeople.map((p) => {
        if (p.id === savedPerson.spouseId) {
          return { ...p, spouseId: savedPerson.id };
        }
        if (p.spouseId === savedPerson.spouseId && p.id !== savedPerson.id) {
          const copy = { ...p };
          delete copy.spouseId;
          return copy;
        }
        return p;
      });
    }

    // If adding a parent to an existing member (relationType === 'parent'), link the child to this new parent
    if (
      relationLinkInfo &&
      relationLinkInfo.relationType === 'parent' &&
      relationLinkInfo.relativeId
    ) {
      updatedPeople = updatedPeople.map((p) => {
        if (p.id === relationLinkInfo.relativeId) {
          if (savedPerson.gender === 'female') {
            return { ...p, motherId: savedPerson.id };
          }
          return { ...p, fatherId: savedPerson.id };
        }
        return p;
      });
    }

    setPeople(updatedPeople);
    setSelectedPersonId(savedPerson.id);
    setShowForm(false);
    setFormPerson(null);
    setInitialRelation(null);
  };

  // Save callback from PersonalPageEditor
  const handleSavePersonalPage = (updatedPerson) => {
    setPeople((prev) =>
      prev.map((p) => (p.id === updatedPerson.id ? updatedPerson : p))
    );
    setIsEditingPersonalPage(false);
  };

  // Open PersonalPageEditor in right pane
  const handleOpenPersonalPageEditor = (person, section = 'story') => {
    if (person) {
      setSelectedPersonId(person.id);
    }
    setEditorInitialSection(section);
    setIsEditingPersonalPage(true);
    setIsRightPaneCollapsed(false);
  };

  // Bulk load import callback
  const handleImportPeople = (importedList, importedPinnedId) => {
    let list = importedList;
    let pinId = importedPinnedId || null;

    if (!Array.isArray(importedList) && importedList?.people) {
      list = importedList.people;
      pinId = importedList.pinnedPersonId || pinId;
    }

    if (!pinId && Array.isArray(list)) {
      const found = list.find(
        (p) => p.isPinned === true || p.isPinned === 'true'
      );
      if (found) pinId = found.id;
    }

    // Merge members based on ID, updating existing ones
    const mergedMap = new Map(people.map((p) => [p.id, p]));
    list.forEach((item) => {
      mergedMap.set(item.id, item);
    });
    const updated = Array.from(mergedMap.values());
    setPeople(updated);

    if (pinId && updated.some((p) => p.id === pinId)) {
      setPinnedPersonId(pinId);
      localStorage.setItem('shajra_pinned_person_id', pinId);
      setSelectedPersonId(pinId);
      handleViewChange('tree');
    } else if (list.length > 0) {
      setSelectedPersonId(list[0].id);
    }
  };

  // Relation trigger handler
  const handleAddRelativeTrigger = (relativeId, relationType = 'child') => {
    setInitialRelation({
      relationType,
      relativeId
    });
    setFormPerson(null);
    setShowForm(true);
  };

  // Edit trigger handler
  const handleEditTrigger = (id) => {
    const personToEdit = people.find((p) => p.id === id);
    if (personToEdit) {
      setFormPerson(personToEdit);
      setInitialRelation(null);
      setShowForm(true);
    }
  };

  // Purge tree handler
  const handlePurgeTree = () => {
    if (
      window.confirm(
        'Are you absolutely sure you want to purge the ENTIRE family tree? This will delete all members and cannot be undone.'
      )
    ) {
      setPeople([]);
      setSelectedPersonId(null);
      setPinnedPersonId(null);
      setIsEditingPersonalPage(false);
      localStorage.removeItem('shajra_pinned_person_id');
    }
  };

  // Ordered list of matching people for search navigation & auto-panning
  const searchMatchedPeople = React.useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    // Score matches so direct name matches appear first
    const scored = [];
    people.forEach((p) => {
      const nameLower = p.name.toLowerCase();
      const arabicLower = p.arabicName?.toLowerCase() || '';
      const maidenLower = p.maidenName?.toLowerCase() || '';

      const matchNameStarts = nameLower.startsWith(query);
      const matchName = nameLower.includes(query);
      const matchArabic = arabicLower.includes(query);
      const matchMaiden = maidenLower.includes(query);
      const matchBio = p.bio?.toLowerCase().includes(query);
      const matchPlace = p.birthPlace?.toLowerCase().includes(query);
      const matchJob = p.occupation?.toLowerCase().includes(query);
      const matchCustom = p.customFields?.some(
        (cf) =>
          cf.label.toLowerCase().includes(query) ||
          cf.value.toLowerCase().includes(query)
      );
      const matchChapters = p.personalPage?.sections?.some(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.content.toLowerCase().includes(query)
      );

      if (
        matchName ||
        matchArabic ||
        matchMaiden ||
        matchBio ||
        matchPlace ||
        matchJob ||
        matchCustom ||
        matchChapters
      ) {
        const priority = matchNameStarts
          ? 1
          : matchName || matchArabic
          ? 2
          : matchMaiden
          ? 3
          : 4;
        scored.push({ person: p, priority });
      }
    });

    scored.sort((a, b) => a.priority - b.priority);
    return scored.map((item) => item.person);
  }, [people, searchQuery]);

  // Compute search matching IDs set (without removing non-matching nodes from the tree graph!)
  const searchMatchIds = React.useMemo(() => {
    if (!searchQuery.trim()) return null;
    return new Set(searchMatchedPeople.map((p) => p.id));
  }, [searchQuery, searchMatchedPeople]);

  const [searchMatchIndex, setSearchMatchIndex] = useState(0);

  // Automatically select & pan to the best matching family member when searching
  useEffect(() => {
    if (!searchQuery.trim() || searchMatchedPeople.length === 0) {
      setSearchMatchIndex(0);
      return;
    }
    setSearchMatchIndex(0);
    const firstMatch = searchMatchedPeople[0];
    if (firstMatch) {
      setSelectedPersonId(firstMatch.id);
    }
  }, [searchQuery, searchMatchedPeople]);

  const handleCycleSearchMatch = (direction = 1) => {
    if (searchMatchedPeople.length === 0) return;
    const nextIdx =
      (searchMatchIndex + direction + searchMatchedPeople.length) %
      searchMatchedPeople.length;
    setSearchMatchIndex(nextIdx);
    setSelectedPersonId(searchMatchedPeople[nextIdx].id);
  };

  // Resolve currently active person details
  const selectedPerson = people.find((p) => p.id === selectedPersonId) || null;
  const pinnedPerson = people.find((p) => p.id === pinnedPersonId) || null;

  return (
    <div
      className={`app-container ${isResizingSplit ? 'is-resizing-split' : ''}`}
    >
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchMatchCount={
          searchQuery.trim() ? searchMatchedPeople.length : null
        }
        searchMatchIndex={searchMatchIndex}
        onCycleSearchMatch={handleCycleSearchMatch}
        viewMode={viewMode}
        setViewMode={setViewMode}
        activeView={activeView}
        setActiveView={handleViewChange}
        themeMode={themeMode}
        onThemeModeChange={(mode) => setThemeMode(mode)}
        onOpenThemeModal={() => setShowThemeModal(true)}
        isAdmin={isAdmin}
        currentUser={currentUser}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onImportClick={() => isAdmin && setShowImport(true)}
        onExportClick={() => setShowExport(true)}
        onPurgeClick={() => isAdmin && handlePurgeTree()}
        onAddClick={() => {
          if (!isAdmin) return;
          setFormPerson(null);
          setInitialRelation(null);
          setShowForm(true);
        }}
        memberCount={people.length}
        pinnedPerson={pinnedPerson}
        onGoToPinned={handleGoToPinned}
      />

      {/* Movable Two-Pane Split Workspace */}
      <main className="main-content split-workspace" ref={workspaceRef}>
        {/* LEFT PANE: Family Tree or Table Directory Space */}
        <section
          className="split-pane split-pane-left"
          style={{
            width: isRightPaneCollapsed ? '100%' : `${leftPanePercent}%`
          }}
          aria-label="Family Tree Space"
        >
          {activeView === 'tree' ? (
            <TreeViewer
              people={people}
              searchMatchIds={searchMatchIds}
              selectedPersonId={selectedPersonId}
              onSelectPerson={handleSelectPerson}
              viewMode={viewMode}
              onCropPhoto={isAdmin ? handleOpenCropModal : null}
              onToggleFit={isAdmin ? handleTogglePhotoFit : null}
              pinnedPersonId={pinnedPersonId}
              onTogglePin={isAdmin ? handleTogglePinPerson : null}
            />
          ) : (
            <TableView
              people={people}
              isAdmin={isAdmin}
              selectedPersonId={selectedPersonId}
              onSelectPerson={handleSelectPerson}
              onEditPerson={handleEditTrigger}
              onDeletePerson={handleDeletePerson}
              onAddRelative={handleAddRelativeTrigger}
              onAddPerson={() => {
                if (!isAdmin) return;
                setFormPerson(null);
                setInitialRelation(null);
                setShowForm(true);
              }}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          )}

          {/* Quick Reopen Button when Right Pane is Collapsed */}
          {isRightPaneCollapsed && (
            <button
              type="button"
              className="btn-reopen-right-pane glass-panel"
              onClick={() => setIsRightPaneCollapsed(false)}
              title="Open Member Details & Personal Page Pane"
            >
              <PanelRightOpen size={16} />
              <span>
                {selectedPerson
                  ? `${selectedPerson.name}'s Page`
                  : 'Member Personal Page'}
              </span>
            </button>
          )}
        </section>

        {/* MOVABLE SPLIT DIVIDER */}
        {!isRightPaneCollapsed && (
          <div
            className={`split-resizer-bar ${
              isResizingSplit ? 'resizer-active' : ''
            }`}
            onMouseDown={handleDividerPointerDown}
            onTouchStart={handleDividerPointerDown}
            onDoubleClick={() => {
              setLeftPanePercent(54);
              localStorage.setItem('shajra_split_percent', '54');
            }}
            onKeyDown={handleDividerKeyDown}
            role="separator"
            aria-orientation="vertical"
            aria-valuenow={Math.round(leftPanePercent)}
            aria-valuemin={22}
            aria-valuemax={78}
            aria-label="Draggable split screen divider (double-click to reset, arrow keys to adjust)"
            tabIndex={0}
            title="Drag to resize Tree vs. Personal Page space (Double-click to reset)"
          >
            <div className="resizer-grip-pill">
              <GripVertical size={14} />
            </div>

            <div className="resizer-quick-controls">
              <button
                type="button"
                className="resizer-mini-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setLeftPanePercent((prev) => (prev > 40 ? 32 : 54));
                }}
                title="Toggle wide Personal Page view"
              >
                <Maximize2 size={11} />
              </button>
              <button
                type="button"
                className="resizer-mini-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRightPaneCollapsed(true);
                }}
                title="Collapse Personal Page pane"
              >
                <PanelRightClose size={12} />
              </button>
            </div>
          </div>
        )}

        {/* RIGHT PANE: Selected Member Details & Personal Page / Studio Editor */}
        {!isRightPaneCollapsed && (
          <section
            className="split-pane split-pane-right"
            style={{ width: `${100 - leftPanePercent}%` }}
            aria-label="Member Details and Personal Page Space"
          >
            {isAdmin && isEditingPersonalPage && selectedPerson ? (
              <PersonalPageEditor
                person={selectedPerson}
                initialSection={editorInitialSection}
                onSave={handleSavePersonalPage}
                onCancel={() => setIsEditingPersonalPage(false)}
              />
            ) : (
              <MemberPersonalPage
                person={selectedPerson}
                people={people}
                isAdmin={isAdmin}
                onSelectPerson={handleSelectPerson}
                onEditMember={handleEditTrigger}
                onEditPersonalPage={handleOpenPersonalPageEditor}
                onDelete={handleDeletePerson}
                onAddRelative={handleAddRelativeTrigger}
                onCropPhoto={isAdmin ? handleOpenCropModal : null}
                isPinned={selectedPerson?.id === pinnedPersonId}
                onTogglePin={isAdmin ? handleTogglePinPerson : null}
              />
            )}
          </section>
        )}
      </main>

      {/* Modals */}
      {showImport && (
        <BulkImport
          onClose={() => setShowImport(false)}
          onImport={handleImportPeople}
        />
      )}

      {showExport && (
        <ExportModal
          people={people}
          pinnedPersonId={pinnedPersonId}
          onClose={() => setShowExport(false)}
        />
      )}

      {showForm && (
        <MemberForm
          person={formPerson}
          people={people}
          initialRelation={initialRelation}
          onClose={() => {
            setShowForm(false);
            setFormPerson(null);
            setInitialRelation(null);
          }}
          onSave={handleSavePerson}
        />
      )}

      {cropModalPerson && (
        <PhotoCropModal
          person={cropModalPerson}
          onSave={handleSaveCroppedPhoto}
          onClose={() => setCropModalPerson(null)}
        />
      )}

      {showThemeModal && (
        <ThemeModal
          themeMode={themeMode}
          setThemeMode={setThemeMode}
          customTheme={customTheme}
          setCustomTheme={setCustomTheme}
          onClose={() => setShowThemeModal(false)}
        />
      )}

      {showAuthModal && (
        <AuthModal
          currentUser={currentUser}
          onAuthChange={(updatedUser) => setCurrentUser(updatedUser)}
          onLogout={handleLogoutToViewer}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
