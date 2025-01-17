import { Injectable, BadRequestException } from '@nestjs/common';
import { UploadApiErrorResponse, UploadApiResponse, v2 } from 'cloudinary';
import * as stream from 'stream';
import axios from 'axios';

@Injectable()
export class CloudinaryService {
  async uploadImage(
    file: Express.Multer.File,
    folderName: string,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = v2.uploader.upload_stream(
        { folder: folderName },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      stream.Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  async deleteImage(publicId: string): Promise<{ result: string }> {
    return new Promise((resolve, reject) => {
      v2.uploader.destroy(publicId, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  }

  async uploadFromUrl(
    fileUrl: string,
    folderName: string,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    try {
      // Validate URL
      const url = new URL(fileUrl);

      // Download image first with proper headers
      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          Accept: 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          Referer: url.origin,
        },
        maxContentLength: 10 * 1024 * 1024, // 10MB max
        timeout: 10000, // 10 seconds timeout
      });

      // Verify content type is an image
      const contentType = response.headers['content-type'];
      if (!contentType?.startsWith('image/')) {
        throw new BadRequestException('URL does not point to a valid image');
      }

      // Upload buffer to Cloudinary
      return new Promise((resolve, reject) => {
        v2.uploader
          .upload_stream(
            {
              folder: folderName,
              resource_type: 'auto',
              timeout: 60000, // 60 seconds upload timeout
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            },
          )
          .end(response.data);
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new BadRequestException('Request timeout while fetching image');
        }
        if (error.response?.status === 404) {
          throw new BadRequestException('Image not found at the specified URL');
        }
        throw new BadRequestException(
          `Failed to fetch image: ${error.message}`,
        );
      }
      throw error;
    }
  }

  // Helper method to retry failed uploads
  async uploadFromUrlWithRetry(
    fileUrl: string,
    folderName: string,
    maxRetries = 3,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.uploadFromUrl(fileUrl, folderName);
      } catch (error) {
        lastError = error;
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        }
      }
    }

    throw lastError;
  }
}
