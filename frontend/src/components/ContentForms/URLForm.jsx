import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FiLink, FiInfo } from 'react-icons/fi';

const URLForm = () => {
  const { register, formState: { errors }, watch } = useFormContext();
  const url = watch('content.target');

  return (
    <div className="space-y-[1vw]">
      <div>
        <label className="flex items-center gap-[0.4vw] text-[0.85vw] font-medium text-slate-700 mb-[0.4vw]">
          <FiLink className="text-[1vw]" />
          Website URL *
        </label>
        <input
          {...register('content.target', {
            required: 'URL is required',
            pattern: {
              value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/,
              message: 'Please enter a valid URL'
            }
          })}
          type="url"
          placeholder="https://www.example.com"
          className="w-full px-[0.75vw] py-[0.65vw] text-[0.85vw] border border-slate-200 rounded-[0.4vw] focus:outline-none focus:border-transparent"
          style={{ '--tw-ring-color': '#2563eb' }}
        />
        {errors.content?.target && (
          <p className="text-red-500 text-[0.7vw] mt-[0.25vw] flex items-center gap-[0.25vw]">
            <FiInfo className="text-[0.8vw]" />
            {errors.content.target.message}
          </p>
        )}
      </div>

      {/* Optional Fields */}
      <div className="grid grid-cols-2 gap-[0.75vw]">
        <div>
          <label className="block text-[0.8vw] font-medium text-slate-700 mb-[0.3vw]">
            Link Title (Optional)
          </label>
          <input
            {...register('content.title')}
            type="text"
            placeholder="My Website"
            className="w-full px-[0.75vw] py-[0.6vw] text-[0.85vw] border border-slate-200 rounded-[0.4vw] focus:outline-none"
            style={{ '--tw-ring-color': '#2563eb' }}
          />
        </div>
        <div>
          <label className="block text-[0.8vw] font-medium text-slate-700 mb-[0.3vw]">
            Favicon URL (Optional)
          </label>
          <input
            {...register('content.favicon')}
            type="url"
            placeholder="https://example.com/favicon.ico"
            className="w-full px-[0.75vw] py-[0.6vw] text-[0.85vw] border border-slate-200 rounded-[0.4vw] focus:outline-none"
            style={{ '--tw-ring-color': '#2563eb' }}
          />
        </div>
      </div>

      <div>
        <label className="block text-[0.8vw] font-medium text-slate-700 mb-[0.3vw]">
          Description (Optional)
        </label>
        <textarea
          {...register('content.description')}
          rows={3}
          placeholder="A brief description of the link destination"
          className="w-full px-[0.75vw] py-[0.6vw] text-[0.85vw] border border-slate-200 rounded-[0.4vw] focus:outline-none resize-none"
          style={{ '--tw-ring-color': '#2563eb' }}
        />
      </div>

      {/* URL Preview */}
      {url && (
        <div className="p-[0.75vw] bg-slate-50 rounded-[0.4vw] border border-slate-200">
          <p className="text-[0.7vw] text-slate-500 mb-[0.25vw]">URL Preview</p>
          <p className="text-[0.8vw] break-all" style={{ color: '#2563eb' }}>{url}</p>
        </div>
      )}
    </div>
  );
};

export default URLForm;