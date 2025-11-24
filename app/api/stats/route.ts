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

    // Get all accounts
    const accounts = await prisma.account.findMany({
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    })

    // Calculate balance per account
    const accountBalances = await Promise.all(
      accounts.map(async (account) => {
        // Income for this account (all time)
        const accountIncome = await prisma.income.aggregate({
          where: { accountId: account.id },
          _sum: { amount: true },
        })

        // Expenses for this account (all time)
        const accountExpenses = await prisma.expense.aggregate({
          where: { accountId: account.id },
          _sum: { amount: true },
        })

        // Transfers FROM this account (all time)
        const transfersOut = await prisma.transfer.aggregate({
          where: { fromAccountId: account.id },
          _sum: { amount: true },
        })

        // Transfers TO this account (all time)
        const transfersIn = await prisma.transfer.aggregate({
          where: { toAccountId: account.id },
          _sum: { amount: true },
        })

        // Adjustments for this account (all time)
        const adjustments = await prisma.adjustment.aggregate({
          where: { accountId: account.id },
          _sum: { difference: true },
        })

        const balance =
          account.initialBalance +
          (accountIncome._sum.amount || 0) -
          (accountExpenses._sum.amount || 0) +
          (transfersIn._sum.amount || 0) -
          (transfersOut._sum.amount || 0) +
          (adjustments._sum.difference || 0)

        return {
          accountId: account.id,
          accountName: account.name,
          accountIcon: account.icon,
          accountColor: account.color,
          accountType: account.type,
          balance,
        }
      })
    )

    // Calculate total balance across all accounts
    const totalBalance = accountBalances.reduce((sum, acc) => sum + acc.balance, 0)

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
      totalBalance,
      ytdBalance,
      categoryStats: categoryStats.sort((a, b) => b.total - a.total),
      accountBalances,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
