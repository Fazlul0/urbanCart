import { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImage } from '../services/api';
import { fitImageFile, IMAGE_PRESETS } from '../utils/imageFit';

const ImageUploader = ({
  label = 'Upload image',
  value = '',
  onUploaded,
  className = '',
  /** product | category | hero | card | free */
  fit = 'free',
}) => {
  const [uploading, setUploading] = useState(false);
  const preset = IMAGE_PRESETS[fit] || null;

  const previewAspect = preset
    ? { aspectRatio: String(preset.aspect) }
    : { aspectRatio: '16 / 9' };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast.error('Max file size is 12MB');
      return;
    }

    setUploading(true);
    try {
      let toUpload = file;
      if (preset) {
        toUpload = await fitImageFile(file, {
          aspect: preset.aspect,
          maxWidth: preset.maxWidth,
        });
      }
      const res = await uploadImage(toUpload);
      onUploaded?.(res.data.url);
      toast.success(preset ? `Uploaded (${preset.label}, cropped to fit)` : 'Image uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100"
        style={previewAspect}
      >
        {value ? (
          <img src={value} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 text-xs gap-1 px-3 text-center">
            <span>No image</span>
            {preset && <span className="text-[10px]">Will crop to {preset.label}</span>}
          </div>
        )}
      </div>
      {preset && (
        <p className="text-[11px] text-neutral-500">
          Images are auto-cropped to {preset.label} so they fill product/category cards cleanly.
        </p>
      )}
      <label className="btn-ghost w-full cursor-pointer py-2">
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {uploading ? 'Processing...' : label}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          disabled={uploading}
          onChange={handleFile}
        />
      </label>
    </div>
  );
};

export default ImageUploader;
