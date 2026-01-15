import { Controller, Get, Post, Query, Param, UseGuards } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ranking')
@UseGuards(JwtAuthGuard)
export class RankingController {
    constructor(private readonly rankingService: RankingService) { }

    @Get('pathfinders')
    getPathfindersRanking(
        @Query('clubId') clubId?: string,
        @Query('filterType') filterType?: 'GLOBAL' | 'UNION' | 'MISSION' | 'CLUB',
        @Query('union') union?: string,
        @Query('mission') mission?: string,
        @Query('association') association?: string,
        @Query('region') region?: string,
        @Query('district') district?: string
    ) {
        return this.rankingService.getPathfindersRanking({
            clubId,
            filterType,
            union,
            mission,
            association,
            region,
            district
        });
    }

    @Get('units')
    getUnitsRanking(@Query('clubId') clubId: string) {
        return this.rankingService.getUnitsRanking(clubId);
    }

    @Post('reset/:userId')
    resetUserPoints(@Param('userId') userId: string) {
        return this.rankingService.resetUserPoints(userId);
    }
}
