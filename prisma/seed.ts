import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Seed categories
  const categories = [
    { name: 'Makanan & Minuman', icon: '🍔', color: '#FF6B6B' },
    { name: 'Transportasi', icon: '🚗', color: '#4ECDC4' },
    { name: 'Belanja', icon: '🛍️', color: '#FFE66D' },
    { name: 'Tagihan', icon: '💳', color: '#A8E6CF' },
    { name: 'Hiburan', icon: '🎮', color: '#C7B8EA' },
    { name: 'Kesehatan', icon: '🏥', color: '#FF8B94' },
    { name: 'Pendidikan', icon: '📚', color: '#B4E7CE' },
    { name: 'Lainnya', icon: '📦', color: '#95E1D3' },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.name },
      update: {},
      create: {
        id: category.name,
        ...category,
      },
    })
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
