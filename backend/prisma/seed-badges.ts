import { PrismaClient, BadgeCategory } from '@prisma/client';

const prisma = new PrismaClient();

const badges = [
  // Stories badges
  {
    code: 'FIRST_STORY',
    name: 'Primera Historia',
    description: 'Publicaste tu primera historia',
    icon: '📸',
    category: BadgeCategory.STORIES,
    threshold: 1,
    xpReward: 50,
  },
  {
    code: 'STORIES_10',
    name: 'Narrador',
    description: 'Publicaste 10 historias',
    icon: '📖',
    category: BadgeCategory.STORIES,
    threshold: 10,
    xpReward: 100,
  },
  {
    code: 'STORIES_50',
    name: 'Cronista',
    description: 'Publicaste 50 historias',
    icon: '🎬',
    category: BadgeCategory.STORIES,
    threshold: 50,
    xpReward: 250,
  },
  {
    code: 'STORIES_100',
    name: 'Leyenda',
    description: 'Publicaste 100 historias',
    icon: '🏆',
    category: BadgeCategory.STORIES,
    threshold: 100,
    xpReward: 500,
  },

  // Social badges
  {
    code: 'FOLLOWERS_10',
    name: 'Conocido',
    description: 'Tienes 10 seguidores',
    icon: '👥',
    category: BadgeCategory.SOCIAL,
    threshold: 10,
    xpReward: 75,
  },
  {
    code: 'FOLLOWERS_50',
    name: 'Popular',
    description: 'Tienes 50 seguidores',
    icon: '⭐',
    category: BadgeCategory.SOCIAL,
    threshold: 50,
    xpReward: 150,
  },
  {
    code: 'FOLLOWERS_100',
    name: 'Influencer',
    description: 'Tienes 100 seguidores',
    icon: '🌟',
    category: BadgeCategory.SOCIAL,
    threshold: 100,
    xpReward: 300,
  },
  {
    code: 'FOLLOWERS_500',
    name: 'Celebridad',
    description: 'Tienes 500 seguidores',
    icon: '👑',
    category: BadgeCategory.SOCIAL,
    threshold: 500,
    xpReward: 750,
  },

  // Engagement badges
  {
    code: 'LIKES_100',
    name: 'Querido',
    description: 'Recibiste 100 likes en total',
    icon: '❤️',
    category: BadgeCategory.ENGAGEMENT,
    threshold: 100,
    xpReward: 100,
  },
  {
    code: 'LIKES_500',
    name: 'Adorado',
    description: 'Recibiste 500 likes en total',
    icon: '💖',
    category: BadgeCategory.ENGAGEMENT,
    threshold: 500,
    xpReward: 300,
  },
  {
    code: 'COMMENTS_50',
    name: 'Conversador',
    description: 'Recibiste 50 comentarios',
    icon: '💬',
    category: BadgeCategory.ENGAGEMENT,
    threshold: 50,
    xpReward: 150,
  },

  // Streak badges
  {
    code: 'STREAK_7',
    name: 'Constante',
    description: 'Racha de 7 días consecutivos',
    icon: '🔥',
    category: BadgeCategory.STREAK,
    threshold: 7,
    xpReward: 100,
  },
  {
    code: 'STREAK_30',
    name: 'Dedicado',
    description: 'Racha de 30 días consecutivos',
    icon: '💪',
    category: BadgeCategory.STREAK,
    threshold: 30,
    xpReward: 300,
  },
  {
    code: 'STREAK_100',
    name: 'Inquebrantable',
    description: 'Racha de 100 días consecutivos',
    icon: '🏅',
    category: BadgeCategory.STREAK,
    threshold: 100,
    xpReward: 1000,
  },

  // Special badges
  {
    code: 'GUELAGUETZA_2024',
    name: 'Guelaguetza 2024',
    description: 'Participaste en la Guelaguetza 2024',
    icon: '🎊',
    category: BadgeCategory.SPECIAL,
    threshold: 1,
    xpReward: 200,
  },
  {
    code: 'EARLY_ADOPTER',
    name: 'Early Adopter',
    description: 'Te uniste durante el lanzamiento',
    icon: '🚀',
    category: BadgeCategory.SPECIAL,
    threshold: 1,
    xpReward: 100,
  },
];

async function seedBadges() {
  console.log('Seeding badges...');

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { code: badge.code },
      update: badge,
      create: badge,
    });
    console.log(`  ✓ ${badge.name}`);
  }

  console.log(`\nSeeded ${badges.length} badges!`);
}

seedBadges()
  .catch((e) => {
    console.error('Error seeding badges:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
