import React, { useState } from 'react';
import { X, Upload, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { parseCSV, getCSVTemplate } from '../utils/dataHelper';
import './BulkImport.css';

export default function BulkImport({ onClose, onImport }) {
  const [dragActive, setDragActive] = useState(false);
  const [fileData, setFileData] = useState(null);
  const [error, setError] = useState(null);
  const [importSummary, setImportSummary] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file) => {
    if (!file) return;

    const reader = new FileReader();
    const isJSON = file.name.endsWith('.json');
    const isCSV = file.name.endsWith('.csv');

    if (!isJSON && !isCSV) {
      setError('Please upload a valid .csv or .json file');
      return;
    }

    reader.onload = (e) => {
      try {
        const text = e.target.result;
        let parsed = [];
        let detectedPinnedId = null;

        if (isJSON) {
          const raw = JSON.parse(text);
          if (Array.isArray(raw)) {
            parsed = raw;
            const pinned = raw.find(p => p && (p.isPinned === true || p.isPinned === 'true' || p.pinned === true));
            if (pinned) detectedPinnedId = pinned.id;
          } else if (raw && typeof raw === 'object') {
            if (Array.isArray(raw.people)) {
              parsed = raw.people;
            } else if (Array.isArray(raw.members)) {
              parsed = raw.members;
            } else {
              throw new Error('JSON backup must contain a "people" or "members" array');
            }
            detectedPinnedId = raw.pinnedPersonId || raw.defaultPinnedId || null;
            if (!detectedPinnedId) {
              const pinned = parsed.find(p => p && (p.isPinned === true || p.isPinned === 'true' || p.pinned === true));
              if (pinned) detectedPinnedId = pinned.id;
            }
          } else {
            throw new Error('Invalid JSON format');
          }
        } else {
          parsed = parseCSV(text);
          const pinned = parsed.find(p => p && (p.isPinned === true || p.isPinned === 'true'));
          if (pinned) detectedPinnedId = pinned.id;
        }

        if (parsed.length === 0) {
          throw new Error('No valid family tree records found in the file.');
        }

        setFileData({
          people: parsed,
          pinnedPersonId: detectedPinnedId
        });
        setError(null);
        const pinnedMember = detectedPinnedId ? parsed.find(p => p.id === detectedPinnedId) : null;
        setImportSummary({
          fileName: file.name,
          count: parsed.length,
          type: isCSV ? 'CSV' : 'JSON',
          pinnedName: pinnedMember ? pinnedMember.name : (detectedPinnedId || null)
        });
      } catch (err) {
        setError(`Failed to parse file: ${err.message}`);
        setFileData(null);
        setImportSummary(null);
      }
    };

    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = getCSVTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'shajra_family_tree_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportSubmit = () => {
    if (fileData) {
      onImport(fileData.people, fileData.pinnedPersonId);
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel import-modal animate-fade-in">
        <div className="modal-header">
          <h2>Import Family Tree</h2>
          <button onClick={onClose} className="btn-close">
            <X size={20} />
          </button>
        </div>

        <div className="import-modal-body">
          <div className="import-info-box">
            <p>
              You can bulk-load your family tree using a <strong>CSV file</strong> or restore a backup from a <strong>JSON file</strong>.
            </p>
            <button
              onClick={handleDownloadTemplate}
              className="btn-secondary flex-center btn-sm-template"
            >
              <Download size={14} style={{ marginRight: 6 }} /> Download CSV Template
            </button>
          </div>

          <div
            className={`dropzone ${dragActive ? 'active' : ''} ${fileData ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              accept=".csv,.json"
              onChange={handleChange}
              style={{ display: 'none' }}
            />

            {!importSummary ? (
              <label htmlFor="file-upload" className="dropzone-label">
                <Upload size={36} className="dropzone-icon" />
                <span className="dropzone-text-main">Drag and drop file here</span>
                <span className="dropzone-text-sub">Supports .csv and .json files</span>
                <span className="btn-secondary btn-select-file">Select File</span>
              </label>
            ) : (
              <div className="file-success-view">
                <CheckCircle size={36} className="success-icon" />
                <div className="file-details-box">
                  <span className="file-name">{importSummary.fileName}</span>
                  <span className="file-count">
                    Successfully parsed <strong>{importSummary.count}</strong> family members ({importSummary.type}).
                  </span>
                  {importSummary.pinnedName && (
                    <span className="file-pinned-badge">
                      📌 Default Pinned Member: <strong>{importSummary.pinnedName}</strong> (will be focused on tree)
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setFileData(null);
                    setImportSummary(null);
                  }}
                  className="btn-secondary btn-change-file"
                >
                  Change File
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="import-error-box">
              <AlertTriangle size={16} className="error-icon-alert" />
              <span>{error}</span>
            </div>
          )}

          <div className="csv-specs-section">
            <h4>Supported CSV Headers:</h4>
            <div className="tags-grid">
              <code>id</code>
              <code>name</code>
              <code>arabicName</code>
              <code>maidenName</code>
              <code>gender</code>
              <code>birthDate</code>
              <code>deathDate</code>
              <code>isDeceased</code>
              <code>isPinned</code>
              <code>photoUrl</code>
              <code>photoFit</code>
              <code>fatherId</code>
              <code>motherId</code>
              <code>spouseId</code>
              <code>birthPlace</code>
              <code>occupation</code>
              <code>bio</code>
            </div>
            <p className="specs-note">
              * Any other columns in the CSV will automatically be imported as custom details fields (e.g. Nickname, Nationality, etc.).
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleImportSubmit}
            disabled={!fileData}
            className={`btn-primary ${!fileData ? 'disabled' : ''}`}
          >
            Import Members
          </button>
        </div>
      </div>
    </div>
  );
}
