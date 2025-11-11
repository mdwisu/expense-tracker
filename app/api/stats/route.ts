import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    const now = new Date()
    const currentMonth = month ? parseInt(month) : now.getMonth() + 1
    const currentYear = year ? parseInt(year) : now.getFullYear()

    const startDate = new Date(currentYear, currentMonth - 1, 1)
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59)

    const whereClause = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    }

    // Total income
    const incomeData = await prisma.income.aggregate({
      where: whereClause,
      _sum: {
        amount: true,
      },
    })

    // Total expenses
    const expenseData = await prisma.expense.aggregate({
      where: whereClause,
      _sum: {
        amount: true,
      },
    })

    // Expenses by category
    const expensesByCategory = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: whereClause,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    })

    // Get category details
    const categories = await prisma.category.findMany()

    const categoryStats = expensesByCategory.map((item) => {
      const category = categories.find((c) => c.id === item.categoryId)
      return {
        category: category?.name || 'Unknown',
        icon: category?.icon || '📦',
        color: category?.color || '#95E1D3',
        total: item._sum.amount || 0,
        count: item._count.id,
      }
    })

    const totalIncome = incomeData._sum.amount || 0
    const totalExpenses = expenseData._sum.amount || 0
    const balance = totalIncome - totalExpenses

    return NextResponse.json({
      totalIncome,
      totalExpenses,
      balance,
      categoryStats: categoryStats.sort((a, b) => b.total - a.total),
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
