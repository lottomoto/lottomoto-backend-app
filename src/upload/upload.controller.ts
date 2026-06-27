import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { SettingsService } from '../settings/settings.service';

@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly settingsService: SettingsService,
  ) {}

  @Post('logo')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }))
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('Aucun fichier reçu');
    }
    try {
      const url = await this.uploadService.uploadImage(file, 'ldml/logos');
      await this.settingsService.updateMany({ 'entreprise.logo': url });
      return { url };
    } catch (err) {
      console.error('Upload logo error:', err);
      throw err;
    }
  }
}
