import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  FiArrowLeft, FiDownload, FiEdit2, FiTrash2, FiCopy,
  FiExternalLink, FiMapPin, FiBarChart2, FiWifi, FiMail,
  FiMessageSquare, FiLink, FiUser, FiFileText, FiUpload, FiList,
  FiToggleLeft, FiToggleRight, FiCalendar, FiTag, FiSave, FiX, FiActivity,
} from 'react-icons/fi';
import { qrCodeAPI } from '../services/api';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import QRPreview from '../components/QRCode/QRPreview';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4001';

const TYPE_META = {
  url:       { icon: FiLink,          label: 'URL',           color: '#3b82f6' },
  vcard:     { icon: FiUser,          label: 'Contact Card',  color: '#22c55e' },
  text:      { icon: FiFileText,      label: 'Plain Text',    color: '#a855f7' },
  file:      { icon: FiUpload,        label: 'File Upload',   color: '#f97316' },
  multilink: { icon: FiList,          label: 'Multi-Link',    color: '#ec4899' },
  wifi:      { icon: FiWifi,          label: 'WiFi',          color: '#06b6d4' },
  email:     { icon: FiMail,          label: 'Email',         color: '#ef4444' },
  sms:       { icon: FiMessageSquare, label: 'SMS',           color: '#eab308' },
  location:  { icon: FiMapPin,        label: 'Location',      color: '#14b8a6' },
};

const QRCodeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [qr, setQR] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    fetchQR();
  }, [id]);

  const fetchQR = async () => {
    setLoading(true);
    try {
      const res = await qrCodeAPI.getOne(id);
      const data = res.data.data;
      setQR(data);
      setEditData({
        title: data.title,
        description: data.description || '',
        content: { ...data.content },
        customization: { ...data.customization },
        isActive: data.isActive,
      });
    } catch {
      toast.error('Failed to load QR code');
      navigate('/qrcodes');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const res = await qrCodeAPI.update(id, editData);
      setQR(res.data.data);
      setIsEditing(false);
      toast.success('Updated successfully!');
    } catch {
      toast.error('Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this QR code?')) return;
    try {
      await qrCodeAPI.delete(id);
      toast.success('Deleted');
      navigate('/qrcodes');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleDownload = async (format = 'png') => {
    try {
      const response = await qrCodeAPI.download(id, format, 1000);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${qr.title}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Downloaded ${format.toUpperCase()}`);
    } catch {
      toast.error('Download failed');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-[3vw] w-[3vw] border-b-2 border-blue-600" />
    </div>
  );

  if (!qr) return null;

  const meta = TYPE_META[qr.type] || { icon: FiLink, label: qr.type, color: '#6b7280' };
  const TypeIcon = meta.icon;
  const imgSrc = qr.qrImageUrl ? (qr.qrImageUrl.startsWith('http') ? qr.qrImageUrl : `${BACKEND_URL}${qr.qrImageUrl}`) : null;

  const inputClass = "w-full px-[0.75vw] py-[0.5vw] text-[0.85vw] border border-slate-200 rounded-[0.4vw] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 mt-1";
  const labelClass = "text-[0.65vw] font-bold text-slate-400 uppercase tracking-wider";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-[1vw] flex-shrink-0">
        <div className="flex items-center gap-[1vw]">
          <Link to="/qrcodes" className="p-[0.6vw] hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer transition-colors">
            <FiArrowLeft className="text-[1.2vw]" />
          </Link>
          <div className="flex items-center gap-[0.75vw]">
            <div className="w-[2vw] h-[2vw] rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: meta.color }}>
              <TypeIcon className="text-[1vw]" />
            </div>
            <div>
              <h1 className="text-[1.2vw] font-bold text-slate-800 leading-none">{qr.title}</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-[0.75vw]">
          {!isEditing && qr.isDynamic ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-[1vw] py-[0.5vw] bg-blue-600 text-white rounded-lg text-[0.85vw] font-semibold hover:bg-blue-700 transition-all cursor-pointer shadow-md shadow-blue-100"
            >
              <FiEdit2 /> Edit Content
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-1.5 px-[1vw] py-[0.5vw] bg-white text-slate-600 border border-slate-200 rounded-lg text-[0.85vw] font-semibold hover:bg-slate-50 transition-all cursor-pointer"
              >
                <FiX /> Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={updating}
                className="flex items-center gap-1.5 px-[1vw] py-[0.5vw] bg-green-600 text-white rounded-lg text-[0.85vw] font-semibold hover:bg-green-700 transition-all cursor-pointer shadow-md shadow-green-100 disabled:opacity-50"
              >
                {updating ? <div className="animate-spin rounded-full h-[0.8vw] w-[0.8vw] border-b-2 border-white" /> : <FiSave />}
                Save Changes
              </button>
            </>
          )}
          <div className="h-8 w-px bg-slate-200 mx-1" />
          <button onClick={handleDelete} className="p-[0.6vw] text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors">
            <FiTrash2 className="text-[1.1vw]" />
          </button>
        </div>
      </div>

      {/* Split Layout: Fix to screen, independently scrollable */}
      <div className="flex-1 flex gap-[1.2vw] overflow-hidden">
        
        {/* Left: Preview & Stats (Fixed/Compact) */}
        <div className="w-[20vw] flex flex-col gap-[0.8vw] flex-shrink-0">
          <div className="bg-white rounded-[0.8vw] border border-slate-200 p-[0.6vw] shadow-sm ">
            <div className="bg-slate-50 rounded-[0.6vw] aspect-square w-[90%] mx-auto flex items-center justify-center mb-[0.4vw] relative group overflow-hidden">
              {isEditing ? (
                <div className="bg-white p-[0.6vw] rounded-[0.4vw]">
                  <QRPreview 
                    customization={editData.customization} 
                    content={editData.content} 
                    type={qr.type}
                    isDynamic={qr.isDynamic}
                  />
                </div>
              ) : imgSrc ? (
                <img src={imgSrc} alt="QR Preview" className="w-full h-full object-contain p-[0.75vw]" />
              ) : (
                <TypeIcon className="text-[3vw] text-slate-200" />
              )}
              {!isEditing && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => window.open(qr.shortUrl, '_blank')} className="bg-white p-2 rounded-full cursor-pointer hover:scale-110 transition-transform"><FiExternalLink className="text-blue-600" /></button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-[0.4vw]">
               {['png', 'svg', 'jpeg', 'webp'].map(fmt => (
                 <button 
                    key={fmt} 
                    onClick={() => handleDownload(fmt)}
                    className="flex items-center justify-center gap-1.2 py-[0.35vw] rounded-md border border-slate-100 text-[0.6vw] font-bold text-slate-500 uppercase hover:bg-slate-50 cursor-pointer transition-colors"
                 >
                    <FiDownload className="text-[0.7vw]" /> {fmt}
                 </button>
               ))}
            </div>
          </div>

          <div className="bg-white rounded-[0.8vw] border border-slate-200 p-[0.75vw] flex-1 overflow-y-auto custom-scrollbar shadow-sm">
             <h3 className="text-[0.7vw] font-bold text-slate-800 mb-[0.5vw] flex items-center gap-2">
                <FiBarChart2 className="text-blue-500" /> Activity
             </h3>
             <div className="space-y-[0.4vw]">
                {[
                    { label: 'Total Scans', value: qr.scanCount, icon: FiActivity, color: 'bg-blue-50 text-blue-600' },
                    { label: 'Created On', value: format(new Date(qr.createdAt), 'MMM d, yyyy'), icon: FiCalendar, color: 'bg-green-50 text-green-600' },
                ].map(stat => (
                    <div key={stat.label} className="flex flex-col gap-0.2 p-[0.4vw] bg-slate-50 rounded-lg">
                        <span className="text-[0.5vw] font-bold text-slate-400 uppercase leading-tight">{stat.label}</span>
                        <span className="text-[0.75vw] font-bold text-slate-800 truncate">{stat.value}</span>
                    </div>
                ))}
             </div>
          </div>

        </div>

        {/* Right: Content Forms (Fixed Height Window + Scroll) */}
        <div className="flex-1 bg-white rounded-[0.8vw] border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full">
            <div className="px-[1.2vw] py-[0.8vw] border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <h2 className="text-[0.9vw] font-bold text-slate-800 flex items-center gap-2">
                        {isEditing ? <FiEdit2 className="text-blue-500" /> : <FiFileText className="text-blue-500" />}
                        {isEditing ? 'Editing Mode' : 'Content Details'}
                    </h2>
                    <div className="px-[0.6vw] py-[0.15vw] bg-blue-100 text-blue-700 rounded-full text-[0.6vw] font-bold uppercase tracking-wider">
                        {qr.type}
                    </div>
                </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-[1.2vw] custom-scrollbar">
                <AnimatePresence mode="wait">
                    {isEditing ? (
                        <motion.div
                            key="edit"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-[1.5vw]"
                        >
                            {/* General Info */}
                            <div className="grid grid-cols-2 gap-[1vw]">
                                <div className="col-span-2">
                                    <label className={labelClass}>QR Code Title</label>
                                    <input 
                                        type="text" 
                                        className={inputClass} 
                                        value={editData.title}
                                        onChange={e => setEditData({...editData, title: e.target.value})}
                                    />
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Type Specific Fields */}
                            <div>
                                <h3 className="text-[0.8vw] font-bold text-slate-800 mb-[0.75vw]">QR Content</h3>
                                <div className="grid grid-cols-2 gap-[1vw]">
                                    {qr.type === 'url' && (
                                        <>
                                            <div className="col-span-2">
                                                <label className={labelClass}>Website URL</label>
                                                <input type="url" className={inputClass} value={editData.content.target} onChange={e => setEditData({...editData, content: {...editData.content, target: e.target.value}})} />
                                            </div>
                                            <div className="col-span-1">
                                                <label className={labelClass}>Link Title (Optional)</label>
                                                <input type="text" className={inputClass} value={editData.content.title} onChange={e => setEditData({...editData, content: {...editData.content, title: e.target.value}})} />
                                            </div>
                                            <div className="col-span-1">
                                                <label className={labelClass}>Favicon URL (Optional)</label>
                                                <input type="text" className={inputClass} value={editData.content.favicon} onChange={e => setEditData({...editData, content: {...editData.content, favicon: e.target.value}})} />
                                            </div>
                                            <div className="col-span-2">
                                                <label className={labelClass}>Link Description (Optional)</label>
                                                <textarea className={`${inputClass} h-[4vw] resize-none`} value={editData.content.description} onChange={e => setEditData({...editData, content: {...editData.content, description: e.target.value}})} />
                                            </div>
                                        </>
                                    )}
                                    {qr.type === 'vcard' && (
                                        <>
                                            <div className="col-span-1">
                                                <label className={labelClass}>First Name</label>
                                                <input type="text" className={inputClass} value={editData.content.firstName} onChange={e => setEditData({...editData, content: {...editData.content, firstName: e.target.value}})} />
                                            </div>
                                            <div className="col-span-1">
                                                <label className={labelClass}>Last Name</label>
                                                <input type="text" className={inputClass} value={editData.content.lastName} onChange={e => setEditData({...editData, content: {...editData.content, lastName: e.target.value}})} />
                                            </div>
                                            <div className="col-span-1">
                                                <label className={labelClass}>Email</label>
                                                <input type="email" className={inputClass} value={editData.content.email} onChange={e => setEditData({...editData, content: {...editData.content, email: e.target.value}})} />
                                            </div>
                                            <div className="col-span-1">
                                                <label className={labelClass}>Phone</label>
                                                <input type="tel" className={inputClass} value={editData.content.phone} onChange={e => setEditData({...editData, content: {...editData.content, phone: e.target.value}})} />
                                            </div>
                                            <div className="col-span-1">
                                                <label className={labelClass}>Organization</label>
                                                <input type="text" className={inputClass} value={editData.content.organization} onChange={e => setEditData({...editData, content: {...editData.content, organization: e.target.value}})} />
                                            </div>
                                            <div className="col-span-1">
                                                <label className={labelClass}>Job Title</label>
                                                <input type="text" className={inputClass} value={editData.content.title} onChange={e => setEditData({...editData, content: {...editData.content, title: e.target.value}})} />
                                            </div>
                                            <div className="col-span-2">
                                                <label className={labelClass}>Notes</label>
                                                <textarea className={`${inputClass} h-[3vw] resize-none`} value={editData.content.notes} onChange={e => setEditData({...editData, content: {...editData.content, notes: e.target.value}})} />
                                            </div>
                                        </>
                                    )}
                                    {qr.type === 'text' && (
                                        <div className="col-span-2">
                                            <label className={labelClass}>Text Content</label>
                                            <textarea className={`${inputClass} h-[8vw] resize-none`} value={editData.content.content} onChange={e => setEditData({...editData, content: {...editData.content, content: e.target.value}})} />
                                        </div>
                                    )}
                                    {qr.type === 'email' && (
                                        <>
                                            <div className="col-span-2">
                                                <label className={labelClass}>Email Address</label>
                                                <input type="email" className={inputClass} value={editData.content.address || editData.content.email || editData.content.to || ''} onChange={e => setEditData({...editData, content: {...editData.content, address: e.target.value}})} />
                                            </div>
                                            <div className="col-span-2">
                                                <label className={labelClass}>Subject</label>
                                                <input type="text" className={inputClass} value={editData.content.subject} onChange={e => setEditData({...editData, content: {...editData.content, subject: e.target.value}})} />
                                            </div>
                                            <div className="col-span-2">
                                                <label className={labelClass}>Message Body</label>
                                                <textarea className={`${inputClass} h-[5vw] resize-none`} value={editData.content.body} onChange={e => setEditData({...editData, content: {...editData.content, body: e.target.value}})} />
                                            </div>
                                        </>
                                    )}
                                    {qr.type === 'sms' && (
                                        <>
                                            <div className="col-span-2">
                                                <label className={labelClass}>Phone Number</label>
                                                <input type="tel" className={inputClass} value={editData.content.phone} onChange={e => setEditData({...editData, content: {...editData.content, phone: e.target.value}})} />
                                            </div>
                                            <div className="col-span-2">
                                                <label className={labelClass}>Message</label>
                                                <textarea className={`${inputClass} h-[5vw] resize-none`} value={editData.content.message} onChange={e => setEditData({...editData, content: {...editData.content, message: e.target.value}})} />
                                            </div>
                                        </>
                                    )}
                                    {qr.type === 'wifi' && (
                                        <>
                                            <div className="col-span-1">
                                                <label className={labelClass}>Network SSID</label>
                                                <input type="text" className={inputClass} value={editData.content.ssid} onChange={e => setEditData({...editData, content: {...editData.content, ssid: e.target.value}})} />
                                            </div>
                                            <div className="col-span-1">
                                                <label className={labelClass}>Password</label>
                                                <input type="password" className={inputClass} value={editData.content.password} onChange={e => setEditData({...editData, content: {...editData.content, password: e.target.value}})} />
                                            </div>
                                            <div className="col-span-1">
                                                <label className={labelClass}>Security Type</label>
                                                <select className={inputClass} value={editData.content.encryption} onChange={e => setEditData({...editData, content: {...editData.content, encryption: e.target.value}})}>
                                                    <option value="WPA">WPA/WPA2</option>
                                                    <option value="WEP">WEP</option>
                                                    <option value="nopass">No Password</option>
                                                </select>
                                            </div>
                                            <div className="col-span-1 flex items-center pt-[1vw]">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={editData.content.hidden} 
                                                        onChange={e => setEditData({...editData, content: {...editData.content, hidden: e.target.checked}})} 
                                                    />
                                                    <span className="text-[0.7vw] font-bold text-slate-600 uppercase">Hidden Network</span>
                                                </label>
                                            </div>
                                        </>
                                    )}
                                    {qr.type === 'location' && (
                                        <>
                                            <div className="col-span-2">
                                                <label className={labelClass}>Address or Search Term</label>
                                                <textarea className={`${inputClass} h-[4vw] resize-none`} value={editData.content.address} onChange={e => setEditData({...editData, content: {...editData.content, address: e.target.value}})} />
                                            </div>
                                            <div className="col-span-1">
                                                <label className={labelClass}>Postal Code (Optional)</label>
                                                <input type="text" className={inputClass} value={editData.content.postalCode} onChange={e => setEditData({...editData, content: {...editData.content, postalCode: e.target.value}})} />
                                            </div>
                                            <div className="col-span-1">
                                                <label className={labelClass}>Location Name (Optional)</label>
                                                <input type="text" className={inputClass} value={editData.content.name} onChange={e => setEditData({...editData, content: {...editData.content, name: e.target.value}})} />
                                            </div>
                                        </>
                                    )}
                                    {qr.type === 'file' && (
                                        <div className="col-span-2">
                                            <div className="p-[1.5vw] border-2 border-dashed border-slate-200 rounded-[0.8vw] text-center bg-slate-50">
                                                <FiUpload className="mx-auto text-[2vw] text-slate-400 mb-2" />
                                                <p className="text-[0.85vw] font-medium text-slate-700">Currently hosting: <span className="text-blue-600">{editData.content.fileName || 'file'}</span></p>
                                                <p className="text-[0.7vw] text-slate-500 mt-1">To change the file, please create a new QR code as this requires a server-side upload.</p>
                                            </div>
                                        </div>
                                    )}
                                    {qr.type === 'multilink' && (
                                        <>
                                            <div className="col-span-2 bg-slate-50 p-[1vw] rounded-[0.6vw]">
                                                <h5 className="text-[0.8vw] font-bold text-slate-700 mb-2">Profile Info</h5>
                                                <div className="grid grid-cols-2 gap-[0.75vw]">
                                                    <div className="col-span-2">
                                                        <label className={labelClass}>Page Title</label>
                                                        <input type="text" className={inputClass} value={editData.content.title} onChange={e => setEditData({...editData, content: {...editData.content, title: e.target.value}})} />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className={labelClass}>Bio</label>
                                                        <textarea className={`${inputClass} h-[3vw] resize-none`} value={editData.content.description} onChange={e => setEditData({...editData, content: {...editData.content, description: e.target.value}})} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-span-2">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h5 className="text-[0.8vw] font-bold text-slate-700">Links ({editData.content.links?.length || 0})</h5>
                                                    <button 
                                                        onClick={() => setEditData({...editData, content: {...editData.content, links: [...(editData.content.links || []), {title: '', url: '', order: (editData.content.links?.length || 0)}]}})}
                                                        className="text-[0.7vw] text-blue-600 font-bold hover:underline"
                                                    >+ Add Link</button>
                                                </div>
                                                <div className="space-y-[0.5vw]">
                                                    {(editData.content.links || []).map((link, idx) => (
                                                        <div key={idx} className="flex items-start gap-2 p-[0.75vw] bg-white border border-slate-200 rounded-[0.5vw]">
                                                            <div className="flex-1 space-y-2">
                                                                <input 
                                                                    placeholder="Link Title" 
                                                                    className={inputClass} 
                                                                    value={link.title} 
                                                                    onChange={e => {
                                                                        const newLinks = [...editData.content.links];
                                                                        newLinks[idx] = {...newLinks[idx], title: e.target.value};
                                                                        setEditData({...editData, content: {...editData.content, links: newLinks}});
                                                                    }} 
                                                                />
                                                                <input 
                                                                    placeholder="URL (https://...)" 
                                                                    className={inputClass} 
                                                                    value={link.url} 
                                                                    onChange={e => {
                                                                        const newLinks = [...editData.content.links];
                                                                        newLinks[idx] = {...newLinks[idx], url: e.target.value};
                                                                        setEditData({...editData, content: {...editData.content, links: newLinks}});
                                                                    }} 
                                                                />
                                                            </div>
                                                            <button 
                                                                onClick={() => {
                                                                    const newLinks = editData.content.links.filter((_, i) => i !== idx);
                                                                    setEditData({...editData, content: {...editData.content, links: newLinks}});
                                                                }}
                                                                className="p-1 text-slate-400 hover:text-red-500"
                                                            >
                                                                <FiX />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Appearance & Status Container */}
                            <div className="bg-white border border-slate-200 rounded-[0.8vw] p-[1vw] space-y-[1vw]">
                                <h3 className="text-[0.8vw] font-bold text-slate-800 flex items-center gap-2">
                                    <FiActivity className="text-blue-500" />
                                    Appearance & Visibility
                                </h3>
                                
                                <div className="grid grid-cols-3 gap-[1.5vw]">
                                    {/* Foreground Color */}
                                    <div>
                                        <label className={labelClass}>Foreground</label>
                                        <div className="flex items-center gap-0 mt-1 border border-slate-200 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 transition-all bg-slate-50">
                                            <div className="p-1.5 border-r border-slate-200 bg-white">
                                                <input 
                                                    type="color" 
                                                    className="w-[1.5vw] h-[1.5vw] border-0 cursor-pointer block p-0" 
                                                    value={editData.customization.foregroundColor} 
                                                    onChange={e => setEditData({...editData, customization: {...editData.customization, foregroundColor: e.target.value}})} 
                                                />
                                            </div>
                                            <input 
                                                type="text" 
                                                className="flex-1 px-3 py-1.5 text-[0.8vw] font-mono bg-transparent border-0 focus:ring-0 outline-none text-slate-700" 
                                                value={editData.customization.foregroundColor} 
                                                onChange={e => setEditData({...editData, customization: {...editData.customization, foregroundColor: e.target.value}})} 
                                            />
                                        </div>
                                    </div>

                                    {/* Background Color */}
                                    <div>
                                        <label className={labelClass}>Background</label>
                                        <div className="flex items-center gap-0 mt-1 border border-slate-200 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 transition-all bg-slate-50">
                                            <div className="p-1.5 border-r border-slate-200 bg-white">
                                                <input 
                                                    type="color" 
                                                    className="w-[1.5vw] h-[1.5vw] border-0 cursor-pointer block p-0" 
                                                    value={editData.customization.backgroundColor} 
                                                    onChange={e => setEditData({...editData, customization: {...editData.customization, backgroundColor: e.target.value}})} 
                                                />
                                            </div>
                                            <input 
                                                type="text" 
                                                className="flex-1 px-3 py-1.5 text-[0.8vw] font-mono bg-transparent border-0 focus:ring-0 outline-none text-slate-700" 
                                                value={editData.customization.backgroundColor} 
                                                onChange={e => setEditData({...editData, customization: {...editData.customization, backgroundColor: e.target.value}})} 
                                            />
                                        </div>
                                    </div>


                                    {/* Custom Toggle Switch */}
                                    <div>
                                        <label className={labelClass}>Status</label>
                                        <div className="flex items-center gap-3 mt-1 py-[0.25vw]">
                                            <div 
                                                onClick={() => setEditData({...editData, isActive: !editData.isActive})}
                                                className={`relative w-[2.8vw] h-[1.4vw] rounded-full cursor-pointer transition-colors duration-200 ${editData.isActive ? 'bg-blue-600' : 'bg-slate-300'}`}
                                            >
                                                <div 
                                                    className={`absolute top-[0.2vw] left-[0.2vw] w-[1vw] h-[1vw] bg-white rounded-full shadow-sm transition-transform duration-200 ${editData.isActive ? 'translate-x-[1.4vw]' : 'translate-x-0'}`}
                                                />
                                            </div>
                                            <span className={`text-[0.75vw] font-bold ${editData.isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                                                {editData.isActive ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </motion.div>
                    ) : (
                        <motion.div
                            key="view"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-[1.5vw]"
                        >

                            <div>
                                <h4 className={`${labelClass} mb-2`}>Raw Content Data</h4>
                                <div className="grid grid-cols-2 gap-[0.75vw]">
                                    {Object.entries(qr.content || {}).map(([key, value]) => {
                                        const displayValue = typeof value === 'boolean' 
                                            ? (value ? 'Yes' : 'No') 
                                            : (typeof value === 'object' && value !== null 
                                                ? (Array.isArray(value) ? `${value.length} Items` : 'Object Data') 
                                                : (value || '—'));
                                        
                                        return (
                                            <div key={key} className="flex flex-col p-[0.75vw] bg-white border border-slate-100 rounded-lg">
                                                <span className="text-[0.6vw] font-bold text-slate-400 uppercase">{key}</span>
                                                <span className="text-[0.8vw] text-slate-800 break-all font-medium">{displayValue}</span>
                                            </div>
                                        );
                                    })}

                                </div>
                            </div>

                            <div className="flex gap-[1vw]">
                                <div className="flex-1 p-[1vw] border border-slate-100 rounded-lg">
                                    <h4 className={labelClass}>Colors</h4>
                                    <div className="flex gap-4 mt-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded border" style={{ backgroundColor: qr.customization?.foregroundColor }} />
                                            <span className="text-[0.7vw] font-mono text-slate-500">{qr.customization?.foregroundColor}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded border" style={{ backgroundColor: qr.customization?.backgroundColor }} />
                                            <span className="text-[0.7vw] font-mono text-slate-500">{qr.customization?.backgroundColor}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 p-[1vw] border border-slate-100 rounded-lg">
                                    <h4 className={labelClass}>Style</h4>
                                    <p className="text-[0.8vw] font-bold text-slate-700 mt-1 capitalize">{qr.customization?.dotStyle || 'Square'} Dots</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDetail;
