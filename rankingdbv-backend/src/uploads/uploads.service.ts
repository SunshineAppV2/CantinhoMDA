import { Injectable, BadRequestException } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class UploadsService {
    async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<{ url: string, filename: string, originalName: string }> {
        if (!file) {
            throw new BadRequestException('Nenhum arquivo enviado.');
        }

        try {
            // Ensure Firebase is initialized (should be by main.ts or on-demand)
            if (admin.apps.length === 0) {
                // Fallback if not initialized elsewhere (though it should be)
                // This might fail if env vars are missing, so we let it throw
                throw new Error('Firebase Admin not initialized');
            }

            const bucket = admin.storage().bucket();
            const filename = `${Date.now()}_${Math.round(Math.random() * 10000)}_${file.originalname}`;
            const fileUpload = bucket.file(`${folder}/${filename}`);

            await fileUpload.save(file.buffer, {
                contentType: file.mimetype,
                public: true,
            });

            // Construct public URL
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${folder}/${filename}`;

            return {
                url: publicUrl,
                filename: filename,
                originalName: file.originalname,
            };
        } catch (error) {
            console.error('Upload Service Error:', error);
            throw new BadRequestException('Erro ao salvar arquivo no Storage: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    }
}
