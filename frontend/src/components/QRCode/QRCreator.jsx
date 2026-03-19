import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FiLink,
  FiUser,
  FiFileText,
  FiUpload,
  FiList,
  FiWifi,
  FiMail,
  FiMessageSquare,
  FiMapPin,
  FiArrowRight,
  FiArrowLeft,
  FiCheck,
} from 'react-icons/fi';

import QRPreview from './QRPreview';
import QRCustomizer from './QRCustomizer';
import URLForm from '../ContentForms/URLForm';
import VCardForm from '../ContentForms/VCardForm';
import TextForm from '../ContentForms/TextForm';
import FileUploadForm from '../ContentForms/FileUploadForm';
import MultiLinkForm from '../ContentForms/MultiLinkForm';
import EmailForm from '../ContentForms/EmailForm';
import SMSForm from '../ContentForms/SMSForm';
import WiFiForm from '../ContentForms/WiFiForm';
import LocationForm from '../ContentForms/LocationForm';
import { qrCodeAPI } from '../../services/api';

const contentTypes = [
  { id: 'url', label: 'URL', icon: FiLink, color: 'bg-blue-500' },
  { id: 'vcard', label: 'Contact Card', icon: FiUser, color: 'bg-green-500' },
  // { id: 'text', label: 'Plain Text', icon: FiFileText, color: 'bg-purple-500' },
  { id: 'file', label: 'File Upload', icon: FiUpload, color: 'bg-orange-500' },
  // { id: 'multilink', label: 'Multiple Links', icon: FiList, color: 'bg-pink-500' },
  // { id: 'wifi', label: 'WiFi Network', icon: FiWifi, color: 'bg-cyan-500' },
  { id: 'email', label: 'Email', icon: FiMail, color: 'bg-red-500' },
  { id: 'sms', label: 'SMS', icon: FiMessageSquare, color: 'bg-yellow-500' },
  { id: 'location', label: 'Location', icon: FiMapPin, color: 'bg-teal-500' },
];

const steps = [
  { id: 1, title: 'Content', description: 'Type & Information' },
  { id: 2, title: 'Design', description: 'Aesthetics & Logo' },
  { id: 3, title: 'Review', description: 'Finalize & Create' },
];

const qrSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(500).optional(),
  type: z.string(),
  isDynamic: z.boolean(),
  content: z.any(),
  customization: z.object({
    foregroundColor: z.string(),
    backgroundColor: z.string(),
    dotStyle: z.string(),
    cornerStyle: z.string(),
    errorCorrectionLevel: z.string(),
    margin: z.number(),
    logo: z.object({
      url: z.string().optional(),
      size: z.number(),
    }).optional(),
    frame: z.object({
      style: z.string(),
      text: z.string().optional(),
      textColor: z.string(),
      backgroundColor: z.string(),
    }).optional(),
  }),
});

