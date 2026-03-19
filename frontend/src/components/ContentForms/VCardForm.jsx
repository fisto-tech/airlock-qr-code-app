import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FiUser, FiPhone, FiMail, FiBriefcase, FiGlobe, FiMapPin, FiCalendar } from 'react-icons/fi';

const VCardForm = () => {
  const { register, formState: { errors } } = useFormContext();

  const inputClass = "w-full px-[0.75vw] py-[0.55vw] text-[0.8vw] border border-slate-200 rounded-[0.4vw] focus:outline-none" + " [&:focus]:ring-2" + " [&:focus]:ring-[#2563eb]";
  const labelClass = "block text-[0.75vw] font-medium text-slate-700 mb-[0.25vw]";

  return (
    <div className="space-y-[1vw]">
      {/* Personal Info */}
      <div className="p-[0.75vw] bg-slate-50 rounded-[0.5vw]">
        <h5 className="flex items-center gap-[0.4vw] text-[0.85vw] font-semibold text-slate-800 mb-[0.75vw]">
          <FiUser className="text-[1vw]" style={{ color: '#2563eb' }} />
          Personal Information
        </h5>
        <div className="grid grid-cols-2 gap-[0.75vw]">
          <div>
            <label className={labelClass}>First Name *</label>
            <input
              {...register('content.firstName', { required: 'First name is required' })}
              type="text"
              placeholder="John"
              className={inputClass}
            />
            {errors.content?.firstName && (
              <p className="text-red-500 text-[0.65vw] mt-[0.15vw]">{errors.content.firstName.message}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Last Name *</label>
            <input
              {...register('content.lastName', { required: 'Last name is required' })}
              type="text"
              placeholder="Doe"
              className={inputClass}
            />
            {errors.content?.lastName && (
              <p className="text-red-500 text-[0.65vw] mt-[0.15vw]">{errors.content.lastName.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Work Info */}
      <div className="p-[0.75vw] bg-slate-50 rounded-[0.5vw]">
        <h5 className="flex items-center gap-[0.4vw] text-[0.85vw] font-semibold text-slate-800 mb-[0.75vw]">
          <FiBriefcase className="text-[1vw]" style={{ color: '#2563eb' }} />
          Work Information
        </h5>
        <div className="grid grid-cols-2 gap-[0.75vw]">
          <div>
            <label className={labelClass}>Organization</label>
            <input
              {...register('content.organization')}
              type="text"
              placeholder="Company Name"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Job Title</label>
            <input
              {...register('content.title')}
              type="text"
              placeholder="Software Engineer"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="p-[0.75vw] bg-slate-50 rounded-[0.5vw]">
        <h5 className="flex items-center gap-[0.4vw] text-[0.85vw] font-semibold text-slate-800 mb-[0.75vw]">
          <FiPhone className="text-[1vw]" style={{ color: '#2563eb' }} />
          Contact Information
        </h5>
        <div className="grid grid-cols-2 gap-[0.75vw]">
          <div>
            <label className={labelClass}>Email *</label>
            <input
              {...register('content.email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              type="email"
              placeholder="john@example.com"
              className={inputClass}
            />
            {errors.content?.email && (
              <p className="text-red-500 text-[0.65vw] mt-[0.15vw]">{errors.content.email.message}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input
              {...register('content.phone')}
              type="tel"
              placeholder="+1 234 567 8900"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Mobile</label>
            <input
              {...register('content.mobile')}
              type="tel"
              placeholder="+1 234 567 8901"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Fax</label>
            <input
              {...register('content.fax')}
              type="tel"
              placeholder="+1 234 567 8902"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Web & Social */}
      <div className="p-[0.75vw] bg-slate-50 rounded-[0.5vw]">
        <h5 className="flex items-center gap-[0.4vw] text-[0.85vw] font-semibold text-slate-800 mb-[0.75vw]">
          <FiGlobe className="text-[1vw]" style={{ color: '#2563eb' }} />
          Website
        </h5>
        <div>
          <label className={labelClass}>Website URL</label>
          <input
            {...register('content.website')}
            type="url"
            placeholder="https://www.example.com"
            className={inputClass}
          />
        </div>
      </div>

      {/* Address */}
      <div className="p-[0.75vw] bg-slate-50 rounded-[0.5vw]">
        <h5 className="flex items-center gap-[0.4vw] text-[0.85vw] font-semibold text-slate-800 mb-[0.75vw]">
          <FiMapPin className="text-[1vw]" style={{ color: '#2563eb' }} />
          Address
        </h5>
        <div className="space-y-[0.5vw]">
          <div>
            <label className={labelClass}>Street Address</label>
            <input
              {...register('content.address.street')}
              type="text"
              placeholder="123 Main Street"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-[0.75vw]">
            <div>
              <label className={labelClass}>City</label>
              <input
                {...register('content.address.city')}
                type="text"
                placeholder="New York"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>State/Province</label>
              <input
                {...register('content.address.state')}
                type="text"
                placeholder="NY"
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-[0.75vw]">
            <div>
              <label className={labelClass}>ZIP/Postal Code</label>
              <input
                {...register('content.address.zip')}
                type="text"
                placeholder="10001"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Country</label>
              <input
                {...register('content.address.country')}
                type="text"
                placeholder="United States"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Additional */}
      <div className="p-[0.75vw] bg-slate-50 rounded-[0.5vw]">
        <h5 className="flex items-center gap-[0.4vw] text-[0.85vw] font-semibold text-slate-800 mb-[0.75vw]">
          <FiCalendar className="text-[1vw]" style={{ color: '#2563eb' }} />
          Additional
        </h5>
        <div className="grid grid-cols-2 gap-[0.75vw]">
          <div>
            <label className={labelClass}>Birthday</label>
            <input
              {...register('content.birthday')}
              type="date"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Photo URL</label>
            <input
              {...register('content.photo')}
              type="url"
              placeholder="https://example.com/photo.jpg"
              className={inputClass}
            />
          </div>
        </div>
        <div className="mt-[0.5vw]">
          <label className={labelClass}>Notes</label>
          <textarea
            {...register('content.notes')}
            rows={2}
            placeholder="Additional notes..."
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>
    </div>
  );
};

export default VCardForm;