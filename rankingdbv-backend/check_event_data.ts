
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Checking Regional Events...");
    const events = await prisma.regionalEvent.findMany();
    console.log(`Found ${events.length} regional events.`);
    events.forEach(e => console.log(` - Event: ${e.title} (ID: ${e.id})`));

    if (events.length === 0) return;

    const eventId = events[0].id; // Pick first one or let user specify
    console.log(`\nChecking Requirements for Event ID: ${eventId}`);

    const requirements = await prisma.requirement.findMany({
        where: { regionalEventId: eventId }
    });
    console.log(`Found ${requirements.length} requirements.`);
    requirements.forEach(r => console.log(` - Req: ${r.title} (ID: ${r.id}, Points: ${r.points})`));

    const reqIds = requirements.map(r => r.id);

    console.log(`\nChecking Event Responses for these requirements...`);
    const responses = await prisma.eventResponse.findMany({
        where: {
            requirementId: { in: reqIds }
        },
        include: {
            club: true,
            requirement: true
        }
    });

    console.log(`Found ${responses.length} responses.`);
    responses.forEach(r => {
        console.log(` - Club: ${r.club.name}, Req: ${r.requirement.title}, Status: ${r.status}, Answer: ${r.answerText || 'File'}`);
    });

    // Check specific club 'Sunshine'
    console.log("\nSearching for club 'Sunshine'...");
    const sunshine = await prisma.club.findFirst({
        where: { name: { contains: 'Sunshine', mode: 'insensitive' } }
    });

    if (sunshine) {
        console.log(`Found Sunshine (ID: ${sunshine.id}). Checking specific responses...`);
        const sunResponses = await prisma.eventResponse.findMany({
            where: {
                clubId: sunshine.id,
                requirementId: { in: reqIds }
            }
        });
        console.log(`Sunshine has ${sunResponses.length} responses for this event.`);
    } else {
        console.log("Club 'Sunshine' not found.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
