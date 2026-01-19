import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClubStatus } from '@prisma/client';

@Injectable()
export class ClubApprovalService {
    constructor(private prisma: PrismaService) { }

    /**
     * Aprovar clube - com ou sem período de teste
     */
    async approveClub(
        clubId: string,
        approverId: string,
        options: {
            grantTrial?: boolean;
            trialDays?: number;
            subscriptionPlan?: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
            notes?: string;
        }
    ) {
        const { grantTrial = false, trialDays = 0, subscriptionPlan = 'MONTHLY', notes } = options;

        // Calcular datas
        const now = new Date();
        const trialEndsAt = grantTrial && trialDays > 0
            ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000)
            : null;

        const nextPaymentDue = grantTrial && trialEndsAt
            ? trialEndsAt
            : this.calculateNextPaymentDate(now, subscriptionPlan);

        // Atualizar clube
        const club = await this.prisma.club.update({
            where: { id: clubId },
            data: {
                status: grantTrial ? ClubStatus.TRIAL : ClubStatus.ACTIVE,
                approvedAt: now,
                approvedBy: approverId,
                approvalNotes: notes,
                trialEndsAt,
                subscriptionPlan,
                nextPaymentDue,
                lastPaymentDate: grantTrial ? null : now, // Se não tem teste, considera pago
            }
        });

        // Registrar histórico
        await this.createStatusHistory(
            clubId,
            ClubStatus.PENDING_APPROVAL,
            grantTrial ? ClubStatus.TRIAL : ClubStatus.ACTIVE,
            approverId,
            notes || `Clube aprovado ${grantTrial ? `com ${trialDays} dias de teste` : 'sem teste'}`
        );

        return club;
    }

    /**
     * Rejeitar clube
     */
    async rejectClub(clubId: string, rejectedBy: string, reason: string) {
        const club = await this.prisma.club.update({
            where: { id: clubId },
            data: {
                status: ClubStatus.BLOCKED,
                approvalNotes: reason
            }
        });

        await this.createStatusHistory(
            clubId,
            ClubStatus.PENDING_APPROVAL,
            ClubStatus.BLOCKED,
            rejectedBy,
            reason
        );

        return club;
    }

    /**
     * Conceder período de teste (apenas Master)
     */
    async grantTrial(clubId: string, grantedBy: string, trialDays: number) {
        const now = new Date();
        const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

        const club = await this.prisma.club.update({
            where: { id: clubId },
            data: {
                status: ClubStatus.TRIAL,
                trialEndsAt,
                nextPaymentDue: trialEndsAt
            }
        });

        await this.createStatusHistory(
            clubId,
            club.status,
            ClubStatus.TRIAL,
            grantedBy,
            `Período de teste concedido: ${trialDays} dias`
        );

        return club;
    }

    /**
     * Alterar status do clube
     */
    async changeStatus(
        clubId: string,
        newStatus: ClubStatus,
        changedBy: string,
        reason?: string
    ) {
        const club = await this.prisma.club.findUnique({ where: { id: clubId } });
        if (!club) throw new Error('Clube não encontrado');

        const updated = await this.prisma.club.update({
            where: { id: clubId },
            data: { status: newStatus }
        });

        await this.createStatusHistory(
            clubId,
            club.status,
            newStatus,
            changedBy,
            reason
        );

        return updated;
    }

    /**
     * Listar clubes pendentes de aprovação
     */
    async getPendingClubs() {
        return this.prisma.club.findMany({
            where: { status: ClubStatus.PENDING_APPROVAL },
            include: {
                users: {
                    where: { role: 'OWNER' },
                    select: { id: true, name: true, email: true, phone: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
    }

    /**
     * Obter métricas de aprovação
     */
    async getApprovalMetrics() {
        const [pending, approved, rejected, trial] = await Promise.all([
            this.prisma.club.count({ where: { status: ClubStatus.PENDING_APPROVAL } }),
            this.prisma.club.count({ where: { status: ClubStatus.ACTIVE } }),
            this.prisma.club.count({ where: { status: ClubStatus.BLOCKED } }),
            this.prisma.club.count({ where: { status: ClubStatus.TRIAL } })
        ]);

        return { pending, approved, rejected, trial };
    }

    /**
     * Criar registro no histórico de status
     */
    private async createStatusHistory(
        clubId: string,
        fromStatus: ClubStatus,
        toStatus: ClubStatus,
        changedBy: string,
        reason?: string
    ) {
        return this.prisma.clubStatusHistory.create({
            data: {
                clubId,
                fromStatus,
                toStatus,
                changedBy,
                reason
            }
        });
    }

    /**
     * Calcular próxima data de pagamento
     */
    private calculateNextPaymentDate(from: Date, plan: string): Date {
        const date = new Date(from);

        switch (plan) {
            case 'MONTHLY':
                date.setMonth(date.getMonth() + 1);
                break;
            case 'QUARTERLY':
                date.setMonth(date.getMonth() + 3);
                break;
            case 'ANNUAL':
                date.setFullYear(date.getFullYear() + 1);
                break;
        }

        return date;
    }
}
