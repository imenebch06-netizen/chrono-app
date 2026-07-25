import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Multer } from 'multer';

@ApiTags('Upload Images') //  Titre propre dans Swagger
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseGuards(JwtAuthGuard) // Protection optionnelle par JWT si nécessaire
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Téléverser une image vers Cloudinary' })
  @ApiConsumes('multipart/form-data') // Indique à Swagger qu'il s'agit d'un envoi de fichier
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))//Interceptor pour gérer le fichier téléversé
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    //Utiliser la méthode `uploadImage` de `UploadService` pour téléverser le fichier vers Cloudinary
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }
    return this.uploadService.uploadImage(file);
  }
}