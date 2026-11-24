import React from 'react';
import {
  Search,
  Filter,
  Upload,
  Download,
  Users,
  Plus,
  Trash2,
  Network,
  Table,
  Pin,
  ChevronUp,
  ChevronDown,
  X,
  Sun,
  Moon,
  Palette,
  Shield,
  Eye
} from 'lucide-react';
import './Header.css';

export default function Header({
  searchQuery,
  setSearchQuery,
  searchMatchCount,
  searchMatchIndex = 0,
  onCycleSearchMatch,
  viewMode,
  setViewMode,
  activeView,
  setActiveView,
  themeMode = 'dark',
  onThemeModeChange,
  onOpenThemeModal,
  isAdmin = false,
  currentUser,
  onOpenAuthModal,
  onImportClick,
  onExportClick,
  onAddClick,
  onPurgeClick,
  memberCount,
  pinnedPerson,
  onGoToPinned
}) {
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && onCycleSearchMatch) {
      e.preventDefault();
      onCycleSearchMatch(e.shiftKey ? -1 : 1);
    } else if (e.key === 'Escape' && searchQuery) {
      setSearchQuery('');
    }
  };

  return (
    <header className="app-header glass-panel">
      <div className="header-brand">
        <Users className="brand-icon" />
        <div className="brand-details">
          <h1>Shajra</h1>
          <span className="member-count">{memberCount} Family members</span>
        </div>
        {pinnedPerson && (
          <button
            type="button"
            className="header-pinned-chip"
            onClick={onGoToPinned}
            title={`Go to default pinned member: ${pinnedPerson.name}`}
          >
            <Pin size={12} className="pinned-chip-icon" />
            <span className="pinned-chip-label">
              Default: <strong>{pinnedPerson.name}</strong>
            </span>
          </button>
        )}
      </div>

      {/* Primary View Switcher: Tree vs Table */}
      <div className="view-mode-tabs" role="tablist" aria-label="Main Views">
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'tree'}
          className={`view-tab-btn ${activeView === 'tree' ? 'active' : ''}`}
          onClick={() => setActiveView('tree')}
          title="Tree Visualization"
          id="tab-tree"
        >
          <Network size={16} />
          <span>Tree View</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'table'}
          className={`view-tab-btn ${activeView === 'table' ? 'active' : ''}`}
          onClick={() => setActiveView('table')}
          title="Table View (Directory, Modify, Add)"
          id="tab-table"
        >
          <Table size={16} />
          <span>Table View</span>
        </button>
      </div>

      <div className="header-actions">
        {/* Search with auto-pan & match cycling */}
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search member to pan tree..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          {searchQuery && (
            <div className="search-match-controls">
              <span className="search-match-badge">
                {searchMatchCount > 0
                  ? `${searchMatchIndex + 1}/${searchMatchCount}`
                  : '0/0'}
              </span>
              {searchMatchCount > 1 && onCycleSearchMatch && (
                <>
                  <button
                    type="button"
                    className="search-cycle-btn"
                    onClick={() => onCycleSearchMatch(-1)}
                    title="Previous match (Shift+Enter)"
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    type="button"
                    className="search-cycle-btn"
                    onClick={() => onCycleSearchMatch(1)}
                    title="Next match (Enter)"
                  >
                    <ChevronDown size={13} />
                  </button>
                </>
              )}
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <X size={13} />
              </button>
            </div>
          )}
        </div>

        {/* View Filters */}
        <div className="filter-group">
          <Filter className="filter-icon" />
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="filter-select"
          >
            <option value="all">Full Tree</option>
            <option value="male-only">Male Only</option>
            <option value="female-only">Female Only</option>
            <option value="couples-only">Couples Only</option>
          </select>
        </div>

        {/* Theme Switcher Pill (Light / Dark / Custom) */}
        <div
          className="theme-switcher-pill"
          role="group"
          aria-label="Theme Switcher"
        >
          <button
            type="button"
            className={`theme-pill-btn ${
              themeMode === 'light' ? 'active' : ''
            }`}
            onClick={() => onThemeModeChange?.('light')}
            title="Switch to Light Theme"
          >
            <Sun size={14} />
            <span className="theme-pill-label">Light</span>
          </button>
          <button
            type="button"
            className={`theme-pill-btn ${
              themeMode === 'dark' ? 'active' : ''
            }`}
            onClick={() => onThemeModeChange?.('dark')}
            title="Switch to Dark Theme"
          >
            <Moon size={14} />
            <span className="theme-pill-label">Dark</span>
          </button>
          <button
            type="button"
            className={`theme-pill-btn ${
              themeMode === 'custom' ? 'active' : ''
            }`}
            onClick={() => onOpenThemeModal?.()}
            title="Customize Theme Palette (Light, Dark & Custom)"
          >
            <Palette size={14} />
            <span className="theme-pill-label">Custom</span>
          </button>
        </div>

        {/* Data Tools & Account Role Button */}
        <div className="btn-group">
          <button
            type="button"
            onClick={onOpenAuthModal}
            className={`btn-role-badge flex-center ${
              isAdmin ? 'role-admin' : 'role-viewer'
            }`}
            title={
              isAdmin
                ? `Logged in as Admin (${currentUser?.username}). Click to manage accounts or switch to Viewer.`
                : 'Browsing in Viewer (Read-Only) mode. Click to sign in as Admin.'
            }
          >
            {isAdmin ? (
              <>
                <Shield size={15} style={{ marginRight: 6 }} />
                <span>Admin</span>
              </>
            ) : (
              <>
                <Eye size={15} style={{ marginRight: 6 }} />
                <span>Viewer • Login</span>
              </>
            )}
          </button>

          {isAdmin && (
            <button
              onClick={onImportClick}
              className="btn-secondary flex-center"
              title="Import CSV or JSON"
            >
              <Upload size={16} style={{ marginRight: '6px' }} />
              Import
            </button>
          )}
          <button
            onClick={onExportClick}
            className="btn-secondary flex-center"
            title="Export CSV or JSON"
          >
            <Download size={16} style={{ marginRight: '6px' }} />
            Export
          </button>
          {isAdmin && (
            <>
              <button
                onClick={onPurgeClick}
                className="btn-danger flex-center"
                title="Purge Entire Tree"
              >
                <Trash2 size={16} style={{ marginRight: '6px' }} />
                Purge
              </button>
              <button onClick={onAddClick} className="btn-primary flex-center">
                <Plus size={16} style={{ marginRight: '6px' }} />
                Add Member
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
