import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    await prisma.apartment.deleteMany();
    await prisma.projectImage.deleteMany();
    await prisma.contactRequest.deleteMany();
    await prisma.visitor.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();

    const hashedPassword = await bcrypt.hash('Aa123456Aa', 10);
    await prisma.user.create({
        data: { email: 'abdullah@alzamiliah.com', password: hashedPassword, name: 'عبدالله الزاملي', role: 'admin' },
    });
    console.log('✅ Admin user created');

    // ===== PROJECTS =====

    const elafJeddah = await prisma.project.create({
        data: {
            id: 28, nameAr: 'إيلاف جدة', nameEn: 'Elaf Jeddah', type: 'شقق',
            descriptionAr: 'في قلب حي الروضة بجدة، تطلق شركة الزاملية للاستثمار مشروع ‹‹إيلاف جدة›› السكني الفاخر. يتميز المشروع بقربه من الطبيعة ويوفر تجربة معيشية فريدة تلبي جميع احتياجات السكان.\nجدة مركز تجاري مزدهر يحتوي على جميع العناصر الأساسية لدفع النمو الاقتصادي، مما يجعلها أرضاً خصبة لمشاريع الاستثمار الكبرى.\nتتمتع المدينة بدعم مستمر من الحكومة، وهي جهود حولتها إلى ركيزة اقتصادية وسياحية أساسية في المملكة.',
            descriptionEn: 'In the heart of Al Rawdah district in Jeddah, Alzamiliah Investment Company launches the «Elaf Jeddah» luxury residential project. The project is distinguished by its proximity to nature and offers a unique living experience that meets all the resident\'s needs.\nJeddah is a thriving commercial hub with all the essential elements to drive economic growth, making it a fertile ground for major investment projects.\nThe city enjoys continuous support from the government, efforts that have transformed it into a fundamental economic and tourist pillar in the Kingdom.',
            image: 'https://alzamiliah.com/images/projects/1750765583.png',
            buildingsCount: 5, unitsCount: 152, sqFit: '8500', buildYear: '2024',
            sortOrder: 1, locationAr: 'الروضة - جدة', locationEn: 'Al Rawdah - Jeddah', city: 'جدة',
            lat: 21.5169, lng: 39.2192, linkMap: 'https://maps.app.goo.gl/HLs6acGny9HiMvEx9',
            status: 1, availability: 1, isFeatured: 1,
            elec: 1, devices: 1, elevator: 1, air: 1, plumber: 1, house: 1, highQuality: 1, smartEntry: 1, fireSensor: 1,
            projectFile: 'https://alzamiliah.com/images/projects/Elaf%20Jeddah%20-%20by%20Alzamiliah%20-%20Mobile%20v.12.pdf',
            livePreview: 'https://alzamiliah.com/elaf-tour-1,https://alzamiliah.com/elaf-tour-2',
        },
    });

    const tejanComplex = await prisma.project.create({
        data: {
            id: 29, nameAr: 'مجمع تيجان', nameEn: 'Tejan Complex', type: 'مجمع سكني',
            descriptionAr: 'مجمع تيجان السكني الفاخر في حي الروضة بجدة يقدم تجربة معيشية متكاملة مع خدمات حصرية للسكان. يتميز المجمع بتصاميم عصرية وتشطيبات فاخرة مع مساحات خضراء ومرافق ترفيهية.',
            descriptionEn: 'Tejan luxury residential complex in Al Rawdah district, Jeddah offers a complete living experience with exclusive services for residents. The complex features modern designs, luxury finishes, green spaces and recreational facilities.',
            image: 'https://alzamiliah.com/images/projects/1763644892.png',
            buildingsCount: 5, unitsCount: 40, sqFit: '6000', buildYear: '2025',
            sortOrder: 2, locationAr: 'الروضة - جدة', locationEn: 'Al Rawdah - Jeddah', city: 'جدة',
            lat: 21.5185, lng: 39.2205, status: 3, availability: 1, isFeatured: 1,
            elec: 1, plumber: 1, house: 1, highQuality: 1,
        },
    });

    const soaryCompound = await prisma.project.create({
        data: {
            id: 30, nameAr: 'كمباوند صوري', nameEn: 'Soary Compound', type: 'كمباوند',
            descriptionAr: 'كمباوند صوري السكني الفاخر في قلب حي الربوة بالرياض، يوفر بيئة سكنية آمنة ومتكاملة مع تصاميم حديثة ومساحات واسعة.',
            descriptionEn: 'Soary luxury residential compound in the heart of Al Rabwah district in Riyadh, providing a safe and integrated residential environment with modern designs and spacious areas.',
            image: 'https://alzamiliah.com/images/projects/1763645628.png',
            buildingsCount: 3, unitsCount: 18, sqFit: '4500',
            sortOrder: 3, locationAr: 'الربوة - الرياض', locationEn: 'Al Rabwah - Riyadh', city: 'الرياض',
            lat: 24.7136, lng: 46.6753, status: 3, availability: 1, isFeatured: 1,
            elec: 1, plumber: 1, house: 1,
        },
    });

    const alSalamHills = await prisma.project.create({
        data: {
            id: 31, nameAr: 'تلال السلام', nameEn: 'Al Salam Hills', type: 'مجمع سكني',
            descriptionAr: 'مشروع تلال السلام السكني في حي السلام بالرياض، يتكون من مبنيين يضمان 9 وحدات سكنية بمساحات متنوعة وتشطيبات فاخرة.',
            descriptionEn: 'Al Salam Hills residential project in Al Salam district in Riyadh, consisting of 2 buildings with 9 residential units of various sizes and luxury finishes.',
            image: 'https://alzamiliah.com/images/projects/1716995473.jpg',
            buildingsCount: 2, unitsCount: 9, sqFit: '1080', buildYear: '2023',
            sortOrder: 4, locationAr: 'الرياض - السلام', locationEn: 'Riyadh - Al Salam', city: 'الرياض',
            lat: 24.7740, lng: 46.8260,
            linkMap: 'https://maps.app.goo.gl/zyMtZ9q2Uh93BBVw5?g_st=iw',
            status: 1, availability: 1, isFeatured: 1,
            elec: 1, plumber: 1, house: 1,
        },
    });

    const jeddahTowers = await prisma.project.create({
        data: {
            id: 32, nameAr: 'أبراج جدة', nameEn: 'Jeddah Towers', type: 'شقق',
            descriptionAr: 'أبراج جدة السكنية الفاخرة تقدم وحدات سكنية عصرية في موقع استراتيجي بمدينة جدة مع إطلالات بانورامية وخدمات متكاملة.',
            descriptionEn: 'Jeddah Towers luxury residential towers offering modern residential units in a strategic location in Jeddah city with panoramic views and integrated services.',
            image: 'https://alzamiliah.com/images/projects/1751364179.jpg',
            buildingsCount: 2, unitsCount: 60, sqFit: '5000',
            sortOrder: 5, locationAr: 'جدة', locationEn: 'Jeddah', city: 'جدة',
            lat: 21.4858, lng: 39.1925, status: 3, availability: 1, isFeatured: 0,
            elec: 1, plumber: 1, house: 1,
        },
    });

    const ivoryCompound = await prisma.project.create({
        data: {
            id: 33, nameAr: 'كمباوند آيفوري', nameEn: 'Ivory Compound', type: 'كمباوند',
            descriptionAr: 'كمباوند آيفوري السكني الفاخر في حي الروضة بجدة يقدم فلل سكنية بتصاميم عصرية وتشطيبات عالية الجودة مع مساحات خضراء ومرافق خدمية.',
            descriptionEn: 'Ivory luxury residential compound in Al Rawdah district, Jeddah offers residential villas with modern designs, high quality finishes, green spaces and service facilities.',
            image: 'https://alzamiliah.com/images/projects/1763646194.png',
            buildingsCount: 6, unitsCount: 6, sqFit: '3600',
            sortOrder: 6, locationAr: 'الروضة - جدة', locationEn: 'Al Rawdah - Jeddah', city: 'جدة',
            lat: 21.5195, lng: 39.2180, status: 3, availability: 1, isFeatured: 1,
            elec: 1, plumber: 1, house: 1, highQuality: 1,
        },
    });

    const alzamiliahTower = await prisma.project.create({
        data: {
            id: 34, nameAr: 'برج الزاملية', nameEn: 'Alzamiliah Tower', type: 'شقق',
            descriptionAr: 'برج الزاملية السكني التجاري في حي الصحافة بالرياض، يجمع بين الوحدات السكنية والمكاتب التجارية في موقع حيوي.',
            descriptionEn: 'Alzamiliah residential and commercial tower in Al Sahafa district in Riyadh, combining residential units and commercial offices in a vibrant location.',
            image: 'https://alzamiliah.com/images/projects/1763900240.png',
            buildingsCount: 1, unitsCount: 30, sqFit: '4000',
            sortOrder: 7, locationAr: 'الرياض - الصحافة', locationEn: 'Riyadh - Al Sahafa', city: 'الرياض',
            lat: 24.8231, lng: 46.6290, status: 3, availability: 1, isFeatured: 0,
            elec: 1, plumber: 1, house: 1,
        },
    });

    const niloufarCompound = await prisma.project.create({
        data: {
            id: 37, nameAr: 'كمباوند نيلوفر', nameEn: 'Niloufar Compound', type: 'مجمع سكني تجاري',
            descriptionAr: 'يتكون مشروع نيلوفر من مكونات سكنية وتجارية. يغطي القسم السكني مساحة 6,500 متر مربع ويتضمن 51 شقة سكنية بمساحات تتراوح من 80 إلى 115 متر مربع، بالإضافة إلى 16 تاون هاوس بمساحات تتراوح من 90 إلى 190 متر مربع.\nيتكون المبنى من 15 طابقاً بمساحات وحدات تتراوح من 110 إلى 210 متر مربع.\nيمتد القسم التجاري على مساحة 1,000 متر مربع ويتضمن 13 معرض تجاري بمساحات تتراوح من 50 إلى 150 متر مربع.\nيوفر المشروع 95 موقف سيارات في البدروم لخدمة السكان والزوار.',
            descriptionEn: 'The Niloufar project consists of both residential and commercial components. The residential section covers an area of 6,500 sqm and includes 51 residential apartments ranging from 80 to 115 sqm, in addition to 16 townhouses with sizes ranging from 90 to 190 sqm.\nThe building consists of 15 floors with unit sizes ranging from 110 to 210 sqm.\nThe commercial section spans 1,000 sqm and includes 13 retail showrooms with areas ranging from 50 to 150 sqm.\nThe project provides 95 parking spaces in the basement to serve residents and visitors.',
            image: 'https://alzamiliah.com/images/projects/1773177666.webp',
            buildingsCount: 1, unitsCount: 80, sqFit: '7500',
            sortOrder: 0, locationAr: 'جدة', locationEn: 'Jeddah', city: 'جدة',
            lat: 21.5420, lng: 39.1750, status: 3, availability: 1, isFeatured: 1,
            elec: 1, plumber: 1, house: 1, highQuality: 1, smartEntry: 1,
        },
    });

    console.log('✅ 8 projects created');

    // ===== APARTMENTS =====

    // --- Elaf Jeddah (id=28): 5 buildings ---
    const elafBldgs = ['Buildings A', 'Buildings B', 'Buildings C', 'Buildings D', 'Buildings E'];
    const elafUnits = [
        [
            { nameAr: 'شقة A-101', nameEn: 'Apt A-101', floor: 1, area: 85, bedrooms: 2, bathrooms: 2, status: 'sold' },
            { nameAr: 'شقة A-102', nameEn: 'Apt A-102', floor: 1, area: 95, bedrooms: 2, bathrooms: 2, status: 'sold' },
            { nameAr: 'شقة A-201', nameEn: 'Apt A-201', floor: 2, area: 85, bedrooms: 2, bathrooms: 2, status: 'available' },
            { nameAr: 'شقة A-202', nameEn: 'Apt A-202', floor: 2, area: 110, bedrooms: 3, bathrooms: 2, status: 'available' },
            { nameAr: 'شقة A-301', nameEn: 'Apt A-301', floor: 3, area: 85, bedrooms: 2, bathrooms: 2, status: 'available' },
            { nameAr: 'شقة A-302', nameEn: 'Apt A-302', floor: 3, area: 110, bedrooms: 3, bathrooms: 2, status: 'sold' },
            { nameAr: 'شقة A-401', nameEn: 'Apt A-401', floor: 4, area: 85, bedrooms: 2, bathrooms: 2, status: 'available' },
            { nameAr: 'شقة A-402', nameEn: 'Apt A-402', floor: 4, area: 130, bedrooms: 3, bathrooms: 3, status: 'available' },
            { nameAr: 'شقة A-501', nameEn: 'Apt A-501', floor: 5, area: 140, bedrooms: 4, bathrooms: 3, status: 'available' },
        ],
        [
            { nameAr: 'شقة B-101', nameEn: 'Apt B-101', floor: 1, area: 90, bedrooms: 2, bathrooms: 2, status: 'sold' },
            { nameAr: 'شقة B-102', nameEn: 'Apt B-102', floor: 1, area: 100, bedrooms: 3, bathrooms: 2, status: 'available' },
            { nameAr: 'شقة B-201', nameEn: 'Apt B-201', floor: 2, area: 90, bedrooms: 2, bathrooms: 2, status: 'available' },
            { nameAr: 'شقة B-202', nameEn: 'Apt B-202', floor: 2, area: 100, bedrooms: 3, bathrooms: 2, status: 'sold' },
            { nameAr: 'شقة B-301', nameEn: 'Apt B-301', floor: 3, area: 120, bedrooms: 3, bathrooms: 2, status: 'available' },
        ],
        [
            { nameAr: 'شقة C-101', nameEn: 'Apt C-101', floor: 1, area: 80, bedrooms: 2, bathrooms: 1, status: 'sold' },
            { nameAr: 'شقة C-102', nameEn: 'Apt C-102', floor: 1, area: 95, bedrooms: 2, bathrooms: 2, status: 'available' },
            { nameAr: 'شقة C-201', nameEn: 'Apt C-201', floor: 2, area: 80, bedrooms: 2, bathrooms: 1, status: 'available' },
            { nameAr: 'شقة C-202', nameEn: 'Apt C-202', floor: 2, area: 95, bedrooms: 2, bathrooms: 2, status: 'sold' },
            { nameAr: 'شقة C-301', nameEn: 'Apt C-301', floor: 3, area: 105, bedrooms: 3, bathrooms: 2, status: 'available' },
        ],
        [
            { nameAr: 'شقة D-101', nameEn: 'Apt D-101', floor: 1, area: 85, bedrooms: 2, bathrooms: 2, status: 'sold' },
            { nameAr: 'شقة D-201', nameEn: 'Apt D-201', floor: 2, area: 85, bedrooms: 2, bathrooms: 2, status: 'available' },
            { nameAr: 'شقة D-301', nameEn: 'Apt D-301', floor: 3, area: 110, bedrooms: 3, bathrooms: 2, status: 'available' },
        ],
        [
            { nameAr: 'شقة E-101', nameEn: 'Apt E-101', floor: 1, area: 90, bedrooms: 2, bathrooms: 2, status: 'sold' },
            { nameAr: 'شقة E-201', nameEn: 'Apt E-201', floor: 2, area: 90, bedrooms: 2, bathrooms: 2, status: 'available' },
            { nameAr: 'شقة E-301', nameEn: 'Apt E-301', floor: 3, area: 115, bedrooms: 3, bathrooms: 2, status: 'available' },
        ],
    ];
    for (let i = 0; i < elafBldgs.length; i++) {
        for (const u of elafUnits[i]) {
            await prisma.apartment.create({ data: { projectId: elafJeddah.id, buildingName: elafBldgs[i], ...u } });
        }
    }

    // --- Al Salam Hills (id=31): 2 buildings, 9 units (from original site screenshot) ---
    const salamUnitsA = [
        { nameAr: 'دور', nameEn: 'Floor Unit', floor: 1, area: 200, bedrooms: 3, bathrooms: 3, price: 1100000, status: 'available' },
        { nameAr: 'دور', nameEn: 'Floor Unit', floor: 2, area: 200, bedrooms: 3, bathrooms: 3, price: 1200000, status: 'sold' },
        { nameAr: 'شقة', nameEn: 'Apartment', floor: 3, area: 85, bedrooms: 2, bathrooms: 2, price: 550000, status: 'sold' },
        { nameAr: 'شقة', nameEn: 'Apartment', floor: 3, area: null, bedrooms: null, bathrooms: null, price: null, status: 'sold' },
        { nameAr: 'شقة', nameEn: 'Apartment', floor: 4, area: null, bedrooms: null, bathrooms: null, price: null, status: 'sold' },
        { nameAr: 'شقة', nameEn: 'Apartment', floor: 4, area: null, bedrooms: null, bathrooms: null, price: null, status: 'sold' },
    ];
    for (const u of salamUnitsA) {
        await prisma.apartment.create({ data: { projectId: alSalamHills.id, buildingName: 'Buildings A', ...u } });
    }
    const salamUnitsB = [
        { nameAr: 'دور', nameEn: 'Floor Unit', floor: 1, area: 200, bedrooms: 3, bathrooms: 3, price: 1100000, status: 'available' },
        { nameAr: 'دور', nameEn: 'Floor Unit', floor: 2, area: 200, bedrooms: 3, bathrooms: 3, price: 1200000, status: 'sold' },
        { nameAr: 'شقة', nameEn: 'Apartment', floor: 3, area: 85, bedrooms: 2, bathrooms: 2, price: 550000, status: 'sold' },
    ];
    for (const u of salamUnitsB) {
        await prisma.apartment.create({ data: { projectId: alSalamHills.id, buildingName: 'Buildings B', ...u } });
    }

    // --- Tejan Complex (id=29): 5 buildings ---
    for (const bldg of ['Buildings A', 'Buildings B', 'Buildings C', 'Buildings D', 'Buildings E']) {
        for (let floor = 1; floor <= 3; floor++) {
            await prisma.apartment.create({
                data: {
                    projectId: tejanComplex.id, buildingName: bldg,
                    nameAr: `شقة ${bldg.slice(-1)}-${floor}01`, nameEn: `Apt ${bldg.slice(-1)}-${floor}01`,
                    floor, area: 85 + (floor * 10), bedrooms: floor === 3 ? 3 : 2, bathrooms: 2,
                    status: 'available',
                },
            });
        }
    }

    // --- Ivory Compound (id=33): 6 villas ---
    for (let i = 1; i <= 6; i++) {
        await prisma.apartment.create({
            data: {
                projectId: ivoryCompound.id, buildingName: 'Main Building',
                nameAr: `فيلا ${i}`, nameEn: `Villa ${i}`, floor: 1,
                area: 200 + (i * 20), bedrooms: 4, bathrooms: 3,
                status: i <= 2 ? 'sold' : 'available',
            },
        });
    }

    // --- Niloufar Compound (id=37) ---
    await prisma.apartment.create({
        data: { projectId: niloufarCompound.id, buildingName: 'Buildings A', nameAr: 'الوحدة الرئيسية', nameEn: 'Main Unit', floor: 1, area: 7500, status: 'available' },
    });

    console.log('✅ Apartments seeded');

    // ===== GALLERY IMAGES =====
    const elafGallery = ['a.jpg','b.jpg','c1.jpg','d.jpg','d1.jpg','e.jpg','e1.jpg','f.jpg','g.jpg','h.jpg','i.jpg','j.jpg','k.jpg','l.jpg','m.jpg'];
    for (let i = 0; i < elafGallery.length; i++) {
        await prisma.projectImage.create({ data: { projectId: elafJeddah.id, url: `https://alzamiliah.com/images/projects/${elafGallery[i]}`, sortOrder: i } });
    }
    await prisma.projectImage.create({ data: { projectId: niloufarCompound.id, url: 'https://alzamiliah.com/images/projects/1773177666.webp', sortOrder: 0 } });

    console.log('✅ Gallery images seeded');
    console.log('\n🎉 Seeding complete!');
    console.log('📧 Admin: abdullah@alzamiliah.com');
    console.log('🔑 Password: Aa123456Aa');
}

main()
    .catch(e => { console.error('Seed error:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
