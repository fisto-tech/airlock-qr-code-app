import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiGlobe, FiMapPin, FiDownload, FiFile, FiLink, FiExternalLink } from 'react-icons/fi';
import api from '../services/api';

const ScanPage = () => {
  const { code } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrData, setQRData] = useState(null);
  const [content, setContent] = useState(null);

  useEffect(() => {
    fetchContent();
  }, [code]);

  // After page loads, silently request browser GPS and report to backend
  // This patches the scan record for local/private-IP scans where geoip-lite returns nothing
  const reportGPSLocation = async () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          await api.post(`/scan/${code}/location`, { latitude, longitude });
        } catch { /* non-critical — ignore */ }
      },
      () => { /* user denied — that's fine */ },
      { timeout: 8000, maximumAge: 300000 }
    );
  };

  const fetchContent = async () => {
    try {
      const response = await api.get(`/scan/${code}/content`);
      setQRData(response.data.qrCode);
      setContent(response.data.content);
      // After content loads successfully, report GPS in the background
      reportGPSLocation();
    } catch (error) {
      setError(error.response?.data?.message || 'QR code not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12" style={{ borderBottom: '2px solid #2563eb' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Oops!</h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  // Render based on content type
  const renderContent = () => {
    switch (qrData?.type) {
      case 'vcard':
        return <VCardViewer data={content} />;
      case 'text':
        return <TextViewer data={content} />;
      case 'file':
        // Handle different file types
        if (content?.fileType === 'image') {
          return <ImageViewer data={content} />;
        } else if (content?.fileType === 'video') {
          return <VideoViewer data={content} />;
        } else if (content?.fileType === 'audio') {
          return <AudioViewer data={content} />;
        } else if (content?.fileType === 'document') {
          return <DocumentViewer data={content} />;
        }
        return <FileViewer data={content} />;
      case 'multilink':
        return <MultiLinkViewer data={content} />;
      case 'url':
        return <URLViewer data={content} />;
      default:
        return <DefaultViewer data={content} type={qrData?.type} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {renderContent()}
        
        {/* Powered By Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-slate-400">
            Powered by <span className="font-semibold" style={{ color: '#2563eb' }}>QR Generator</span>
          </p>
        </div>
      </div>
    </div>
  );
};

// VCard Viewer Component
const VCardViewer = ({ data }) => {
  const downloadVCard = () => {
    let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
    if (data.firstName || data.lastName) {
      vcard += `FN:${data.firstName || ''} ${data.lastName || ''}\n`;
    }
    if (data.email) vcard += `EMAIL:${data.email}\n`;
    if (data.phone) vcard += `TEL:${data.phone}\n`;
    if (data.organization) vcard += `ORG:${data.organization}\n`;
    if (data.website) vcard += `URL:${data.website}\n`;
    vcard += 'END:VCARD';

    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.firstName || 'contact'}.vcf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 text-center text-white" style={{ backgroundImage: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)' }}>
        <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center mb-4">
          {data.photo ? (
            <img src={data.photo} alt="Profile" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-4xl font-bold" style={{ color: '#2563eb' }}>
              {(data.firstName?.charAt(0) || '') + (data.lastName?.charAt(0) || '')}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold">{`${data.firstName || ''} ${data.lastName || ''}`}</h1>
        {data.title && <p className="text-white/80">{data.title}</p>}
        {data.organization && <p className="text-white/80">{data.organization}</p>}
      </div>

      {/* Contact Details */}
      <div className="p-6 space-y-4">
        {data.email && (
          <a href={`mailto:${data.email}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <FiMail className="text-xl" style={{ color: '#2563eb' }} />
            <span className="text-slate-700">{data.email}</span>
          </a>
        )}
        {data.phone && (
          <a href={`tel:${data.phone}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <FiPhone className="text-xl" style={{ color: '#2563eb' }} />
            <span className="text-slate-700">{data.phone}</span>
          </a>
        )}
        {data.website && (
          <a href={data.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <FiGlobe className="text-xl" style={{ color: '#2563eb' }} />
            <span className="text-slate-700">{data.website}</span>
          </a>
        )}
        {data.address && (
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <FiMapPin className="text-xl flex-shrink-0 mt-0.5" style={{ color: '#2563eb' }} />
            <span className="text-slate-700">
              {[data.address.street, data.address.city, data.address.state, data.address.zip, data.address.country]
                .filter(Boolean)
                .join(', ')}
            </span>
          </div>
        )}

        {/* Save Contact Button */}
        <button
          onClick={downloadVCard}
          className="w-full flex items-center justify-center gap-2 py-3 text-white rounded-lg transition-colors font-medium"
          style={{ backgroundColor: '#2563eb' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
        >
          <FiDownload />
          Save Contact
        </button>
      </div>
    </div>
  );
};

// Text Viewer Component
const TextViewer = ({ data }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6">
    <h2 className="text-lg font-semibold text-slate-800 mb-4">Message</h2>
    <div className="p-4 bg-slate-50 rounded-lg">
      <p className="text-slate-700 whitespace-pre-wrap">{data.content}</p>
    </div>
  </div>
);

// File Viewer Component
const FileViewer = ({ data }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6">
    <div className="text-center">
      <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#eff6ff' }}>
        <FiFile className="text-3xl" style={{ color: '#2563eb' }} />
      </div>
      <h2 className="text-xl font-semibold text-slate-800 mb-2">{data.fileName}</h2>
      <p className="text-slate-500 mb-6">{data.mimeType}</p>
      
      {/* Preview for images */}
      {data.fileType === 'image' && (
        <img src={data.url} alt={data.fileName} className="w-full rounded-lg mb-6" />
      )}
      
      {/* Preview for videos */}
      {data.fileType === 'video' && (
        <video src={data.url} controls className="w-full rounded-lg mb-6" />
      )}
      
      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 px-6 py-3 text-white rounded-lg transition-colors font-medium"
        style={{ backgroundColor: '#2563eb' }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
      >
        <FiDownload />
        Download File
      </a>
    </div>
  </div>
);

// Multi-Link Viewer Component
const MultiLinkViewer = ({ data }) => (
  <div 
    className="rounded-2xl shadow-lg p-6"
    style={{ backgroundColor: data.backgroundColor || '#f8fafc' }}
  >
    {/* Profile */}
    <div className="text-center mb-6">
      {data.avatar && (
        <img src={data.avatar} alt="Profile" className="w-24 h-24 mx-auto rounded-full mb-4 object-cover" />
      )}
      <h1 className="text-2xl font-bold text-slate-800">{data.title}</h1>
      {data.description && <p className="text-slate-600 mt-2">{data.description}</p>}
    </div>

    {/* Links */}
    <div className="space-y-3">
      {data.links?.map((link, index) => (
        <a
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 p-4 rounded-lg transition-transform hover:scale-[1.02]"
          style={{
            backgroundColor: link.backgroundColor || '#3b82f6',
            color: link.textColor || '#ffffff',
          }}
        >
          {link.icon && <img src={link.icon} alt="" className="w-5 h-5" />}
          <span className="font-medium">{link.title}</span>
          <FiExternalLink className="ml-auto" />
        </a>
      ))}
    </div>

    {/* Social Links */}
    {data.socialLinks?.length > 0 && (
      <div className="flex justify-center gap-4 mt-6">
        {data.socialLinks.map((social, index) => (
          <a
            key={index}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow hover:shadow-md transition-shadow"
          >
            <FiLink className="text-slate-600" />
          </a>
        ))}
      </div>
    )}
  </div>
);

// Default Viewer Component
const DefaultViewer = ({ data, type }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
    <h2 className="text-xl font-semibold text-slate-800 mb-4">{type} Content</h2>
    <pre className="p-4 bg-slate-50 rounded-lg text-left overflow-auto text-sm">
      {JSON.stringify(data, null, 2)}
    </pre>
  </div>
);

// Image Viewer Component
const ImageViewer = ({ data }) => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
    <div className="p-6">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">{data.fileName}</h2>
      <img 
        src={data.url} 
        alt={data.fileName} 
        className="w-full rounded-lg mb-6 max-h-96 object-contain"
      />
      <div className="space-y-3">
        <p className="text-slate-600 text-sm"><span className="font-semibold">Type:</span> {data.mimeType}</p>
        <p className="text-slate-600 text-sm"><span className="font-semibold">Size:</span> {formatBytes(data.fileSize)}</p>
        <a
          href={data.url}
          download={data.fileName}
          className="block w-full py-3 px-4 text-center text-white rounded-lg transition-colors font-medium"
          style={{ backgroundColor: '#2563eb' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
        >
          <FiDownload className="inline mr-2" />
          Download Image
        </a>
      </div>
    </div>
  </div>
);

// Video Viewer Component
const VideoViewer = ({ data }) => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
    <div className="p-6">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">{data.fileName}</h2>
      <video 
        src={data.url} 
        controls 
        className="w-full rounded-lg mb-6 max-h-96 bg-black"
      />
      <div className="space-y-3">
        <p className="text-slate-600 text-sm"><span className="font-semibold">Type:</span> {data.mimeType}</p>
        <p className="text-slate-600 text-sm"><span className="font-semibold">Size:</span> {formatBytes(data.fileSize)}</p>
        <a
          href={data.url}
          download={data.fileName}
          className="block w-full py-3 px-4 text-center text-white rounded-lg transition-colors font-medium"
          style={{ backgroundColor: '#2563eb' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
        >
          <FiDownload className="inline mr-2" />
          Download Video
        </a>
      </div>
    </div>
  </div>
);

// Audio Viewer Component
const AudioViewer = ({ data }) => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
    <div className="p-6">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">{data.fileName}</h2>
      <audio 
        src={data.url} 
        controls 
        className="w-full mb-6"
      />
      <div className="space-y-3">
        <p className="text-slate-600 text-sm"><span className="font-semibold">Type:</span> {data.mimeType}</p>
        <p className="text-slate-600 text-sm"><span className="font-semibold">Size:</span> {formatBytes(data.fileSize)}</p>
        <a
          href={data.url}
          download={data.fileName}
          className="block w-full py-3 px-4 text-center text-white rounded-lg transition-colors font-medium"
          style={{ backgroundColor: '#2563eb' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
        >
          <FiDownload className="inline mr-2" />
          Download Audio
        </a>
      </div>
    </div>
  </div>
);

// Document Viewer Component
const DocumentViewer = ({ data }) => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
    <div className="p-6">
      <div className="text-center mb-6">
        <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#eff6ff' }}>
          <FiFile className="text-3xl" style={{ color: '#2563eb' }} />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">{data.fileName}</h2>
        <p className="text-slate-600 text-sm">{data.mimeType}</p>
      </div>
      <div className="space-y-3">
        <p className="text-slate-600 text-sm"><span className="font-semibold">Size:</span> {formatBytes(data.fileSize)}</p>
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-3 px-4 text-center text-white rounded-lg transition-colors font-medium mb-3"
          style={{ backgroundColor: '#2563eb' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
        >
          <FiExternalLink className="inline mr-2" />
          Open Document
        </a>
        <a
          href={data.url}
          download={data.fileName}
          className="block w-full py-3 px-4 text-center text-slate-700 border border-slate-300 rounded-lg transition-colors font-medium"
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <FiDownload className="inline mr-2" />
          Download
        </a>
      </div>
    </div>
  </div>
);

// URL Viewer Component
const URLViewer = ({ data }) => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
    <div className="p-6 text-center">
      <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#eff6ff' }}>
        <FiLink className="text-3xl" style={{ color: '#2563eb' }} />
      </div>
      <h2 className="text-xl font-semibold text-slate-800 mb-2">Website Link</h2>
      <p className="text-slate-600 mb-6 break-all">{data.target}</p>
      {data.title && <p className="text-slate-700 font-semibold mb-2">{data.title}</p>}
      {data.description && <p className="text-slate-600 text-sm mb-6">{data.description}</p>}
      <a
        href={data.target}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 px-6 py-3 text-white rounded-lg transition-colors font-medium"
        style={{ backgroundColor: '#2563eb' }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
      >
        <FiExternalLink />
        Visit Website
      </a>
    </div>
  </div>
);

// Helper function to format bytes
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default ScanPage;