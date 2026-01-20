import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivitiesModule } from '../activities/activities.module';
import { MeetingsModule } from '../meetings/meetings.module';

@Module({
    imports: [PrismaModule, ActivitiesModule, MeetingsModule],
    controllers: [EventsController],
    providers: [EventsService],
})
export class EventsModule { }
