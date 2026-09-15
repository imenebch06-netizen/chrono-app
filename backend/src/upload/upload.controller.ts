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
import { Multer } from 'multer';

@ApiTags('Upload Images') 
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @ApiOperation({ summary: 'Téléverser une image vers Cloudinary' })
  @ApiConsumes('multipart/form-data') 
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
  @UseInterceptors(FileInterceptor('file')) 
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
   
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }
    return this.uploadService.uploadImage(file);
  }
}
