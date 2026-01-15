import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface RankingFilters {
    clubId?: string;
    filterType?: 'GLOBAL' | 'UNION' | 'MISSION' | 'CLUB';
    union?: string;
    mission?: string;
    association?: string;
    region?: string;
    district?: string;
}

@Injectable()
export class RankingService {
    constructor(private prisma: PrismaService) { }

    async getPathfindersRanking(filters: RankingFilters) {
        const where: any = { role: 'PATHFINDER', isActive: true };

        // Apply filters based on type
        if (filters.clubId) {
            where.clubId = filters.clubId;
        } else if (filters.filterType === 'MISSION' && filters.mission) {
            // Get clubs from this mission, then filter users
            const clubs = await this.prisma.club.findMany({
                where: { mission: filters.mission },
                select: { id: true }
            });
            if (clubs.length > 0) {
                where.clubId = { in: clubs.map(c => c.id) };
            } else {
                return []; // No clubs in this mission
            }
        } else if (filters.filterType === 'UNION' && filters.union) {
            const clubs = await this.prisma.club.findMany({
                where: { union: filters.union },
                select: { id: true }
            });
            if (clubs.length > 0) {
                where.clubId = { in: clubs.map(c => c.id) };
            } else {
                return [];
            }
        }
        // GLOBAL = no additional filters (all pathfinders)

        const users = await this.prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                points: true,
                email: true,
                role: true,
                dbvClass: true,
                unitId: true,
                birthDate: true,
                club: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: { points: 'desc' }
        });

        return users;
    }

    async getUnitsRanking(clubId: string) {
        if (!clubId) return [];

        // Get all units for this club
        const units = await this.prisma.unit.findMany({
            where: { clubId },
            include: {
                members: {
                    where: { isActive: true },
                    select: { points: true }
                }
            }
        });

        // Calculate stats for each unit
        const rankings = units.map(unit => {
            const totalPoints = unit.members.reduce((sum, m) => sum + (m.points || 0), 0);
            const memberCount = unit.members.length;
            const average = memberCount > 0 ? totalPoints / memberCount : 0;

            return {
                id: unit.id,
                name: unit.name,
                average: Number(average.toFixed(1)),
                totalPoints,
                memberCount
            };
        });

        // Sort by average descending
        return rankings.sort((a, b) => b.average - a.average);
    }

    async resetUserPoints(userId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { points: 0 }
        });
    }
}
