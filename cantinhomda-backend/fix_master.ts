
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMaster() {
    const email = 'master@cantinhomda.com';

    // 1. Garantir que o Clube Master existe
    const clubName = 'Clube Master';
    let club = await prisma.club.findFirst({
        where: { name: clubName }
    });

    if (!club) {
        console.log('Criando Clube Master...');
        club = await prisma.club.create({
            data: {
                name: clubName,
                status: 'ACTIVE',
                planTier: 'PLAN_G',
                region: 'Master',
                union: 'Master',
                mission: 'Master',
                memberLimit: 1000
            }
        });
    }

    // 2. Atualizar o usuário Master
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
        console.log(`Atualizando Master ${email} para o clube ${club.id}...`);
        await prisma.user.update({
            where: { email },
            data: {
                clubId: club.id,
                role: 'MASTER',
                status: 'ACTIVE',
                isActive: true
            }
        });
        console.log('Master atualizado com sucesso!');
    } else {
        console.log('Usuário Master não encontrado para atualizar.');
    }
}

fixMaster()
    .catch(console.error)
    .finally(() => (prisma as any).$disconnect());
