import { Module } from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { ClubsController } from './clubs.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { ClubApprovalService } from './club-approval.service';
import { ClubPaymentService } from './club-payment.service';

@Module({
    imports: [NotificationsModule],
    controllers: [ClubsController],
    providers: [ClubsService, ClubApprovalService, ClubPaymentService, PrismaService],
    exports: [ClubsService] // Exporting the service
})
export class ClubsModule { }
