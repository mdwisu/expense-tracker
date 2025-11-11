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
    const monthlyBalance = totalIncome - totalExpenses

    // Calculate cumulative balance
    // Get initial balance
    const initialBalance = await prisma.initialBalance.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    // Get all income before this month
    const allPreviousIncome = await prisma.income.aggregate({
      where: {
        date: {
          lt: startDate,
        },
      },
      _sum: {
        amount: true,
      },
    })

    // Get all expenses before this month
    const allPreviousExpenses = await prisma.expense.aggregate({
      where: {
        date: {
          lt: startDate,
        },
      },
      _sum: {
        amount: true,
      },
    })

    const previousBalance = (initialBalance?.amount || 0) +
                           (allPreviousIncome._sum.amount || 0) -
                           (allPreviousExpenses._sum.amount || 0)

    const cumulativeBalance = previousBalance + monthlyBalance

    // Calculate YTD (Year to Date)
    const ytdStartDate = new Date(currentYear, 0, 1)

    const ytdIncome = await prisma.income.aggregate({
      where: {
        date: {
          gte: ytdStartDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    })

    const ytdExpenses = await prisma.expense.aggregate({
      where: {
        date: {
          gte: ytdStartDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    })

    const ytdBalance = (ytdIncome._sum.amount || 0) - (ytdExpenses._sum.amount || 0)

    return NextResponse.json({
      totalIncome,
      totalExpenses,
      monthlyBalance,
      previousBalance,
      cumulativeBalance,
      ytdBalance,
      categoryStats: categoryStats.sort((a, b) => b.total - a.total),
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
