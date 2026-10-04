import { useEffect, useRef, useState } from 'react';
import { Upload, Loader2, Link2, ClipboardPaste } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImage } from '../services/api';
import { fitImageFile, resizeImageFile, IMAGE_PRESETS } from '../utils/imageFit';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm']);

const isVideoFile = (file) => VIDEO_TYPES.has(file.type) || /\.(mp4|webm)$/i.test(file.name || '');

const ImageUploader = ({
  label = 'Upload image',
  value = '',
  onUploaded,
  className = '',
  /** product | category | hero | card | membership | membershipHome | logo | free */
  fit = 'free',
  /** object-cover (crop fill) or object-contain (show full image) */
  previewFit = 'cover',
  /** Allow pasting an external image URL */
  allowUrlPaste = true,
  /** Allow video/mp4 and video/webm (product media) */
  allowVideo = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [pasteUrl, setPasteUrl] = useState('');
  const zoneRef = useRef(null);
  const uploadingRef = useRef(false);
  const processFileRef = useRef(null);
  const allowVideoRef = useRef(allowVideo);
  allowVideoRef.current = allowVideo;
  const preset = IMAGE_PRESETS[fit] || IMAGE_PRESETS.free;
  const valueIsVideo = /\.(mp4|webm)(\?|$)/i.test(value || '');

  const previewAspect =
    preset?.aspect != null
      ? { aspectRatio: String(preset.aspect) }
      : fit === 'membership' || fit === 'membershipHome'
        ? { aspectRatio: fit === 'membershipHome' ? '4 / 1' : '1.586 / 1' }
        : fit === 'logo'
          ? { aspectRatio: '1 / 1' }
          : { aspectRatio: '16 / 9' };

  const processFile = async (file) => {
    if (!file || uploadingRef.current) return;

    const video = isVideoFile(file);
    if (video && !allowVideoRef.current) {
      toast.error('Please select an image file');
      return;
    }
    if (!video && !IMAGE_TYPES.has(file.type) && !file.type.startsWith('image/')) {
      toast.error(
        allowVideoRef.current
          ? 'Please select an image or video (MP4/WEBM)'
          : 'Please select an image file'
      );
      return;
    }

    const maxBytes = video ? 50 * 1024 * 1024 : 12 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(video ? 'Max video size is 50MB' : 'Max file size is 12MB');
      return;
    }

    uploadingRef.current = true;
    setUploading(true);
    try {
      let toUpload = file;
      if (!video) {
        if (preset?.mode === 'resize') {
          toUpload = await resizeImageFile(file, { maxWidth: preset.maxWidth });
        } else if (preset?.mode === 'crop' || preset?.aspect) {
          toUpload = await fitImageFile(file, {
            aspect: preset.aspect,
            maxWidth: preset.maxWidth,
          });
        }
      }
      const res = await uploadImage(toUpload);
      const mediaType = video ? 'video' : 'image';
      onUploaded?.(res.data.url, { type: mediaType });
      toast.success(
        video
          ? 'Video uploaded'
          : preset?.mode === 'crop'
            ? `Uploaded (cropped to ${preset.label})`
            : `Uploaded (${preset?.label || 'image'})`
      );
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      uploadingRef.current = false;
      setUploading(false);
    }
  };

  processFileRef.current = processFile;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    await processFile(file);
    e.target.value = '';
  };

  const extractClipboardFile = (clipboardData) => {
    const items = clipboardData?.items;
    if (!items?.length) return null;
    for (const item of items) {
      if (item.kind !== 'file') continue;
      const type = item.type || '';
      const okImage =
        type.startsWith('image/') &&
        (IMAGE_TYPES.has(type) || /jpeg|jpg|png|webp/i.test(type));
      const okVideo = allowVideoRef.current && VIDEO_TYPES.has(type);
      if (!okImage && !okVideo) continue;
      return item.getAsFile();
    }
    return null;
  };

  const handlePaste = async (e) => {
    const file = extractClipboardFile(e.clipboardData);
    if (!file) return;
    e.preventDefault();
    e.stopPropagation();
    await processFile(file);
  };

  // Document paste: only the focused uploader, or the first empty one when focus is elsewhere
  useEffect(() => {
    const onDocPaste = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      const file = extractClipboardFile(e.clipboardData);
      if (!file) return;

      const zone = zoneRef.current;
      if (!zone) return;
      const active = document.activeElement;
      const focusedHere = zone === active || zone.contains(active);
      if (focusedHere) {
        e.preventDefault();
        processFileRef.current?.(file);
        return;
      }

      // Prefer first empty uploader when nothing in an uploader is focused
      const zones = [...document.querySelectorAll('[data-image-uploader]')];
      const myIndex = zones.indexOf(zone);
      if (myIndex < 0) return;
      const anyUploaderFocused = zones.some((z) => z === active || z.contains(active));
      if (anyUploaderFocused) return;
      const emptyZones = zones.filter((z) => z.getAttribute('data-has-value') !== '1');
      const target = emptyZones[0] || zones[0];
      if (target !== zone) return;
      e.preventDefault();
      processFileRef.current?.(file);
    };
    document.addEventListener('paste', onDocPaste);
    return () => document.removeEventListener('paste', onDocPaste);
  }, []);

  const applyPasteUrl = () => {
    const url = String(pasteUrl || '').trim();
    if (!url) {
      toast.error('Paste an image URL first');
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      toast.error('URL must start with http:// or https://');
      return;
    }
    onUploaded?.(url, { type: 'image' });
    setPasteUrl('');
    toast.success('Image URL applied');
  };

  const accept = allowVideo
    ? 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm'
    : 'image/jpeg,image/png,image/webp,image/gif';

  return (
    <div
      className={`space-y-2 ${className}`}
      onPaste={handlePaste}
      tabIndex={0}
      ref={zoneRef}
      data-image-uploader
      data-has-value={value ? '1' : '0'}
    >
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800 mb-0.5">
          Preferred scale
        </p>
        <p className="text-xs text-amber-900/90 leading-snug">{preset.hint}</p>
      </div>

      <div
        className="relative w-full max-w-sm overflow-hidden rounded-lg border border-neutral-200 bg-neutral-900 outline-none focus-within:ring-2 focus-within:ring-brand-gold/40"
        style={previewAspect}
        onClick={() => zoneRef.current?.focus()}
      >
        {value ? (
          valueIsVideo ? (
            <video
              src={value}
              className={`absolute inset-0 w-full h-full ${
                previewFit === 'contain' ? 'object-contain' : 'object-cover'
              }`}
              muted
              playsInline
              controls
            />
          ) : (
            <img
              src={value}
              alt=""
              className={`absolute inset-0 w-full h-full ${
                previewFit === 'contain' ? 'object-contain' : 'object-cover'
              }`}
            />
          )
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 text-xs gap-1 px-3 text-center">
            <span>No {allowVideo ? 'media' : 'image'}</span>
            <span className="text-[10px] text-neutral-500">{preset.label}</span>
          </div>
        )}
      </div>

      <p className="text-[11px] text-neutral-500 flex items-center gap-1 max-w-sm">
        <ClipboardPaste size={12} />
        Paste JPEG/PNG/WEBP{allowVideo ? '/MP4/WEBM' : ''} (Ctrl/Cmd+V)
      </p>

      <label className="btn-ghost w-full cursor-pointer py-2">
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {uploading ? 'Processing...' : label}
        <input
          type="file"
          accept={accept}
          className="hidden"
          disabled={uploading}
          onChange={handleFile}
        />
      </label>

      {allowUrlPaste ? (
        <div className="space-y-1.5 max-w-sm">
          <p className="text-[11px] text-neutral-500 flex items-center gap-1">
            <Link2 size={12} /> Or paste image URL from elsewhere
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              className="input-field text-xs py-2"
              placeholder="https://…/image.jpg"
              value={pasteUrl}
              onChange={(e) => setPasteUrl(e.target.value)}
              onPaste={(e) => {
                const text = e.clipboardData?.getData('text')?.trim();
                if (text && /^https?:\/\//i.test(text)) {
                  e.preventDefault();
                  setPasteUrl(text);
                }
              }}
            />
            <button type="button" onClick={applyPasteUrl} className="btn-outline text-xs px-3 shrink-0">
              Use
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ImageUploader;
