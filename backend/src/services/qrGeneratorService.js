import QRCode from 'qrcode';
import sharp from 'sharp';
import { createCanvas, loadImage } from 'canvas';
import fileService from './fileService.js';
import fs from 'fs';
import path from 'path';

class QRGeneratorService {
  
  /**
   * Generate QR code with customization
   */
  async generateQR(content, customization = {}) {
    const {
      foregroundColor = '#000000',
      backgroundColor = '#FFFFFF',
      errorCorrectionLevel = 'M',
      margin = 4,
      width = 1000,
      logo = null,
      dotStyle = 'square',
      frame = null
    } = customization;

    try {
      // Generate base QR code
      const qrOptions = {
        errorCorrectionLevel,
        margin,
        width,
        color: {
          dark: foregroundColor,
          light: backgroundColor
        }
      };

      let qrBuffer;

      // Apply dot styling if not square
      if (dotStyle !== 'square') {
        qrBuffer = await this.applyDotStyle(content, qrOptions, dotStyle, foregroundColor, backgroundColor);
      } else {
        qrBuffer = await QRCode.toBuffer(content, qrOptions);
      }

      // Add logo if provided
      if (logo && logo.url) {
        // If logo.url is a local path, read from filesystem
        let logoPath = logo.url;
        if (logoPath.startsWith('/uploads/')) {
          logoPath = fileService.getFullPath(logoPath.replace('/uploads/', ''));
        }
        qrBuffer = await this.addLogo(qrBuffer, logoPath, logo.size || 0.25);
      }

      // Add frame if provided
      if (frame && frame.style !== 'none') {
        qrBuffer = await this.addFrame(qrBuffer, frame);
      }

      return qrBuffer;
    } catch (error) {
      console.error('QR Generation Error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Apply custom dot styling to QR code
   */
  async applyDotStyle(content, options, style, fgColor, bgColor) {
    const qr = QRCode.create(content, options);
    const { modules } = qr;
    const { size, data } = modules;
    
    // Calculate final image dimension
    const margin = options.margin || 4;
    const width = options.width || 1000;
    const moduleSize = width / (size + margin * 2);
    
    const canvas = createCanvas(width, width);
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, width);

    // Draw modules
    ctx.fillStyle = fgColor;
    const offset = margin * moduleSize;

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const isDark = data[row * size + col];

        if (isDark) {
          const x = offset + col * moduleSize;
          const y = offset + row * moduleSize;
          this.drawModule(ctx, x, y, moduleSize, style);
        }
      }
    }

    return canvas.toBuffer('image/png');
  }

  /**
   * Draw a single QR module with custom style
   */
  drawModule(ctx, x, y, size, style) {
    const padding = size * 0.1;
    const actualSize = size - padding * 2;

    switch (style) {
      case 'dots':
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, actualSize / 2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'rounded':
        this.roundRect(ctx, x + padding, y + padding, actualSize, actualSize, actualSize * 0.3);
        break;

      case 'classy':
        this.roundRect(ctx, x + padding, y + padding, actualSize, actualSize, actualSize * 0.15);
        break;

      case 'extra-rounded':
        this.roundRect(ctx, x + padding, y + padding, actualSize, actualSize, actualSize * 0.5);
        break;

      default:
        ctx.fillRect(x + padding, y + padding, actualSize, actualSize);
    }
  }

  /**
   * Draw rounded rectangle
   */
  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Add logo to center of QR code
   */
  async addLogo(qrBuffer, logoPath, logoSizeRatio) {
    const qrImage = sharp(qrBuffer);
    const metadata = await qrImage.metadata();
    const qrSize = metadata.width;

    const logoSize = Math.floor(qrSize * logoSizeRatio);
    const logoPosition = Math.floor((qrSize - logoSize) / 2);

    // Load logo
    let logoBuffer;
    if (logoPath.startsWith('http')) {
      const response = await fetch(logoPath);
      logoBuffer = Buffer.from(await response.arrayBuffer());
    } else if (logoPath.startsWith('data:')) {
      logoBuffer = Buffer.from(logoPath.split(',')[1], 'base64');
    } else {
      // Read from local file
      logoBuffer = fs.readFileSync(logoPath);
    }

    // Resize logo
    const resizedLogo = await sharp(logoBuffer)
      .resize(logoSize, logoSize, { 
        fit: 'contain', 
        background: { r: 0, g: 0, b: 0, alpha: 0 } 
      })
      .toBuffer();

    // Create a clear background for logo (with optional padding)
    const logoLayer = await sharp({
      create: {
        width: logoSize + 10,
        height: logoSize + 10,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      }
    })
      .composite([{ input: resizedLogo, left: 5, top: 5 }])
      .png()
      .toBuffer();

    // Composite logo onto QR code
    return await sharp(qrBuffer)
      .composite([{
        input: logoLayer,
        left: logoPosition - 5,
        top: logoPosition - 5
      }])
      .png()
      .toBuffer();
  }

