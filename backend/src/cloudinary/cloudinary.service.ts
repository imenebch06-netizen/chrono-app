import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import * as streamifier from 'streamifier';
import * as express from 'express'; 

@Injectable()
export class CloudinaryService {
  // Méthode asynchrone pour uploader un fichier vers Cloudinary
  async uploadFile(
    file: { buffer: Buffer } | undefined,
    folderName: string = 'test-uploads',
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    // Action : Vérifie si un fichier a bien été transmis
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni.');
    }
    //Retourne une Promesse pour gérer l'opération d'upload asynchrone
    return new Promise((resolve, reject) => {
      //Création du flux d'upload (Upload Stream) via l'API Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        // Configuration : spécifie le dossier de destination et détecte automatiquement le type de fichier
        { folder: folderName, resource_type: 'auto' },
        // Fonction de rappel (callback) exécutée à la fin du traitement
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Cloudinary upload failed.'));
          //Si tout s'est bien passé, on résout la promesse avec le résultat
          resolve(result);
        },
      );
      //Convertit le buffer du fichier en flux de lecture (ReadStream) et le redirige (pipe) vers le flux Cloudinary
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
}
