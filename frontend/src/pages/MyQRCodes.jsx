import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  FiSearch,
  FiFilter,
  FiGrid,
  FiList,
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiCopy,
  FiDownload,
  FiExternalLink,
  FiBarChart2,
  FiPlus,
  FiChevronLeft,
  FiChevronRight,
  FiTrendingUp,
  FiClock,
  FiActivity,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { qrCodeAPI } from '../services/api';

const qrTypes = [
  { id: 'all', label: 'All Types' },
  { id: 'url', label: 'URL' },
  { id: 'vcard', label: 'vCard' },
  // { id: 'text', label: 'Text' },
  { id: 'file', label: 'File' },
  // { id: 'multilink', label: 'Multi-Link' },
  // { id: 'wifi', label: 'WiFi' },
  { id: 'email', label: 'Email' },
  { id: 'sms', label: 'SMS' },
  { id: 'location', label: 'Location' },
];

const sortOptions = [
  { id: '-createdAt', label: 'Newest First', icon: FiClock },
  { id: 'createdAt', label: 'Oldest First', icon: FiActivity },
  { id: '-scanCount', label: 'Most Scanned', icon: FiTrendingUp },
];

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4001';

const QRCodeCard = React.memo(({ qr, viewMode, navigate, activeMenu, setActiveMenu, handleDownload, handleDuplicate, handleDelete }) => {
  const imgSrc = qr.qrImageUrl
    ? (qr.qrImageUrl.startsWith('http') ? qr.qrImageUrl : `${BACKEND_URL}${qr.qrImageUrl}`)
    : null;

  const cardRef = useRef(null);
  const [menuDirection, setMenuDirection] = useState('down');

  // Detect if menu should open upwards
  useEffect(() => {
    if (activeMenu === qr._id && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      
      // If less than 200px space below, show menu above
      if (spaceBelow < 200) {
        setMenuDirection('up');
      } else {
        setMenuDirection('down');
      }
    }
  }, [activeMenu, qr._id]);

  // Handle click outside to close menu without using a fixed overlay
  useEffect(() => {
    const handleClickOutside = (event) => {
        if (activeMenu === qr._id && cardRef.current && !cardRef.current.contains(event.target)) {
            setActiveMenu(null);
        }
    };
    if (activeMenu === qr._id) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenu, qr._id, setActiveMenu]);

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        ref={cardRef}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="bg-white rounded-[0.5vw] border border-slate-200 p-[0.6vw] flex items-center gap-[1vw] hover:shadow-sm transition-shadow group relative"
      >
        <Link to={`/qrcodes/${qr._id}`} className="shrink-0">
          <div className="w-[3.5vw] h-[3.5vw] bg-slate-50 rounded-[0.3vw] p-[0.3vw] flex items-center justify-center">
            {imgSrc ? (
              <img src={imgSrc} alt={qr.title} className="w-full h-full object-contain" />
            ) : (
              <FiGrid className="text-[1.5vw] text-slate-300" />
            )}
          </div>
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-col">
            <h3 className="text-[0.85vw] font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
              {qr.title}
            </h3>
            <span className="text-[0.6vw] text-slate-400 font-medium uppercase mt-[0.1vw]">
              {qrTypes.find(t => t.id === qr.type)?.label || qr.type}
            </span>
          </div>
        </div>

        <div className="px-[1vw] flex items-center gap-[1.5vw]">
          <div className="flex flex-col items-end">
            <span className="text-[0.8vw] font-bold text-slate-700">{qr.scanCount}</span>
            <span className="text-[0.6vw] text-slate-400 uppercase">Scans</span>
          </div>
          <div className={`px-[0.6vw] py-[0.2vw] rounded-full text-[0.6vw] font-bold uppercase tracking-wider ${qr.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
            {qr.isActive ? 'Active' : 'Inactive'}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === qr._id ? null : qr._id)}
            className="p-[0.4vw] text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-[0.3vw] cursor-pointer"
          >
            <FiMoreVertical className="text-[1vw]" />
          </button>
          <AnimatePresence>
            {activeMenu === qr._id && (
              <QRCodeMenu 
                 qr={qr} 
                 direction={menuDirection}
                 navigate={navigate} 
                 setActiveMenu={setActiveMenu} 
                 handleDownload={handleDownload} 
                 handleDuplicate={handleDuplicate} 
                 handleDelete={handleDelete} 
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-[0.75vw] border border-slate-200 hover:shadow-md transition-shadow group relative text-left"
    >
      <Link to={`/qrcodes/${qr._id}`} className="block">
        <div className="aspect-square bg-slate-50 p-[1vw] flex items-center justify-center">
          {imgSrc ? (
            <img src={imgSrc} alt={qr.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
          ) : (
            <FiGrid className="text-[3vw] text-slate-300" />
          )}
        </div>
      </Link>

      <div className="p-[0.75vw] border-t border-slate-100">
        <div className="flex items-start justify-between mb-[0.5vw]">
          <div className="flex-1 min-w-0">
            <h3 className="text-[0.85vw] font-semibold text-slate-800 truncate">{qr.title}</h3>
            <p className="text-[0.6vw] text-slate-400 font-medium uppercase mt-[0.1vw]">
              {qrTypes.find(t => t.id === qr.type)?.label || qr.type}
            </p>
          </div>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === qr._id ? null : qr._id); }}
              className="p-[0.4vw] text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-[0.3vw] cursor-pointer"
            >
              <FiMoreVertical className="text-[1vw]" />
            </button>
            <AnimatePresence>
              {activeMenu === qr._id && (
                <QRCodeMenu 
                    qr={qr} 
                    direction={menuDirection}
                    navigate={navigate} 
                    setActiveMenu={setActiveMenu} 
                    handleDownload={handleDownload} 
                    handleDuplicate={handleDuplicate} 
                    handleDelete={handleDelete} 
                />
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex items-center justify-between text-[0.7vw]">
          <div className="flex items-center gap-[0.3vw] text-slate-500 text-[0.65vw]">
            <FiBarChart2 className="text-[0.8vw]" />
            {qr.scanCount} scans
          </div>
          <span className={`px-[0.4vw] py-[0.15vw] rounded-full text-[0.6vw] font-bold uppercase ${qr.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
            {qr.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    </motion.div>
  );
});

const QRCodeMenu = ({ qr, direction, navigate, setActiveMenu, handleDownload, handleDuplicate, handleDelete }) => {
    const positionClass = direction === 'up' ? 'bottom-full mb-[0.25vw]' : 'top-full mt-[0.25vw]';
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: direction === 'up' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: direction === 'up' ? 10 : -10 }}
            className={`absolute right-0 ${positionClass} w-[10vw] bg-white rounded-[0.4vw] shadow-xl border border-slate-200 z-50 overflow-hidden`}
        >
            {qr.isDynamic && (
                <button onClick={() => { navigate(`/qrcodes/${qr._id}`); setActiveMenu(null); }} className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.5vw] text-[0.75vw] text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
                    <FiEdit className="text-[0.9vw]" /> Edit
                </button>
            )}
            <button onClick={() => handleDownload(qr._id, qr.title)} className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.5vw] text-[0.75vw] text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
            <FiDownload className="text-[0.9vw]" /> Download
            </button>
            <button onClick={() => handleDuplicate(qr._id)} className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.5vw] text-[0.75vw] text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
            <FiCopy className="text-[0.9vw]" /> Duplicate
            </button>
            <button onClick={() => window.open(qr.shortUrl, '_blank')} className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.5vw] text-[0.75vw] text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
            <FiExternalLink className="text-[0.9vw]" /> Preview
            </button>
            <hr className="border-slate-100" />
            <button onClick={() => handleDelete(qr._id)} className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.5vw] text-[0.75vw] text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
            <FiTrash2 className="text-[0.9vw]" /> Delete
            </button>
        </motion.div>
    );
};

