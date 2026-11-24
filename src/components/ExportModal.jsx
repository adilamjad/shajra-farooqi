import React from 'react';
import { X, FileJson, FileText, Download } from 'lucide-react';
import { exportToCSV } from '../utils/dataHelper';
import './ExportModal.css';

export default function ExportModal({ people, pinnedPersonId, onClose }) {
  const pinnedPerson = pinnedPersonId ? people.find(p => p.id === pinnedPersonId) : null;

  const handleExportJSON = () => {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      pinnedPersonId: pinnedPersonId || null,
      people: people.map(p => ({
        ...p,
        isPinned: p.id === pinnedPersonId ? true : undefined
      }))
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shajra_family_tree_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    const csvContent = exportToCSV(people, pinnedPersonId);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shajra_family_tree_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel export-modal animate-fade-in">
        <div className="modal-header">
          <h2>Export Family Tree Data</h2>
          <button onClick={onClose} className="btn-close">
            <X size={20} />
          </button>
        </div>

        <div className="export-modal-body">
          <p className="export-description">
            Choose a format below to export your family tree. You can use these files to backup your tree or load them back into Shajra later.
          </p>

          {pinnedPerson && (
            <div className="export-pinned-info">
              <span>📌 Default Pinned Focus: <strong>{pinnedPerson.name}</strong> will be saved in your export</span>
            </div>
          )}

          <div className="export-options-grid">
            {/* JSON Card */}
            <div className="export-option-card glass-panel" onClick={handleExportJSON}>
              <div className="export-card-icon json">
                <FileJson size={32} />
              </div>
              <div className="export-card-details">
                <h3>JSON Backup</h3>
                <p>Best for full backups. Keeps profile photos and custom attributes perfectly intact.</p>
              </div>
              <button className="btn-primary flex-center btn-export-action">
                <Download size={14} style={{ marginRight: 6 }} /> Download JSON
              </button>
            </div>

            {/* CSV Card */}
            <div className="export-option-card glass-panel" onClick={handleExportCSV}>
              <div className="export-card-icon csv">
                <FileText size={32} />
              </div>
              <div className="export-card-details">
                <h3>CSV Spreadsheet</h3>
                <p>Best for editing in Excel/Google Sheets. Standard table structure.</p>
              </div>
              <button className="btn-primary flex-center btn-export-action">
                <Download size={14} style={{ marginRight: 6 }} /> Download CSV
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
