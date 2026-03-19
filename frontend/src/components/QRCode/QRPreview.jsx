import React, { useEffect, useRef, useMemo } from 'react';
import QRCodeStyling from 'qr-code-styling';

const QRPreview = ({ customization = {}, content = {}, type = 'url' }) => {
  const {
    foregroundColor = '#000000',
    backgroundColor = '#FFFFFF',
    errorCorrectionLevel = 'M',
    logo = {},
    margin = 4,
    dotStyle = 'square',
    cornerStyle = 'square',
    frame = {},
  } = customization;

  const qrRef = useRef(null);
  const qrCode = useRef(null);

  // Map our dot styles to qr-code-styling types
  const getDotType = (style) => {
    switch (style) {
      case 'dots': return 'dots';
      case 'rounded': return 'rounded';
      case 'classy': return 'classy';
      case 'extra-rounded': return 'extra-rounded';
      default: return 'square';
    }
  };

  // Map our corner styles to qr-code-styling types
  const getCornerType = (style) => {
    switch (style) {
      case 'dot': return 'dot';
      case 'extra-rounded': return 'extra-rounded';
      default: return 'square';
    }
  };

  // Generate preview content string
  const previewData = useMemo(() => {
    const generateVCardStr = (data) => {
      let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
      if (data.firstName || data.lastName) {
        vcard += `N:${data.lastName || ''};${data.firstName || ''}\n`;
        vcard += `FN:${data.firstName || ''} ${data.lastName || ''}\n`;
      }
      if (data.organization) vcard += `ORG:${data.organization}\n`;
      if (data.title) vcard += `TITLE:${data.title}\n`;
      if (data.email) vcard += `EMAIL:${data.email}\n`;
      if (data.phone) vcard += `TEL;TYPE=WORK:${data.phone}\n`;
      if (data.mobile) vcard += `TEL;TYPE=CELL:${data.mobile}\n`;
      vcard += 'END:VCARD';
      return vcard;
    };

    const generate = (type, data) => {
        if (!data) return 'https://example.com';
        switch (type) {
            case 'url': return data.target || data.url || 'https://example.com';
            case 'text': return data.content || data.text || 'Sample Text';
            case 'email': return `mailto:${data.address || data.email || data.to || ''}?subject=${encodeURIComponent(data.subject || '')}&body=${encodeURIComponent(data.body || '')}`;
            case 'sms': return `sms:${data.phone || ''}${data.message ? `?body=${encodeURIComponent(data.message)}` : ''}`;
            case 'wifi': return `WIFI:T:${data.encryption || 'WPA'};S:${data.ssid || ''};P:${data.password || ''};H:${data.hidden ? 'true' : 'false'};;`;
            case 'location': {
                const query = [data.address, data.postalCode].filter(Boolean).join(' ');
                return query ? `https://maps.google.com/?q=${encodeURIComponent(query)}` : 'https://maps.google.com/';
            }
            case 'vcard': return generateVCardStr(data);
            default: return 'https://example.com';
        }
    };
    return generate(type, content);
  }, [type, content]);

  useEffect(() => {
    if (!qrRef.current) return;

    // Initialize the QR code if it doesn't exist
    if (!qrCode.current) {
      qrCode.current = new QRCodeStyling({
        width: 1000,
        height: 1000,
        type: 'svg',
        data: previewData,
        image: logo.url || '',
        dotsOptions: { color: foregroundColor, type: getDotType(dotStyle) },
        backgroundOptions: { color: backgroundColor },
        cornersSquareOptions: { type: getCornerType(cornerStyle), color: foregroundColor },
        cornersDotOptions: { type: getCornerType(cornerStyle), color: foregroundColor },
        imageOptions: {
            crossOrigin: "anonymous",
            margin: 10,
            imageSize: logo.size || 0.3
        },
        qrOptions: { errorCorrectionLevel: errorCorrectionLevel },
        margin: margin * 5, // Scaling up margin
      });
      qrCode.current.append(qrRef.current);
    } else {
      // Update existing QR code
      qrCode.current.update({
        data: previewData,
        image: logo.url || '',
        dotsOptions: { color: foregroundColor, type: getDotType(dotStyle) },
        backgroundOptions: { color: backgroundColor },
        cornersSquareOptions: { type: getCornerType(cornerStyle), color: foregroundColor },
        cornersDotOptions: { type: getCornerType(cornerStyle), color: foregroundColor },
        imageOptions: {
            imageSize: logo.size || 0.3
        },
        qrOptions: { errorCorrectionLevel: errorCorrectionLevel },
        margin: margin * 5,
      });
    }
  }, [previewData, foregroundColor, backgroundColor, dotStyle, cornerStyle, logo.url, logo.size, errorCorrectionLevel, margin]);

  return (
    <div className="flex flex-col items-center">
      <div
        className={`
          p-[1vw] rounded-[0.75vw] qr-preview-container flex items-center justify-center
          ${frame.style !== 'none' ? 'bg-white shadow-xl' : ''}
        `}
        style={{
          backgroundColor: frame.style !== 'none' ? frame.backgroundColor : 'transparent',
          width: 'fit-content'
        }}
      >
        <div className="flex flex-col items-center">
          {/* Frame Top Text */}
          {frame.style === 'banner' && frame.text && (
            <div 
              className="text-center mb-[0.75vw] text-[1.1vw] font-bold uppercase tracking-wide"
              style={{ color: frame.textColor }}
            >
              {frame.text}
            </div>
          )}

          {/* QR Code Container with responsive width */}
          <div 
            ref={qrRef} 
            className="qr-code-wrapper" 
            style={{ 
                width: '18vw', 
                height: '18vw',
                backgroundColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
            }}
          />

          {/* Frame Bottom Text */}
          {(frame.style === 'simple' || frame.style === 'rounded') && frame.text && (
            <div 
              className="text-center mt-[0.75vw] text-[1.1vw] font-bold uppercase tracking-wide"
              style={{ color: frame.textColor }}
            >
              {frame.text}
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .qr-code-wrapper svg {
          width: 100% !important;
          height: 100% !important;
        }
      `}} />

      <p className="text-[0.75vw] text-slate-500 mt-[1.5vw] text-center font-medium">
        Live High-Quality Preview
      </p>
    </div>
  );
};

export default QRPreview;