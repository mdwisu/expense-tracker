import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Seed accounts
  const accounts = [
    {
      id: 'default_account_001',
      name: 'Tunai',
      type: 'cash',
      icon: '💵',
      color: '#10b981',
      initialBalance: 0,
      isDefault: true,
    },
    {
      id: 'account_bca',
      name: 'BCA',
      type: 'bank',
      icon: '🏦',
      color: '#0066cc',
      initialBalance: 0,
      isDefault: false,
    },
    {
      id: 'account_bri',
      name: 'BRI',
      type: 'bank',
      icon: '🏦',
      color: '#003d99',
      initialBalance: 0,
      isDefault: false,
    },
    {
      id: 'account_mandiri',
      name: 'Mandiri',
      type: 'bank',
      icon: '🏦',
      color: '#ffcc00',
      initialBalance: 0,
      isDefault: false,
    },
    {
      id: 'account_gopay',
      name: 'GoPay',
      type: 'ewallet',
      icon: '📱',
      color: '#00aa13',
      initialBalance: 0,
      isDefault: false,
    },
  ]

  for (const account of accounts) {
    await prisma.account.upsert({
      where: { id: account.id },
      update: {},
      create: account,
    })
  }

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