  /**
   * Add frame around QR code
   */
  async addFrame(qrBuffer, frameConfig) {
    const { style, text, textColor = '#000000', backgroundColor = '#FFFFFF' } = frameConfig;

    const qrImage = sharp(qrBuffer);
    const metadata = await qrImage.metadata();
    const qrSize = metadata.width;

    const padding = 50;
    const textHeight = text ? 80 : 0;
    const canvasWidth = qrSize + padding * 2;
    const canvasHeight = qrSize + padding * 2 + textHeight;

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.fillStyle = backgroundColor;

    if (style === 'rounded') {
      this.roundRect(ctx, 0, 0, canvasWidth, canvasHeight, 20);
    } else {
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Draw QR code
    const qrImg = await loadImage(qrBuffer);
    ctx.drawImage(qrImg, padding, padding, qrSize, qrSize);

    // Draw text
    if (text) {
      ctx.fillStyle = textColor;
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(text, canvasWidth / 2, canvasHeight - 25);
    }

    // Add border for banner style
    if (style === 'banner') {
      ctx.strokeStyle = textColor;
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, canvasWidth - 20, canvasHeight - 20);
    }

    return canvas.toBuffer('image/png');
  }

  /**
   * Save QR code image to file system
   */
  async saveQRCode(qrBuffer, userId) {
    const qrDir = path.join(fileService.uploadsDir, 'qr-codes', userId);
    
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }

    const fileName = `qr-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
    const filePath = path.join(qrDir, fileName);
    
    fs.writeFileSync(filePath, qrBuffer);

    const relativePath = path.join('qr-codes', userId, fileName);
    
    return {
      url: `/uploads/${relativePath.replace(/\\/g, '/')}`,
      path: relativePath.replace(/\\/g, '/'),
      fileName: fileName,
    };
  }

  /**
   * Generate QR content string based on type
   */
  generateContentString(type, data) {
    switch (type) {
      case 'url':
        return data.target || data.url;

      case 'vcard':
        return this.generateVCard(data);

      case 'text':
        return data.content || data.text;

      case 'wifi':
        return `WIFI:T:${data.encryption || 'WPA'};S:${data.ssid};P:${data.password};H:${data.hidden ? 'true' : 'false'};;`;

      case 'email':
        const emailTo = data.email || data.to || data.address || '';
        return `mailto:${emailTo}?subject=${encodeURIComponent(data.subject || '')}&body=${encodeURIComponent(data.body || '')}`;

      case 'sms':
        const smsTo = data.phoneNumber || data.phone || '';
        return `sms:${smsTo}${data.message ? `?body=${encodeURIComponent(data.message)}` : ''}`;

      case 'location': {
        const addressQuery = [data.address, data.postalCode].filter(Boolean).join(' ');
        return `https://maps.google.com/?q=${encodeURIComponent(addressQuery)}`;
      }

      default:
        return data.toString();
    }
  }

  /**
   * Generate vCard string
   */
  generateVCard(data) {
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
    if (data.fax) vcard += `TEL;TYPE=FAX:${data.fax}\n`;
    if (data.website) vcard += `URL:${data.website}\n`;

    if (data.address) {
      const addr = data.address;
      vcard += `ADR;TYPE=WORK:;;${addr.street || ''};${addr.city || ''};${addr.state || ''};${addr.zip || ''};${addr.country || ''}\n`;
    }

    if (data.birthday) {
      const bday = new Date(data.birthday);
      vcard += `BDAY:${bday.toISOString().split('T')[0].replace(/-/g, '')}\n`;
    }

    if (data.notes) vcard += `NOTE:${data.notes}\n`;
    if (data.photo) vcard += `PHOTO;VALUE=URI:${data.photo}\n`;

    vcard += 'END:VCARD';
    return vcard;
  }

  /**
   * Generate QR code as different formats
   */
  async generateAsFormat(content, customization, format = 'png') {
    const qrBuffer = await this.generateQR(content, customization);

    switch (format) {
      case 'svg':
        return await QRCode.toString(content, {
          type: 'svg',
          color: {
            dark: customization.foregroundColor || '#000000',
            light: customization.backgroundColor || '#FFFFFF'
          }
        });

      case 'jpeg':
      case 'jpg':
        return await sharp(qrBuffer).jpeg({ quality: 90 }).toBuffer();

      case 'webp':
        return await sharp(qrBuffer).webp({ quality: 90 }).toBuffer();

      default:
        return qrBuffer;
    }
  }
}

export default new QRGeneratorService();