import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Upload, 
  Trash2, 
  Check, 
  Move, 
  Maximize2, 
  StretchHorizontal, 
  RefreshCw 
} from 'lucide-react';
import GenderAvatar from './GenderAvatar';
import { getPersonAgeInfo } from '../utils/dataHelper';
import './PhotoCropModal.css';

export default function PhotoCropModal({ person, onSave, onClose }) {
  const [imageSrc, setImageSrc] = useState(person?.photoUrl || '');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [fitMode, setFitMode] = useState(person?.photoFit || 'cover'); // 'cover' (zoomed) | 'fill' (stretched) | 'contain'
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  
  const viewportRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);

  // Age & Alive status for the live preview card
  const ageInfo = getPersonAgeInfo(person || {});

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result);
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setRotation(0);
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag to pan
  const handleMouseDown = (e) => {
    if (!imageSrc) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Touch handlers for mobile/trackpad
  const handleTouchStart = (e) => {
    if (!imageSrc || e.touches.length !== 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    panStartRef.current = { ...pan };
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom(prev => Math.min(3.0, Math.max(0.5, Number((prev + delta).toFixed(2)))));
  };

  // Rotate 90 deg
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Reset adjustments
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    setFitMode('cover');
  };

  // Render cropped / scaled image to Canvas and save
  const handleApply = () => {
    if (!imageSrc) {
      onSave({ photoUrl: '', photoFit: fitMode });
      onClose();
      return;
    }

    // Target dimensions for high resolution export (matching card's portrait ratio: 70px x 84px ~ 5:6)
    const TARGET_WIDTH = 350;
    const TARGET_HEIGHT = 420;

    const canvas = document.createElement('canvas');
    canvas.width = TARGET_WIDTH;
    canvas.height = TARGET_HEIGHT;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      onSave({ photoUrl: imageSrc, photoFit: fitMode });
      onClose();
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.clearRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

      // Dark elegant portrait background
      ctx.fillStyle = '#0a0d18';
      ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

      ctx.save();
      // Move to center of canvas
      ctx.translate(TARGET_WIDTH / 2, TARGET_HEIGHT / 2);

      // Apply rotation
      ctx.rotate((rotation * Math.PI) / 180);

      // Scaled pan offsets normalized to canvas size
      const scaleFactor = TARGET_WIDTH / 200; // relative to editor viewport width (200px)
      ctx.translate(pan.x * scaleFactor, pan.y * scaleFactor);

      // Compute draw dimensions based on fitMode
      let drawW = img.width;
      let drawH = img.height;

      if (fitMode === 'fill') {
        // Stretched: forces image to fill target aspect ratio
        drawW = TARGET_WIDTH * zoom;
        drawH = TARGET_HEIGHT * zoom;
      } else if (fitMode === 'contain') {
        // Contain: fits entirely inside
        const imgRatio = img.width / img.height;
        const targetRatio = TARGET_WIDTH / TARGET_HEIGHT;
        if (imgRatio > targetRatio) {
          drawW = TARGET_WIDTH * zoom;
          drawH = (TARGET_WIDTH / imgRatio) * zoom;
        } else {
          drawH = TARGET_HEIGHT * zoom;
          drawW = (TARGET_HEIGHT * imgRatio) * zoom;
        }
      } else {
        // Cover (Zoom to fill): fills entire frame keeping aspect ratio
        const imgRatio = img.width / img.height;
        const targetRatio = TARGET_WIDTH / TARGET_HEIGHT;
        if (imgRatio < targetRatio) {
          drawW = TARGET_WIDTH * zoom;
          drawH = (TARGET_WIDTH / imgRatio) * zoom;
        } else {
          drawH = TARGET_HEIGHT * zoom;
          drawW = (TARGET_HEIGHT * imgRatio) * zoom;
        }
      }

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      const exportedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onSave({
        photoUrl: exportedDataUrl,
        photoFit: fitMode
      });
      onClose();
    };

    img.src = imageSrc;
  };

  return (
    <div className="crop-modal-overlay animate-fade-in" onClick={onClose}>
      <div 
        className="crop-modal-dialog glass-panel" 
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-labelledby="crop-modal-title"
      >
        <div className="crop-modal-header">
          <div className="header-title-wrap">
            <h3 id="crop-modal-title">Picture Crop & Scale Tool</h3>
            <span className="header-subtitle">
              Format, zoom, crop or stretch picture for <strong>{person?.name || 'Member'}</strong>
            </span>
          </div>
          <button onClick={onClose} className="btn-close-crop" title="Close editor">
            <X size={18} />
          </button>
        </div>

        <div className="crop-modal-body">
          {/* Main Interactive Editor Area */}
          <div className="crop-editor-workspace">
            <div 
              className={`crop-viewport ${isDragging ? 'is-dragging' : ''}`}
              ref={viewportRef}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
              title="Click and drag to reposition image. Scroll to zoom."
            >
              {imageSrc ? (
                <div 
                  className="crop-image-layer"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`,
                    transformOrigin: 'center center'
                  }}
                >
                  <img
                    ref={imageRef}
                    src={imageSrc}
                    alt="Subject to crop"
                    className={`crop-img-element fit-${fitMode}`}
                    draggable={false}
                  />
                </div>
              ) : (
                <div className="crop-empty-state">
                  <div className="empty-avatar-preview">
                    <GenderAvatar gender={person?.gender || 'male'} name={person?.name} />
                  </div>
                  <p>No picture uploaded yet</p>
                  <span>Upload a photo below to crop and scale</span>
                </div>
              )}

              {/* Crop Framing Guideline Overlay */}
              <div className="crop-frame-guide">
                <div className="guide-crosshair-h" />
                <div className="guide-crosshair-v" />
                <span className="guide-badge">
                  <Move size={11} style={{ marginRight: 4 }} />
                  Drag to frame
                </span>
              </div>
            </div>

            {/* Scale & Adjustment Controls */}
            {imageSrc && (
              <div className="crop-controls-panel">
                {/* Zoom / Scale Slider */}
                <div className="crop-slider-row">
                  <span className="control-label">Scale / Zoom:</span>
                  <button 
                    type="button" 
                    className="btn-icon-step"
                    onClick={() => setZoom(prev => Math.max(0.5, Number((prev - 0.1).toFixed(2))))}
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.05"
                    value={zoom}
                    onChange={e => setZoom(parseFloat(e.target.value))}
                    className="crop-range-slider"
                  />
                  <button 
                    type="button" 
                    className="btn-icon-step"
                    onClick={() => setZoom(prev => Math.min(3.0, Number((prev + 0.1).toFixed(2))))}
                    title="Zoom In"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <span className="zoom-percentage-text">{Math.round(zoom * 100)}%</span>
                </div>

                {/* Fit Mode Selection (Zoomed vs Stretched) */}
                <div className="crop-fit-modes">
                  <span className="control-label">Display Mode:</span>
                  <div className="fit-mode-buttons">
                    <button
                      type="button"
                      className={`fit-btn ${fitMode === 'cover' ? 'active' : ''}`}
                      onClick={() => setFitMode('cover')}
                      title="Zoomed to fill frame, preserving aspect ratio"
                    >
                      <Maximize2 size={13} style={{ marginRight: 4 }} />
                      Zoomed (Fill)
                    </button>
                    <button
                      type="button"
                      className={`fit-btn ${fitMode === 'fill' ? 'active' : ''}`}
                      onClick={() => setFitMode('fill')}
                      title="Stretch image to exactly fit the box"
                    >
                      <StretchHorizontal size={13} style={{ marginRight: 4 }} />
                      Stretched
                    </button>
                  </div>
                </div>

                {/* Rotate & Reset Toolbar */}
                <div className="crop-aux-tools">
                  <button 
                    type="button" 
                    className="btn-aux"
                    onClick={handleRotate}
                    title="Rotate 90 degrees"
                  >
                    <RotateCw size={14} style={{ marginRight: 5 }} />
                    Rotate 90°
                  </button>
                  <button 
                    type="button" 
                    className="btn-aux"
                    onClick={handleReset}
                    title="Reset pan, zoom and rotation"
                  >
                    <RefreshCw size={14} style={{ marginRight: 5 }} />
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Side: Live Name Card Preview */}
          <div className="crop-preview-sidebar">
            <h4 className="preview-heading">Live Name Card Preview</h4>
            <div className="preview-card-showcase">
              {/* Rendered Live Name Card */}
              <div className={`live-preview-card gender-${person?.gender || 'male'} ${ageInfo.isDeceased ? 'card-deceased' : 'card-alive'}`}>
                {/* Picture Box */}
                <div className="preview-photo-box">
                  {imageSrc ? (
                    <div 
                      className="preview-photo-inner"
                      style={{
                        transform: `translate(${pan.x * 0.35}px, ${pan.y * 0.35}px) rotate(${rotation}deg) scale(${zoom})`,
                        transformOrigin: 'center center'
                      }}
                    >
                      <img 
                        src={imageSrc} 
                        alt="Preview" 
                        className={`preview-img fit-${fitMode}`} 
                      />
                    </div>
                  ) : (
                    <GenderAvatar gender={person?.gender || 'male'} name={person?.name} />
                  )}
                </div>

                {/* Info Column */}
                <div className="preview-info-col">
                  <div className="preview-name">{person?.name || 'Full Name'}</div>
                  {person?.arabicName && (
                    <div className="preview-arabic-name" dir="rtl">{person.arabicName}</div>
                  )}
                  {/* Alive Status & Age */}
                  <div className="preview-status-row">
                    <span className={`preview-status-pill ${ageInfo.isDeceased ? 'deceased' : 'alive'}`}>
                      <span className="dot" />
                      {ageInfo.statusText}
                    </span>
                    <span className="preview-age-pill">{ageInfo.ageText}</span>
                  </div>
                  {person?.occupation && (
                    <div className="preview-meta">{person.occupation}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Upload or Remove Photo */}
            <div className="photo-actions-group">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="btn-secondary upload-photo-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} style={{ marginRight: 6 }} />
                {imageSrc ? 'Replace Image' : 'Upload New Image'}
              </button>

              {imageSrc && (
                <button
                  type="button"
                  className="btn-danger-outline remove-photo-btn"
                  onClick={() => {
                    setImageSrc('');
                    handleReset();
                  }}
                  title="Remove picture and use male/female avatar"
                >
                  <Trash2 size={14} style={{ marginRight: 6 }} />
                  Remove Picture
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="crop-modal-footer">
          <button type="button" onClick={onClose} className="btn-secondary cancel-btn">
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleApply} 
            className="btn-primary apply-btn"
          >
            <Check size={16} style={{ marginRight: 6 }} />
            Apply & Save Picture
          </button>
        </div>
      </div>
    </div>
  );
}
