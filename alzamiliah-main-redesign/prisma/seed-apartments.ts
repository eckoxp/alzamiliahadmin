/**
 * Seed project 28 with REAL apartment data parsed from the original site.
 * Run: npx tsx prisma/seed-apartments.ts
 */
import { PrismaClient } from '@prisma/client';
import { project28Apartments } from './project28-data';

const prisma = new PrismaClient();

async function main() {
    // Delete ONLY project 28 apartments
    console.log('🗑️  Deleting project 28 apartments...');
    await prisma.apartment.deleteMany({ where: { projectId: 28 } });

    console.log(`📦 Seeding project 28 with ${project28Apartments.length} real apartments...`);

    for (const apt of project28Apartments) {
        await prisma.apartment.create({
            data: {
                projectId: 28,
                unitCode: apt.unitCode,
                buildingName: apt.buildingName,
                floor: apt.floor,
                area: apt.area,
                bedrooms: apt.bedrooms,
                bathrooms: apt.bathrooms,
                price: apt.price,
                status: apt.status,
                type: apt.type,
                image: apt.image || null,
                maidRoom: apt.maidRoom,
                balcony: apt.balcony,
                parking: apt.parking,
                storage: apt.storage,
            },
        });
    }

    const total = await prisma.apartment.count({ where: { projectId: 28 } });
    console.log(`✅ Project 28: ${total} apartments seeded with real data`);

    const grandTotal = await prisma.apartment.count();
    console.log(`📊 Total apartments in DB: ${grandTotal}`);

    await prisma.$disconnect();
}

main().catch(console.error);