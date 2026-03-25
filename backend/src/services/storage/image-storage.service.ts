/**
 * 图片持久化存储服务
 * 将 Wanx API 生成的临时图片下载到本地或阿里云 OSS
 */

import fs from 'fs';
import path from 'path';
import { AppError } from '../../utils/AppError';
import prisma from '../../utils/prisma';

// Dynamic import for QR code
let qrcode: typeof import('qrcode') | null = null;
async function getQrCode() {
  if (!qrcode) {
    try {
      qrcode = await import('qrcode');
    } catch {
      // qrcode not available
    }
  }
  return qrcode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AliOSS = any;

export interface StorageConfig {
  type: 'local' | 'oss';
  local?: {
    basePath: string;
    baseUrl: string;
  };
  oss?: {
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
    region: string;
    endpoint?: string;
  };
}

export interface DownloadResult {
  localPath: string;
  filename: string;
  url: string;
  size?: number;
  width?: number;
  height?: number;
  mimeType?: string;
}

export class StorageService {
  private storageConfig: StorageConfig;

  constructor() {
    const storageType = process.env.STORAGE_TYPE || 'local';

    if (storageType === 'oss') {
      this.storageConfig = {
        type: 'oss',
        oss: {
          accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
          accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
          bucket: process.env.OSS_BUCKET || '',
          region: process.env.OSS_REGION || 'oss-cn-hangzhou',
          endpoint: process.env.OSS_ENDPOINT,
        },
      };
    } else {
      this.storageConfig = {
        type: 'local',
        local: {
          basePath: process.env.LOCAL_STORAGE_PATH || './uploads/images',
          baseUrl: process.env.LOCAL_STORAGE_BASE_URL || 'http://localhost:3000/uploads/images',
        },
      };
    }
  }

  /**
   * Get current storage type
   */
  getStorageType(): string {
    return this.storageConfig.type;
  }

  /**
   * Download and persist an image from URL
   */
  async downloadImage(imageUrl: string, userId: string, imageId?: string): Promise<DownloadResult> {
    if (this.storageConfig.type === 'oss') {
      return this.uploadToOss(imageUrl, userId, imageId);
    } else {
      return this.saveToLocal(imageUrl, userId, imageId);
    }
  }

  /**
   * Save image to local storage
   */
  private async saveToLocal(imageUrl: string, userId: string, imageId?: string): Promise<DownloadResult> {
    const localConfig = this.storageConfig.local!;

    // Create user directory
    const userDir = path.join(localConfig.basePath, userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // Fetch image using native fetch with timeout via AbortController
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let response: Response;
    try {
      response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'PromptStudio/1.0',
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new AppError(`Failed to download image: HTTP ${response.status}`, 500, 'DOWNLOAD_ERROR');
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const extension = this.getExtensionFromMimeType(contentType);
    const filename = `img_${Date.now()}_${Math.random().toString(36).substring(7)}${extension}`;
    const localPath = path.join(userDir, filename);

    // Get buffer
    const buffer = await response.arrayBuffer();
    const size = buffer.byteLength;

    // Write file
    fs.writeFileSync(localPath, Buffer.from(buffer));

    const publicUrl = `${localConfig.baseUrl}/${userId}/${filename}`;

    // Save to database if imageId provided
    if (imageId) {
      await prisma.imageFile.create({
        data: {
          originalUrl: imageUrl,
          localPath,
          filename,
          size,
          mimeType: contentType,
          imageId,
          userId,
        },
      });
    } else {
      // Save without imageId
      await prisma.imageFile.create({
        data: {
          originalUrl: imageUrl,
          localPath,
          filename,
          size,
          mimeType: contentType,
          userId,
        },
      });
    }

    return {
      localPath,
      filename,
      url: publicUrl,
      size,
      mimeType: contentType,
    };
  }

  /**
   * Upload image to Alibaba Cloud OSS
   */
  private async uploadToOss(imageUrl: string, userId: string, imageId?: string): Promise<DownloadResult> {
    const ossConfig = this.storageConfig.oss!;

    // Check if OSS is configured
    if (!ossConfig.accessKeyId || !ossConfig.bucket) {
      throw new AppError('阿里云 OSS 未配置', 500, 'OSS_NOT_CONFIGURED');
    }

    // Import OSS SDK dynamically
    // @ts-ignore - ali-oss has no type definitions
    let AliOSS: AliOSS = null;
    try {
      // @ts-ignore
      AliOSS = await import('ali-oss');
    } catch {
      throw new AppError('ali-oss SDK 未安装，请运行: npm install ali-oss', 500, 'OSS_SDK_MISSING');
    }

    const client = new AliOSS({
      region: ossConfig.region,
      accessKeyId: ossConfig.accessKeyId,
      accessKeySecret: ossConfig.accessKeySecret,
      bucket: ossConfig.bucket,
      endpoint: ossConfig.endpoint,
    });

    // Fetch image with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let response: Response;
    try {
      response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'PromptStudio/1.0' },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new AppError(`Failed to download image: HTTP ${response.status}`, 500, 'DOWNLOAD_ERROR');
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const extension = this.getExtensionFromMimeType(contentType);
    const filename = `images/${userId}/img_${Date.now()}_${Math.random().toString(36).substring(7)}${extension}`;
    const buffer = await response.arrayBuffer();
    const size = buffer.byteLength;

    // Upload to OSS
    const result = await client.put(filename, Buffer.from(buffer), {
      headers: {
        'Content-Type': contentType,
      },
    });

    const ossUrl = result.url;

    // Save to database
    await prisma.imageFile.create({
      data: {
        originalUrl: imageUrl,
        localPath: filename,
        filename,
        size,
        mimeType: contentType,
        imageId,
        userId,
      },
    });

    return {
      localPath: filename,
      filename,
      url: ossUrl,
      size,
      mimeType: contentType,
    };
  }

  /**
   * Batch download images (for pre-fetching content)
   */
  async batchDownload(urls: string[], userId: string): Promise<DownloadResult[]> {
    const results: DownloadResult[] = [];
    for (const url of urls) {
      try {
        const result = await this.downloadImage(url, userId);
        results.push(result);
      } catch (error) {
        console.error(`Failed to download image ${url}:`, error);
        // Continue with other images
      }
    }
    return results;
  }

  /**
   * Delete an image file
   */
  async delete(filename: string): Promise<void> {
    if (this.storageConfig.type === 'oss') {
      const ossConfig = this.storageConfig.oss!;
      let AliOSS: AliOSS;
      try {
        // @ts-ignore
        AliOSS = await import('ali-oss');
      } catch {
        return; // Can't delete without SDK
      }

      const client = new AliOSS({
        region: ossConfig.region,
        accessKeyId: ossConfig.accessKeyId,
        accessKeySecret: ossConfig.accessKeySecret,
        bucket: ossConfig.bucket,
        endpoint: ossConfig.endpoint,
      });

      await client.delete(filename);
    } else {
      const localPath = path.join(this.storageConfig.local!.basePath, filename);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }

    // Also delete from database
    await prisma.imageFile.deleteMany({
      where: { filename },
    });
  }

  /**
   * Get public URL for an image
   */
  getPublicUrl(filename: string): string {
    if (this.storageConfig.type === 'oss') {
      return filename; // Already a full URL from OSS
    } else {
      return `${this.storageConfig.local!.baseUrl}/${filename}`;
    }
  }

  /**
   * Get extension from MIME type
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const mimeMap: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
    };
    return mimeMap[mimeType] || '.png';
  }

  /**
   * Generate QR code as data URL
   */
  async generateQRCode(data: string): Promise<string> {
    const QRCode = await getQrCode();
    if (!QRCode) {
      // Fallback: return a placeholder
      return `data:text/plain;base64,${Buffer.from(data).toString('base64')}`;
    }
    return QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });
  }
}

export const storageService = new StorageService();
