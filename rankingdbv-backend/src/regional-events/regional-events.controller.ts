import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { RegionalEventsService } from './regional-events.service';
import { CreateRegionalEventDto } from './dto/create-regional-event.dto';
import { UpdateRegionalEventDto } from './dto/update-regional-event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('regional-events')
export class RegionalEventsController {
    constructor(private readonly regionalEventsService: RegionalEventsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createDto: CreateRegionalEventDto, @Request() req) {
        const user = req.user;

        // Auto-fill hierarchy based on Creator Role
        if (user.role === 'COORDINATOR_REGIONAL') {
            createDto.region = user.region;
            // Optionally allow them to specify District if they want to target specific district
            // createDto.district = body.district || null;
        } else if (user.role === 'COORDINATOR_DISTRICT') {
            createDto.district = user.district;
            createDto.region = user.region; // Implied? Or keep region null if District-specific?
            // Let's stamp Region too for easier filtering upwards if needed, but District logic prevails
        } else if (user.role !== 'MASTER') {
            throw new ForbiddenException('Apenas Coordenadores e Master podem criar eventos regionais.');
        }

        return this.regionalEventsService.create(createDto, user.userId || user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Request() req) {
        return this.regionalEventsService.findAll(req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.regionalEventsService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: UpdateRegionalEventDto, @Request() req) {
        // Add check ownership logic if needed
        return this.regionalEventsService.update(id, updateDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string, @Request() req) {
        // Add check ownership logic if needed
        return this.regionalEventsService.remove(id);
    }
}
