import React, { useRef } from 'react';
import colors from '../../constants/colors.js';

/**
 * RecipeInput component - handles URL, photo, and YouTube input modes
 * @param {string} inputMode - Current input mode ('url', 'photo', 'youtube')
 * @param {function} onModeChange - Callback when mode changes
 * @param {function} onSubmit - Callback when form is submitted
 * @param {boolean} loading - Loading state
 * @param {object} txt - Translations object
 */
export default function RecipeInput({
  inputMode,
  onModeChange,
  onSubmit,
  loading,
  txt = {},
  url = '',
  onUrlChange,
  photos = [],
  onPhotosChange,
  youtubeUrl = '',
  onYoutubeUrlChange,
  error = ''
}) {
  const fileInputRef = useRef(null);

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newPhotos = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        newPhotos.push(event.target.result);
        if (newPhotos.length === files.length) {
          onPhotosChange([...photos, ...newPhotos]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = (mode) => {
    if (mode === 'url') {
      onSubmit('url', url);
    } else if (mode === 'photo') {
      onSubmit('photo', photos);
    } else if (mode === 'youtube') {
      onSubmit('youtube', youtubeUrl);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      {/* Mode selector tabs */}
      <div
        style={{
          display: 'flex',
          marginBottom: '16px',
          background: colors.card,
          borderRadius: '10px',
          padding: '4px',
          border: `1px solid ${colors.border}`
        }}
        role="tablist"
        aria-label="Recipe input mode"
      >
        <button
          onClick={() => onModeChange('url')}
          role="tab"
          aria-selected={inputMode === 'url'}
          aria-controls="url-panel"
          style={{
            flex: 1,
            padding: '10px 8px',
            fontSize: '12px',
            fontWeight: '500',
            background: inputMode === 'url' ? colors.accent : 'transparent',
            color: inputMode === 'url' ? colors.bg : colors.muted,
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          🔗 {txt.pasteUrl || 'Paste URL'}
        </button>
        <button
          onClick={() => onModeChange('photo')}
          role="tab"
          aria-selected={inputMode === 'photo'}
          aria-controls="photo-panel"
          style={{
            flex: 1,
            padding: '10px 8px',
            fontSize: '12px',
            fontWeight: '500',
            background: inputMode === 'photo' ? colors.accent : 'transparent',
            color: inputMode === 'photo' ? colors.bg : colors.muted,
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          📷 {txt.snapPhoto || 'Photo'}
        </button>
        <button
          onClick={() => onModeChange('youtube')}
          role="tab"
          aria-selected={inputMode === 'youtube'}
          aria-controls="youtube-panel"
          style={{
            flex: 1,
            padding: '10px 8px',
            fontSize: '12px',
            fontWeight: '500',
            background: inputMode === 'youtube' ? colors.accent : 'transparent',
            color: inputMode === 'youtube' ? colors.bg : colors.muted,
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          ▶️ {txt.youtube || 'Video'}
        </button>
      </div>

      {/* URL input mode */}
      {inputMode === 'url' && (
        <div id="url-panel" role="tabpanel" aria-labelledby="url-tab">
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="url"
              value={url}
              onChange={e => onUrlChange(e.target.value)}
              placeholder="Paste recipe URL..."
              onKeyDown={e => e.key === 'Enter' && handleSubmit('url')}
              disabled={loading}
              aria-label="Recipe URL"
              style={{
                flex: 1,
                padding: '14px 16px',
                fontSize: '15px',
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: '10px',
                color: colors.text,
                outline: 'none'
              }}
            />
            <button
              onClick={() => handleSubmit('url')}
              disabled={loading}
              aria-label="Clean recipe from URL"
              style={{
                padding: '14px 20px',
                fontSize: '14px',
                fontWeight: '500',
                background: colors.accent,
                color: colors.bg,
                border: 'none',
                borderRadius: '10px',
                cursor: loading ? 'wait' : 'pointer'
              }}
            >
              {txt.clean || 'Clean'}
            </button>
          </div>
          <p style={{ fontSize: '12px', color: colors.dim, textAlign: 'center', marginTop: '12px' }}>
            {txt.worksWithAny || 'Works with any recipe website'}
          </p>
        </div>
      )}

      {/* Photo input mode */}
      {inputMode === 'photo' && (
        <div id="photo-panel" role="tabpanel" aria-labelledby="photo-tab">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoSelect}
            disabled={loading}
            aria-label="Upload recipe photos"
            style={{ display: 'none' }}
          />
          {photos.length > 0 && (
            <div
              style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}
              role="list"
              aria-label="Selected photos"
            >
              {photos.map((photo, i) => (
                <div key={i} style={{ position: 'relative' }} role="listitem">
                  <img
                    src={photo}
                    alt={`Recipe photo ${i + 1}`}
                    style={{
                      width: '80px',
                      height: '80px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: `1px solid ${colors.border}`
                    }}
                  />
                  <button
                    onClick={() => removePhoto(i)}
                    disabled={loading}
                    aria-label={`Remove photo ${i + 1}`}
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      width: '20px',
                      height: '20px',
                      background: colors.error,
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              aria-label={photos.length === 0 ? 'Add photos' : 'Add more photos'}
              style={{
                flex: 1,
                padding: '16px',
                fontSize: '14px',
                background: colors.card,
                color: colors.text,
                border: `2px dashed ${colors.border}`,
                borderRadius: '10px',
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '20px' }}>📷</span>
              {photos.length === 0 ? (txt.addPhotos || 'Add photos') : (txt.addMore || 'Add more')}
            </button>
            {photos.length > 0 && (
              <button
                onClick={() => handleSubmit('photo')}
                disabled={loading}
                aria-label="Clean recipe from photos"
                style={{
                  padding: '16px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  background: colors.accent,
                  color: colors.bg,
                  border: 'none',
                  borderRadius: '10px',
                  cursor: loading ? 'wait' : 'pointer'
                }}
              >
                {txt.clean || 'Clean'}
              </button>
            )}
          </div>
          <p style={{ fontSize: '12px', color: colors.dim, textAlign: 'center', marginTop: '12px', lineHeight: 1.5 }}>
            {txt.uploadOrSnap || 'Upload or snap cookbook pages'}
          </p>
        </div>
      )}

      {/* YouTube input mode */}
      {inputMode === 'youtube' && (
        <div id="youtube-panel" role="tabpanel" aria-labelledby="youtube-tab">
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="url"
              value={youtubeUrl}
              onChange={e => onYoutubeUrlChange(e.target.value)}
              placeholder={txt.pasteYoutube || 'Paste a YouTube cooking video URL'}
              onKeyDown={e => e.key === 'Enter' && handleSubmit('youtube')}
              disabled={loading}
              aria-label="YouTube video URL"
              style={{
                flex: 1,
                padding: '14px 16px',
                fontSize: '15px',
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: '10px',
                color: colors.text,
                outline: 'none'
              }}
            />
            <button
              onClick={() => handleSubmit('youtube')}
              disabled={loading}
              aria-label="Clean recipe from YouTube"
              style={{
                padding: '14px 20px',
                fontSize: '14px',
                fontWeight: '500',
                background: colors.accent,
                color: colors.bg,
                border: 'none',
                borderRadius: '10px',
                cursor: loading ? 'wait' : 'pointer'
              }}
            >
              {txt.clean || 'Clean'}
            </button>
          </div>
          <p style={{ fontSize: '12px', color: colors.dim, textAlign: 'center', marginTop: '12px' }}>
            {txt.youtubeHelper || 'Extract recipes from cooking videos'}
          </p>
        </div>
      )}

      {/* Error display */}
      {error && (
        <p
          style={{ textAlign: 'center', color: colors.error, marginTop: '12px', fontSize: '13px' }}
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}
