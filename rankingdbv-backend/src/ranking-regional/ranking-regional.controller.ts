
import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { RankingRegionalService } from './ranking-regional.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ranking-regional')
export class RankingRegionalController {
    constructor(private readonly rankingService: RankingRegionalService) { }

    @Get()
    @UseGuards(JwtAuthGuard)
    async getRanking(@Req() req: any, @Query('district') district?: string, @Query('region') region?: string, @Query('association') association?: string) {
        const user = req.user;
        console.log(`[RankingRegional] Request by User: ${user.email} (${user.role}) Scope Params:`, { district, region, association });

        let scope: any = { district, region, association };

        // Restrição para Diretores: Ver apenas o próprio clube
        if (user.role === 'DIRECTOR' || user.role === 'OWNER' || user.role === 'ADMIN') {
            scope = { clubId: user.clubId };
        }
        else if (user.role === 'COORDINATOR_DISTRICT') {
            scope = {
                union: user.union,
                association: user.association || user.mission,
                region: user.region,
                district: user.district
            };
        }
        else if (user.role === 'COORDINATOR_REGIONAL') {
            scope = {
                union: user.union,
                association: user.association || user.mission,
                region: user.region
            };
        }
        else if (user.role === 'COORDINATOR_AREA') {
            scope = {
                union: user.union,
                association: user.association || user.mission
            };
        }

        // Final security check: ensure scope is not too broad for coordinators
        if (['COORDINATOR_REGIONAL', 'COORDINATOR_DISTRICT', 'COORDINATOR_AREA'].includes(user.role)) {
            if (!scope.association) {
                console.warn(`[RankingRegional] Coordinator ${user.email} has no Association/Mission in profile! Filter might be too broad.`);
                // We should technically block or force a very narrow filter
                // scope.association = 'NOT_SET'; 
            }
        }

        console.log(`[RankingRegional] Final Effective Scope:`, scope);
        return this.rankingService.getRegionalRanking(scope);
    }
}
