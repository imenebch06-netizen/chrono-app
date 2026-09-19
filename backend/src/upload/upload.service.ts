import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class UploadService {
  constructor() {
    
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'gestion-du-temps', 
        },
        (error, result) => {
          if (error) {
            return reject(new BadRequestException(`Erreur Cloudinary: ${error.message}`));
          }
          if (!result) {
            return reject(new BadRequestException('Erreur Cloudinary: résultat vide'));
          }
          resolve(result);
        },
      );

     
      Readable.from(file.buffer).pipe(uploadStream);
    });
  }
}
