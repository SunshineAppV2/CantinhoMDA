import { Module, Global } from '@nestjs/common';
import { EncryptionService } from './encryption.service';

/**
 * Módulo Global de Criptografia
 * 
 * Disponibiliza o EncryptionService para toda a aplicação
 */
@Global()
@Module({
    providers: [EncryptionService],
    exports: [EncryptionService],
})
export class EncryptionModule { }
