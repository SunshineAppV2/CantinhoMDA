
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

        // If user is a coordinator, enforce their scope?
        // For now, let's allow them to pass the scope in query, but ideally we'd validate.

        let scope: any = { district, region, association };

        // Restrição para Diretores: Ver apenas o próprio clube
        if (user.role === 'DIRECTOR' || user.role === 'OWNER' || user.role === 'ADMIN') {
            scope = { clubId: user.clubId };
        }

        if (user.role === 'COORDINATOR_DISTRICT') {
            scope = {
                association: user.association || user.mission,
                region: user.region,
                district: user.district
            };
        }
        else if (user.role === 'COORDINATOR_REGIONAL') {
            scope = {
                association: user.association || user.mission,
                region: user.region
            };
        }
        else if (user.role === 'COORDINATOR_AREA') {
            scope = {
                association: user.association || user.mission
            };
        }
        // Fallback safety: If coordinator has NO scope defined, don't show everything!
        if (['COORDINATOR_REGIONAL', 'COORDINATOR_DISTRICT', 'COORDINATOR_AREA'].includes(user.role)) {
            if (!scope.association && !scope.region && !scope.district) {
                // If scope is empty, force a filter that returns nothing or matches nothing
                scope = { association: 'NONE_SELECTED' };
            }
        }

        return this.rankingService.getRegionalRanking(scope);
    }
}
