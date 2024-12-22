import { v2 } from 'cloudinary';
import { CLOUDINARY } from './constants';

export const CloudinaryProvider = {
  provide: CLOUDINARY,
  useFactory: () => {
    return v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'Your cloud name',
      api_key: process.env.CLOUDINARY_API_KEY || 'Your api key',
      api_secret: process.env.CLOUDINARY_API_SECRET || 'Your api secret',
    });
  },
};
