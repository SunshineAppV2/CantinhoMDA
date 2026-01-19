
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Verificando códigos de indicação duplicados...');
    const clubs = await prisma.club.findMany({
        select: { id: true, name: true, referralCode: true }
    });

    const codes = new Map();
    const duplicates: any[] = [];

    for (const club of clubs) {
        if (!club.referralCode) {
            console.log(`Clube sem código: ${club.name} (${club.id})`);
            continue;
        }

        if (codes.has(club.referralCode)) {
            duplicates.push({
                code: club.referralCode,
                clubs: [codes.get(club.referralCode), club.name]
            });
        } else {
            codes.set(club.referralCode, club.name);
        }
    }

    if (duplicates.length > 0) {
        console.log('Duplicatas encontradas:');
        duplicates.forEach(d => {
            console.log(`Código ${d.code}: ${d.clubs.join(', ')}`);
        });
    } else {
        console.log('Nenhuma duplicata encontrada.');
    }

    // Amostra
    console.log('Amostra de 5 códigos:');
    console.log(clubs.slice(0, 5).map(c => `${c.name}: ${c.referralCode}`).join('\n'));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
