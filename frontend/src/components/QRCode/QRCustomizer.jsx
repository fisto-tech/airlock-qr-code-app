import React, { useState, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiX, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const dotStyles = [
  { id: 'square', label: 'Square', preview: '■' },
  { id: 'dots', label: 'Dots', preview: '●' },
  { id: 'rounded', label: 'Rounded', preview: '▢' },
  { id: 'classy', label: 'Classy', preview: '◆' },
  { id: 'extra-rounded', label: 'Extra Rounded', preview: '○' },
];

const cornerStyles = [
  { id: 'square', label: 'Square' },
  { id: 'dot', label: 'Dot' },
  { id: 'extra-rounded', label: 'Rounded' },
];

const errorLevels = [
  { id: 'L', label: 'Low (7%)', description: 'Smallest QR code' },
  { id: 'M', label: 'Medium (15%)', description: 'Balanced' },
  { id: 'Q', label: 'Quartile (25%)', description: 'Better recovery' },
  { id: 'H', label: 'High (30%)', description: 'Best for logos' },
];

const frameStyles = [
  { id: 'none', label: 'No Frame' },
  { id: 'simple', label: 'Simple' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'banner', label: 'Banner' },
];

const QRCustomizer = () => {
  const { watch, setValue } = useFormContext();
  const customization = watch('customization');
  const [activeColorPicker, setActiveColorPicker] = useState(null);

  const updateCustomization = (key, value) => {
    setValue(`customization.${key}`, value, { shouldDirty: true });
  };

  const updateNestedCustomization = (parent, key, value) => {
    setValue(`customization.${parent}.${key}`, value, { shouldDirty: true });
  };

  // Logo upload handler
  const onLogoDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        updateNestedCustomization('logo', 'url', reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps: getLogoRootProps, getInputProps: getLogoInputProps, isDragActive: isLogoDragActive } = useDropzone({
    onDrop: onLogoDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.svg', '.webp']
    },
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024, // 2MB
  });

  const removeLogo = () => {
    updateNestedCustomization('logo', 'url', '');
  };

  // Color Picker Component
  const ColorPickerPopover = ({ colorKey, label, nested = false, parentKey = '' }) => {
    const currentColor = nested 
      ? customization[parentKey]?.[colorKey] 
      : customization[colorKey];
    const isActive = activeColorPicker === `${parentKey}-${colorKey}`;

    return (
      <div className="relative">
        <label className="block text-[0.75vw] font-medium text-slate-600 mb-[0.3vw]">
          {label}
        </label>
        <div className="flex items-center gap-[0.5vw]">
          <button
            type="button"
            onClick={() => setActiveColorPicker(isActive ? null : `${parentKey}-${colorKey}`)}
            className="w-[2.5vw] h-[2.5vw] rounded-[0.3vw] border-2 border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 transition-colors"
            style={{ backgroundColor: currentColor }}
          />
          <input
            type="text"
            value={currentColor}
            onChange={(e) => {
              if (nested) {
                updateNestedCustomization(parentKey, colorKey, e.target.value);
              } else {
                updateCustomization(colorKey, e.target.value);
              }
            }}
            className="flex-1 px-[0.5vw] py-[0.4vw] text-[0.8vw] border border-slate-200 rounded-[0.3vw] uppercase"
          />
        </div>
        
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 mt-[0.5vw] p-[0.75vw] bg-white rounded-[0.5vw] shadow-xl border border-slate-200"
            >
              <HexColorPicker
                color={currentColor}
                onChange={(color) => {
                  if (nested) {
                    updateNestedCustomization(parentKey, colorKey, color);
                  } else {
                    updateCustomization(colorKey, color);
                  }
                }}
                style={{ width: '12vw', height: '10vw' }}
              />
              <div className="mt-[0.5vw] flex items-center justify-between">
                <HexColorInput
                  color={currentColor}
                  onChange={(color) => {
                    if (nested) {
                      updateNestedCustomization(parentKey, colorKey, color);
                    } else {
                      updateCustomization(colorKey, color);
                    }
                  }}
                  className="w-full px-[0.5vw] py-[0.3vw] text-[0.75vw] border border-slate-200 rounded-[0.3vw] uppercase"
                  prefixed
                />
              </div>
              <button
                type="button"
                onClick={() => setActiveColorPicker(null)}
                className="w-full mt-[0.5vw] px-[0.5vw] py-[0.3vw] text-white text-[0.75vw] rounded-[0.3vw] transition-colors"
                style={{ backgroundColor: '#2563eb' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
              >
                Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="space-y-[1.25vw]">
      {/* Colors Section */}
      <div className="p-[1vw] bg-slate-50 rounded-[0.5vw]">
        <h4 className="text-[0.9vw] font-semibold text-slate-800 mb-[0.75vw]">Colors</h4>
        <div className="grid grid-cols-2 gap-[1vw]">
          <ColorPickerPopover
            colorKey="foregroundColor"
            label="QR Code Color"
          />
          <ColorPickerPopover
            colorKey="backgroundColor"
            label="Background Color"
          />
        </div>
      </div>

      {/* Dot Style Section */}
      <div className="p-[1vw] bg-slate-50 rounded-[0.5vw]">
        <h4 className="text-[0.9vw] font-semibold text-slate-800 mb-[0.75vw]">Dot Style</h4>
        <div className="grid grid-cols-5 gap-[0.5vw]">
          {dotStyles.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => updateCustomization('dotStyle', style.id)}
              className={`
                p-[0.6vw] rounded-[0.4vw] border-2 text-center transition-all
                ${
                  customization.dotStyle === style.id
                    ? 'border-slate-400 text-slate-700'
                    : 'border-slate-200 hover:border-slate-300'
                }
              `}
              style={{
                backgroundColor: customization.dotStyle === style.id ? '#eff6ff' : 'transparent',
                borderColor: customization.dotStyle === style.id ? '#3b82f6' : undefined,
              }}
            >
              <span className="text-[1.5vw] block mb-[0.2vw]">{style.preview}</span>
              <span className="text-[0.65vw] text-slate-600">{style.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Corner Style Section */}
      <div className="p-[1vw] bg-slate-50 rounded-[0.5vw]">
        <h4 className="text-[0.9vw] font-semibold text-slate-800 mb-[0.75vw]">Corner Style</h4>
        <div className="grid grid-cols-3 gap-[0.5vw]">
          {cornerStyles.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => updateCustomization('cornerStyle', style.id)}
              className={`
                p-[0.6vw] rounded-[0.4vw] border-2 text-center transition-all text-[0.8vw]
                ${
                  customization.cornerStyle === style.id
                    ? 'text-slate-700'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }
              `}
              style={{
                backgroundColor: customization.cornerStyle === style.id ? '#eff6ff' : 'transparent',
                borderColor: customization.cornerStyle === style.id ? '#3b82f6' : undefined,
              }}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Correction Level */}
      <div className="p-[1vw] bg-slate-50 rounded-[0.5vw]">
        <h4 className="text-[0.9vw] font-semibold text-slate-800 mb-[0.75vw]">Error Correction</h4>
        <div className="grid grid-cols-2 gap-[0.5vw]">
          {errorLevels.map((level) => (
            <button
              key={level.id}
              type="button"
              onClick={() => updateCustomization('errorCorrectionLevel', level.id)}
              className="p-[0.6vw] rounded-[0.4vw] border-2 text-left transition-all"
              style={{
                backgroundColor: customization.errorCorrectionLevel === level.id ? '#eff6ff' : 'transparent',
                borderColor: customization.errorCorrectionLevel === level.id ? '#3b82f6' : '#e5e7eb',
              }}
            >
              <span className="text-[0.8vw] font-medium block">{level.label}</span>
              <span className="text-[0.65vw] text-slate-500">{level.description}</span>
            </button>
          ))}
        </div>
        <p className="text-[0.7vw] text-slate-500 mt-[0.5vw]">
          Higher error correction allows for logo placement but increases QR complexity
        </p>
      </div>

      {/* Logo Upload Section */}
      <div className="p-[1vw] bg-slate-50 rounded-[0.5vw]">
        <h4 className="text-[0.9vw] font-semibold text-slate-800 mb-[0.75vw]">Center Logo</h4>
        
        {customization.logo?.url ? (
          <div className="flex items-center gap-[1vw]">
            <div className="relative">
              <img
                src={customization.logo.url}
                alt="Logo"
                className="w-[4vw] h-[4vw] object-contain rounded-[0.4vw] border border-slate-200"
              />
              <button
                type="button"
                onClick={removeLogo}
                className="absolute -top-[0.4vw] -right-[0.4vw] w-[1.25vw] h-[1.25vw] bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
              >
                <FiX className="text-[0.7vw]" />
              </button>
            </div>
            
            <div className="flex-1">
              <label className="block text-[0.75vw] font-medium text-slate-600 mb-[0.3vw]">
                Logo Size: {Math.round((customization.logo?.size || 0.2) * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="0.4"
                step="0.05"
                value={customization.logo.size || 0.25}
                onChange={(e) => updateNestedCustomization('logo', 'size', parseFloat(e.target.value))}
                className="w-full h-[0.4vw] bg-slate-200 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: '#2563eb' }}
              />
            </div>
          </div>
        ) : (
          <div
            {...getLogoRootProps()}
            className={`
              border-2 border-dashed rounded-[0.5vw] p-[1.5vw] text-center cursor-pointer
              transition-colors
            `}
            style={{
              borderColor: isLogoDragActive ? '#3b82f6' : '#cbd5e1',
              backgroundColor: isLogoDragActive ? '#eff6ff' : 'transparent',
            }}
          >
            <input {...getLogoInputProps()} />
            <FiUpload className="mx-auto text-[1.5vw] text-slate-400 mb-[0.5vw]" />
            <p className="text-[0.8vw] text-slate-600">
              {isLogoDragActive
                ? 'Drop the logo here...'
                : 'Drag & drop a logo, or click to select'
              }
            </p>
            <p className="text-[0.65vw] text-slate-400 mt-[0.25vw]">
              PNG, JPG, SVG up to 2MB
            </p>
          </div>
        )}
        
        {customization.logo?.url && (
          <p className="text-[0.65vw] text-amber-600 mt-[0.5vw]">
            Tip: Use High error correction level for better logo visibility
          </p>
        )}
      </div>

      {/* Frame Section */}
      <div className="p-[1vw] bg-slate-50 rounded-[0.5vw]">
        <h4 className="text-[0.9vw] font-semibold text-slate-800 mb-[0.75vw]">Frame</h4>
        
        <div className="grid grid-cols-4 gap-[0.5vw] mb-[0.75vw]">
          {frameStyles.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => updateNestedCustomization('frame', 'style', style.id)}
              className="p-[0.6vw] rounded-[0.4vw] border-2 text-center transition-all text-[0.75vw]"
              style={{
                borderColor: customization.frame?.style === style.id ? '#3b82f6' : '#e5e7eb',
                backgroundColor: customization.frame?.style === style.id ? '#eff6ff' : 'transparent',
                color: customization.frame?.style === style.id ? '#1d4ed8' : '#64748b',
              }}
            >
              {style.label}
            </button>
          ))}
        </div>

        {customization.frame?.style && customization.frame.style !== 'none' && (
          <div className="space-y-[0.75vw] pt-[0.75vw] border-t border-slate-200">
            <div>
              <label className="block text-[0.75vw] font-medium text-slate-600 mb-[0.3vw]">
                Frame Text
              </label>
              <input
                type="text"
                value={customization.frame?.text || ''}
                onChange={(e) => updateNestedCustomization('frame', 'text', e.target.value)}
                placeholder="Scan Me!"
                className="w-full px-[0.6vw] py-[0.5vw] text-[0.8vw] border border-slate-200 rounded-[0.3vw] focus:outline-none"
                style={{ '--tw-ring-color': '#2563eb' }}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-[0.75vw]">
              <ColorPickerPopover
                colorKey="textColor"
                label="Text Color"
                nested={true}
                parentKey="frame"
              />
              <ColorPickerPopover
                colorKey="backgroundColor"
                label="Frame Background"
                nested={true}
                parentKey="frame"
              />
            </div>
          </div>
        )}
      </div>

      {/* Margin Control */}
      <div className="p-[1vw] bg-slate-50 rounded-[0.5vw]">
        <h4 className="text-[0.9vw] font-semibold text-slate-800 mb-[0.75vw]">Quiet Zone (Margin)</h4>
        <div className="flex items-center gap-[1vw]">
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={customization.margin || 4}
            onChange={(e) => updateCustomization('margin', parseInt(e.target.value))}
            className="flex-1 h-[0.4vw] bg-slate-200 rounded-lg appearance-none cursor-pointer"
            style={{ accentColor: '#2563eb' }}
          />
          <span className="text-[0.8vw] font-medium text-slate-700 w-[2vw] text-center">
            {customization.margin || 4}
          </span>
        </div>
        <p className="text-[0.65vw] text-slate-500 mt-[0.3vw]">
          Recommended minimum is 4 for reliable scanning
        </p>
      </div>

      {/* Quick Presets */}
      <div className="p-[1vw] bg-slate-50 rounded-[0.5vw]">
        <h4 className="text-[0.9vw] font-semibold text-slate-800 mb-[0.75vw]">Quick Presets</h4>
        <div className="flex flex-wrap gap-[0.5vw]">
          {[
            { name: 'Classic', fg: '#000000', bg: '#FFFFFF', dot: 'square' },
            { name: 'Blue', fg: '#2563eb', bg: '#FFFFFF', dot: 'rounded' },
            { name: 'Dark', fg: '#FFFFFF', bg: '#1e293b', dot: 'dots' },
            { name: 'Green', fg: '#16a34a', bg: '#f0fdf4', dot: 'rounded' },
            { name: 'Purple', fg: '#7c3aed', bg: '#FFFFFF', dot: 'classy' },
            { name: 'Coral', fg: '#f97316', bg: '#fff7ed', dot: 'extra-rounded' },
          ].map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => {
                updateCustomization('foregroundColor', preset.fg);
                updateCustomization('backgroundColor', preset.bg);
                updateCustomization('dotStyle', preset.dot);
              }}
              className="px-[0.75vw] py-[0.4vw] text-[0.75vw] border border-slate-200 rounded-[0.3vw] hover:bg-slate-100 transition-colors flex items-center gap-[0.3vw]"
            >
              <span
                className="w-[0.8vw] h-[0.8vw] rounded-full border"
                style={{ backgroundColor: preset.fg }}
              />
              {preset.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QRCustomizer;