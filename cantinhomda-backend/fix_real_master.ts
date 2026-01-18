
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'master@cantinhodbv.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { club: true }
    });

    if (user) {
        console.log('User Found:');
        console.log('ID:', user.id);
        console.log('Role:', user.role);
        console.log('Club:', user.club?.name);

        if (!user.clubId) {
            console.log('User has no club. Assigning "Clube Master"...');
            let club = await prisma.club.findFirst({ where: { name: 'Clube Master' } });
            if (!club) {
                club = await prisma.club.create({
                    data: {
                        name: 'Clube Master',
                        status: 'ACTIVE',
                        settings: { memberLimit: 999 }
                    }
                });
            }
            await prisma.user.update({
                where: { id: user.id },
                data: { clubId: club.id }
            });
            console.log('Club assigned.');
        } else if (user.role !== 'MASTER' && user.role !== 'OWNER') {
            console.log('Fixing role to MASTER...');
            await prisma.user.update({
                where: { id: user.id },
                data: { role: 'MASTER' }
            });
        }
    } else {
        console.log('User NOT found. Creating...');

        // Find or Create Club
        let club = await prisma.club.findFirst({ where: { name: 'Clube Master' } });
        if (!club) {
            club = await prisma.club.create({
                data: {
                    name: 'Clube Master',
                    status: 'ACTIVE',
                    settings: { memberLimit: 999 }
                }
            });
            console.log('Created Club Master');
        }

        const hashedPassword = await bcrypt.hash('123456', 10);
        const newUser = await prisma.user.create({
            data: {
                email,
                name: 'Master User',
                password: hashedPassword,
                role: 'MASTER',
                clubId: club.id,
                status: 'ACTIVE'
            }
        });
        console.log('Created User:', newUser.id);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