const QRCreator = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm({
    resolver: zodResolver(qrSchema),
    defaultValues: {
      title: '',
      description: '',
      type: '',
      isDynamic: true,
      content: {},
      customization: {
        foregroundColor: '#000000',
        backgroundColor: '#FFFFFF',
        dotStyle: 'square',
        cornerStyle: 'square',
        errorCorrectionLevel: 'M',
        margin: 4,
        logo: { url: '', size: 0.25 },
        frame: { style: 'none', text: '', textColor: '#000000', backgroundColor: '#FFFFFF' },
      },
    },
  });

  const { watch, setValue, handleSubmit, formState: { errors } } = methods;
  const formData = watch();

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setValue('type', type.id);
    
    // For text and vcard, default to static QR (offline compatible)
    // For other types, default to dynamic QR (URL-based)
    if (['text', 'vcard'].includes(type.id)) {
      setValue('isDynamic', false);
    } else {
      setValue('isDynamic', true);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!selectedType) {
        toast.error('Please select a QR code type');
        return;
      }
      // Simple validation for required fields in step 1
      if (!formData.title) {
        toast.error('Title is required');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      console.log('Submitting QR Code with data:', data);
      const response = await qrCodeAPI.create(data);
      console.log('Backend response:', response.data);
      toast.success('QR code created successfully!');
      navigate(`/qrcodes/${response.data.data._id}`);
    } catch (error) {
      console.error('QR Creation error:', error.response?.data || error.message);
      console.error('Full error object:', error);
      toast.error(error.response?.data?.message || 'Failed to create QR code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onValidationError = (errors) => {
    console.error('Validation errors:', errors);
    const firstError = Object.values(errors)[0];
    const msg = firstError?.message || 'Please fill in all required fields';
    toast.error(msg);
  };

  const renderContentForm = () => {
    switch (selectedType?.id) {
      case 'url':
        return <URLForm />;
      case 'vcard':
        return <VCardForm />;
      case 'text':
        return <TextForm />;
      case 'file':
        return <FileUploadForm />;
      case 'multilink':
        return <MultiLinkForm />;
      case 'email':
        return <EmailForm />;
      case 'sms':
        return <SMSForm />;
      case 'wifi':
        return <WiFiForm />;
      case 'location':
        return <LocationForm />;
      default:
        return <URLForm />;
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="grid grid-cols-12 gap-[1.2vw] h-[calc(100vh-7vw)] overflow-hidden">
        {/* Left Panel - Form */}
        <div className="col-span-7 bg-white rounded-[0.75vw] shadow-sm overflow-hidden flex flex-col">
          {/* Step Indicator */}
          <div className="p-[1.25vw] border-b border-slate-200">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div
                    className={`flex items-center gap-[0.5vw] cursor-pointer
                      ${currentStep >= step.id ? '' : 'text-slate-400'}"
                      style={currentStep >= step.id ? { color: '#2563eb' } : {}}
                    `}
                    onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                  >
                    <div
                      className={`
                        w-[2vw] h-[2vw] rounded-full flex items-center justify-center text-[0.8vw] font-semibold text-white
                      `}
                      style={{
                        backgroundColor: currentStep > step.id ? '#2563eb' : currentStep === step.id ? '#eff6ff' : '#f3f4f6',
                        color: currentStep > step.id ? 'white' : currentStep === step.id ? '#2563eb' : '#9ca3af',
                        borderColor: currentStep === step.id ? '#2563eb' : 'transparent',
                        borderWidth: currentStep === step.id ? '2px' : '0px',
                      }}
                    >
                      {currentStep > step.id ? <FiCheck className="text-[0.9vw]" /> : step.id}
                    </div>
                    <div className="hidden lg:block">
                      <p className="text-[0.75vw] font-medium">{step.title}</p>
                      <p className="text-[0.6vw] text-slate-400">{step.description}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-[2px] mx-[0.75vw] ${currentStep > step.id ? '' : 'bg-slate-200'}`} style={currentStep > step.id ? { backgroundColor: '#2563eb' } : {}} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-[1.5vw]">
            <AnimatePresence mode="wait">
              {/* Stage 1: Content Setup */}
              {currentStep === 1 && (
                <motion.div
                  key="stage1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-[1.5vw]"
                >
                  <section>
                    <h3 className="text-[1vw] font-bold text-slate-800 mb-[1vw]">1. Select QR Type</h3>
                    <div className="grid grid-cols-3 gap-[1vw]">
                      {contentTypes.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => handleTypeSelect(type)}
                          className="p-[1vw] rounded-[0.75vw] border-2 text-left transition-all group relative overflow-hidden"
                          style={{
                            borderColor: selectedType?.id === type.id ? '#3b82f6' : '#f1f5f9',
                            backgroundColor: selectedType?.id === type.id ? '#eff6ff' : '#f8fafc',
                          }}
                        >
                          <div className="flex items-center gap-[0.75vw]">
                            <div className={`w-[2.5vw] h-[2.5vw] ${type.color} rounded-[0.5vw] flex items-center justify-center shadow-sm`}>
                              <type.icon className="text-white text-[1.25vw]" />
                            </div>
                            <span className="text-[0.85vw] font-bold text-slate-700">{type.label}</span>
                          </div>
                          {selectedType?.id === type.id && (
                            <div className="absolute top-[0.5vw] right-[0.5vw] text-blue-600">
                              <FiCheck className="text-[1vw]" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </section>

                  {selectedType && (
                    <motion.section
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-[1.25vw] pt-[1.5vw] border-t border-slate-100"
                    >
                      <h3 className="text-[1vw] font-bold text-slate-800">2. Enter Information</h3>
                      <div className="grid grid-cols-2 gap-[1.25vw]">
                        <div>
                          <label className="block text-[0.8vw] font-medium text-slate-600 mb-[0.4vw]">
                            Project Name / Title *
                          </label>
                          <input
                            {...methods.register('title')}
                            className="w-full px-[0.75vw] py-[0.7vw] text-[0.85vw] border border-slate-200 rounded-[0.5vw] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            placeholder="e.g. My Website QR"
                          />
                        </div>
                        <div className="flex items-end pb-[0.5vw]">
                          {!['text', 'vcard'].includes(selectedType?.id) && (
                            <label className="flex items-center gap-[0.75vw] p-[0.75vw] bg-slate-50 border border-slate-200 rounded-[0.5vw] cursor-pointer hover:bg-slate-100 transition-colors flex-1">
                              <input
                                type="checkbox"
                                {...methods.register('isDynamic')}
                                className="w-[1vw] h-[1vw] rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-[0.8vw] font-bold text-slate-700 leading-none">Dynamic QR</p>
                                <p className="text-[0.65vw] text-slate-500 mt-[0.2vw]">Editable & Trackable</p>
                              </div>
                            </label>
                          )}
                        </div>
                      </div>

                      <div className="mt-[0.5vw]">
                        {renderContentForm()}
                      </div>
                    </motion.section>
                  )}
                </motion.div>
              )}

              {/* Stage 2: Aesthetic Design */}
              {currentStep === 2 && (
                <motion.div
                  key="stage2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <QRCustomizer />
                </motion.div>
              )}

              {/* Stage 3: Review & Finalize */}
              {currentStep === 3 && (
                <motion.div
                  key="stage3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-[2vw]"
                >
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-[1.5vw] rounded-[1vw] text-white shadow-lg">
                    <h3 className="text-[1.25vw] font-bold mb-[0.5vw]">Ready to Launch!</h3>
                    <p className="text-[0.9vw] opacity-90">
                      Your {selectedType?.label} QR code is configured. Review your choices and create it now.
                    </p>
                  </div>

                  <div className="bg-white p-[1.5vw] rounded-[1vw] border border-slate-200 shadow-sm space-y-[1.5vw]">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-[1vw]">
                        <h4 className="text-[1vw] font-bold text-slate-800">Configuration Details</h4>
                        <span className={`px-[0.75vw] py-[0.25vw] rounded-full text-[0.7vw] font-bold uppercase tracking-wider ${formData.isDynamic ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {formData.isDynamic ? 'Dynamic' : 'Static'}
                        </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-[1.5vw]">
                      <div className="space-y-[1vw]">
                        <div>
                          <p className="text-[0.7vw] text-slate-400 font-bold uppercase">QR Title</p>
                          <p className="text-[0.9vw] font-semibold text-slate-800 truncate">{formData.title}</p>
                        </div>
                        <div>
                          <p className="text-[0.7vw] text-slate-400 font-bold uppercase">QR Type</p>
                          <p className="text-[0.9vw] font-semibold text-slate-800 uppercase">{formData.type}</p>
                        </div>
                      </div>
                      <div className="space-y-[1vw]">
                        <div>
                          <p className="text-[0.7vw] text-slate-400 font-bold uppercase">Dimensions</p>
                          <p className="text-[0.9vw] font-semibold text-slate-800">1000 x 1000 px</p>
                        </div>
                        <div>
                          <p className="text-[0.7vw] text-slate-400 font-bold uppercase">Correction</p>
                          <p className="text-[0.9vw] font-semibold text-slate-800">{formData.customization.errorCorrectionLevel} Level</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-[1vw] rounded-[0.75vw] border border-slate-200 flex items-start gap-[1vw]">
                    <div className="p-[0.5vw] bg-amber-100 rounded-[0.5vw]">
                        <FiActivity className="text-amber-600 text-[1.2vw]" />
                    </div>
                    <p className="text-[0.75vw] text-slate-600">
                      <strong>Check Your QR:</strong> We recommend scanning the preview with your phone before final creation to ensure it works perfectly with your chosen colors and shapes.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          <div className="p-[1.25vw] border-t border-slate-200 bg-slate-50 flex justify-between items-center">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`
                flex items-center gap-[0.5vw] px-[1.25vw] py-[0.7vw] rounded-[0.5vw]
                text-[0.9vw] font-bold transition-all
                ${currentStep === 1
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200'
                }
              `}
            >
              <FiArrowLeft className="text-[1.1vw]" />
              Go Back
            </button>

            {currentStep < 3 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-[0.75vw] px-[2vw] py-[0.75vw]
                  text-white rounded-[0.5vw] text-[0.95vw] font-bold shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-[1px] active:translate-y-[0px]"
                style={{ backgroundColor: '#2563eb' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
              >
                Continue to {steps[currentStep].title}
                <FiArrowRight className="text-[1.1vw]" />
              </button>
            ) : (
              <button
                onClick={handleSubmit(onSubmit, onValidationError)}
                disabled={isSubmitting}
                className="flex items-center gap-[0.75vw] px-[2.5vw] py-[0.75vw]
                  text-white rounded-[0.5vw] text-[0.95vw] font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#2563eb' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-[1.25vw] h-[1.25vw] border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FiCheck className="text-[1.1vw]" />
                    Finalize & Create QR
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="col-span-5 bg-white rounded-[0.75vw] shadow-sm p-[1.5vw] flex flex-col overflow-y-auto custom-scrollbar">
          <h3 className="text-[1vw] font-semibold text-slate-800 mb-[1vw]">Live Preview</h3>
          <div className="flex-1 flex items-center justify-center">
            <QRPreview customization={formData.customization} content={formData.content} type={formData.type} isDynamic={formData.isDynamic} />
          </div>
        </div>
      </div>
    </FormProvider>
  );
};

export default QRCreator;