const MyQRCodes = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  
  const [qrCodes, setQRCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('-createdAt');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [activeMenu, setActiveMenu] = useState(null);

  useEffect(() => {
    fetchQRCodes();
  }, [pagination.page, typeFilter, searchQuery, sortBy]);

  const fetchQRCodes = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sort: sortBy,
        ...(searchQuery && { search: searchQuery }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
      };

      const response = await qrCodeAPI.getAll(params);
      setQRCodes(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
        totalPages: response.data.totalPages,
      }));
    } catch (error) {
      toast.error('Failed to fetch QR codes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this QR code?')) return;
    try {
      await qrCodeAPI.delete(id);
      toast.success('QR code deleted successfully');
      fetchQRCodes();
    } catch (error) {
      toast.error('Failed to delete QR code');
    }
    setActiveMenu(null);
  };

  const handleDuplicate = async (id) => {
    try {
      await qrCodeAPI.duplicate(id);
      toast.success('QR code duplicated successfully');
      fetchQRCodes();
    } catch (error) {
      toast.error('Failed to duplicate QR code');
    }
    setActiveMenu(null);
  };

  const handleDownload = async (id, title) => {
    try {
      const response = await qrCodeAPI.download(id, 'png', 1000);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title}.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('QR code downloaded');
    } catch (error) {
      toast.error('Failed to download QR code');
    }
    setActiveMenu(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Refined Top Bar */}
      <div className="flex items-center gap-[1.2vw] bg-white py-[0.5vw] px-[1vw] rounded-[0.6vw] border border-slate-200 mb-[0.8vw] flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
            <div className="bg-blue-50 p-2 rounded-lg">
                <FiGrid className="text-blue-600 text-[1.1vw]" />
            </div>
            <div className="flex flex-col">
                <span className="text-[0.85vw] font-bold text-slate-800 leading-none">{pagination.total}</span>
                <span className="text-[0.65vw] text-slate-400 font-medium uppercase mt-0.5">QR Codes</span>
            </div>
        </div>

        <div className="h-8 w-px bg-slate-50 mx-2" />

        {/* Filters Group */}
        <div className="flex items-center gap-4">
            {/* Type Filter */}
            <div className="flex flex-col gap-0.5">
                <label className="text-[0.6vw] font-bold text-slate-400 uppercase ml-1">Type</label>
                <div className="flex items-center gap-2 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 cursor-pointer">
                    <FiFilter className="text-[0.8vw] text-slate-400" />
                    <select
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value); setPagination(p => ({...p, page: 1})); }}
                        className="text-[0.75vw] font-medium text-slate-600 bg-transparent focus:outline-none min-w-[7vw] cursor-pointer"
                    >
                        {qrTypes.map((type) => (
                        <option key={type.id} value={type.id}>{type.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Sort Filter */}
            <div className="flex flex-col gap-0.5">
                <label className="text-[0.6vw] font-bold text-slate-400 uppercase ml-1">Sort By</label>
                <div className="flex items-center gap-2 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 cursor-pointer">
                    <FiActivity className="text-[0.8vw] text-slate-400" />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="text-[0.75vw] font-medium text-slate-600 bg-transparent focus:outline-none min-w-[8vw] cursor-pointer"
                    >
                        {sortOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>

        <div className="flex-1" />

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg gap-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-[0.35vw] rounded-md transition-all cursor-pointer ${
              viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FiGrid className="text-[1vw]" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-[0.35vw] rounded-md transition-all cursor-pointer ${
              viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FiList className="text-[1vw]" />
          </button>
        </div>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto pr-[0.4vw] custom-scrollbar mb-[0.6vw]">
        {loading ? (
          <div className="flex items-center justify-center h-[30vh]">
            <div className="animate-spin rounded-full h-[2.5vw] w-[2.5vw]" style={{ borderBottom: '2px solid #2563eb' }} />
          </div>
        ) : qrCodes.length > 0 ? (
          <motion.div
            layout
            className={viewMode === 'grid' ? 'grid grid-cols-4 gap-[1vw]' : 'space-y-[0.6vw]'}
          >
            <AnimatePresence mode="popLayout">
              {qrCodes.map((qr) => (
                <QRCodeCard 
                    key={qr._id} 
                    qr={qr} 
                    viewMode={viewMode}
                    navigate={navigate}
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                    handleDownload={handleDownload}
                    handleDuplicate={handleDuplicate}
                    handleDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-[5vw] bg-white rounded-[0.75vw] border border-slate-200">
            <FiActivity className="mx-auto text-[4vw] text-slate-100 mb-[1vw]" />
            <p className="text-[1.1vw] font-semibold text-slate-800">No results found</p>
            <p className="text-[0.85vw] text-slate-500 mt-1">
              "We couldn't find any QR codes matching your search."
            </p>
          </div>
        )}
      </div>

      {/* Refined Bottom Pagination Bar - Reduced Height */}
      <div className="bg-white border-t border-slate-100 py-[0.45vw] px-[1.2vw] flex items-center justify-between flex-shrink-0 rounded-b-[0.6vw] shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
        <div className="text-[0.7vw] text-slate-400 font-medium tracking-tight">
            Showing <span className="text-slate-700 font-bold">{qrCodes.length}</span> of <span className="text-slate-700 font-bold">{pagination.total}</span> items
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center gap-[0.35vw]">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="p-[0.35vw] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <FiChevronLeft className="text-[0.85vw]" />
            </button>
            
            <div className="flex items-center gap-[0.2vw] mx-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                        key={page}
                        onClick={() => setPagination(prev => ({ ...prev, page }))}
                        className={`min-w-[1.8vw] h-[1.8vw] text-[0.75vw] font-bold rounded-lg transition-all cursor-pointer ${
                            pagination.page === page
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        {page}
                    </button>
                ))}
            </div>
            
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="p-[0.35vw] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <FiChevronRight className="text-[0.85vw]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyQRCodes;