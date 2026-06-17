import 'dotenv/config';
import pkgPrisma from '@prisma/client';
const { PrismaClient } = pkgPrisma;
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { nanoid } from 'nanoid';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log('Starting project seed...');

  // Fetch the admin user to link projects
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@cinecast.sk' },
  });

  if (!adminUser) {
    console.error('Admin user (admin@cinecast.sk) not found. Please run seed_users.js first.');
    process.exit(1);
  }

  const projectsData = [
    {
      id: nanoid(),
      name: 'Tajomstvo Starej Hory',
      type: 'movie',
      status: 'open',
      short_description: 'Historická dráma o záhadnom poklade ukrytom v slovenských horách.',
      full_description: 'V hlbokých lesoch Starej Hory sa skrýva dávne tajomstvo, ktoré môže zmeniť osud celého regiónu. Mladá archeologička sa púšťa do pátrania po stratenom artefakte, zatiaľ čo čelí nástrahám prírody a ľudskej chamtivosti.',
      image_url: 'https://images.unsplash.com/photo-1516296069000-d81232811417?auto=format&fit=crop&w=800&q=80',
      production_company: 'Slovak Film Studios',
      director: 'Ján Novák',
      location: 'Vysoké Tatry, Slovensko',
      shooting_start_date: '2026-07-15',
      shooting_end_date: '2026-08-20',
      positions: [
        {
          id: nanoid(),
          title: 'Dedinský starec',
          description: 'Charizmatický starec s hlbokými vráskami a múdrym pohľadom. Potrebné skúsenosti s prácou s kamerou.',
          location: 'Ždiar',
          shooting_date: '2026-07-25',
          compensation: '500 EUR/deň',
          spots_total: 1,
          age_min: 65,
          age_max: 80,
          gender: 'male',
          required_skills: 'herectvo, dialekt',
          notes: 'Preferovaný lokálny herec.',
        },
        {
          id: nanoid(),
          title: 'Komparz - dedinčania',
          description: 'Komparzisti pre scény z dedinského života v 19. storočí.',
          location: 'Vlkolínec',
          shooting_date: '2026-08-01',
          compensation: '80 EUR/deň',
          spots_total: 20,
          age_min: 18,
          age_max: 70,
          gender: 'any',
          required_skills: 'žiadne',
          notes: 'Kostýmy zabezpečené produkciou.',
        },
      ],
    },
    {
      id: nanoid(),
      name: 'Nočná Hliadka',
      type: 'tv_series',
      status: 'open',
      short_description: 'Moderný kriminálny seriál odohrávajúci sa v uliciach Bratislavy.',
      full_description: 'Tím elitných detektívov rieši záhadné prípady, ktoré siahajú hlboko do podsvetia hlavného mesta. Každá epizóda prináša nový prípad a odhaľuje temné tajomstvá.',
      image_url: 'https://images.unsplash.com/photo-1517032200216-928929724128?auto=format&fit=crop&w=800&q=80',
      production_company: 'TV Production Slovakia',
      director: 'Eva Kováčová',
      location: 'Bratislava, Slovensko',
      shooting_start_date: '2026-09-01',
      shooting_end_date: '2026-11-30',
      positions: [
        {
          id: nanoid(),
          title: 'Svedok',
          description: 'Muž stredného veku, ktorý bol svedkom krádeže. Krátka, ale dôležitá rola.',
          location: 'Staré Mesto, Bratislava',
          shooting_date: '2026-09-10',
          compensation: '150 EUR/deň',
          spots_total: 1,
          age_min: 40,
          age_max: 60,
          gender: 'male',
          required_skills: 'žiadne',
          notes: 'Scéna sa natáča v noci.',
        },
      ],
    },
  ];

  for (const projectData of projectsData) {
    const { positions, ...projectDetails } = projectData;
    const project = await prisma.project.upsert({
      where: { id: projectDetails.id },
      update: projectDetails,
      create: projectDetails,
    });
    console.log(`Created/Updated project: ${project.name}`);

    for (const positionData of positions) {
      await prisma.position.upsert({
        where: { id: positionData.id },
        update: { ...positionData, project_id: project.id },
        create: { ...positionData, project_id: project.id },
      });
      console.log(`  - Created/Updated position: ${positionData.title}`);
    }
  }

  console.log('Project seed completed successfully.');
}

seed()
  .catch((e) => {
    console.error('Error seeding projects:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });