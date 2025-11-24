import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const accountId = searchParams.get('accountId')

    let whereClause = {}

    if (accountId) {
      whereClause = { accountId }
    }

    const adjustments = await prisma.adjustment.findMany({
      where: whereClause,
      include: {
        account: true,
      },
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(adjustments)
  } catch (error) {
    console.error('Error fetching adjustments:', error)
    return NextResponse.json({ error: 'Failed to fetch adjustments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accountId, actualBalance, note } = body

    if (!accountId || actualBalance === undefined) {
      return NextResponse.json(
        { error: 'Account ID and actual balance are required' },
        { status: 400 }
      )
    }

    // Calculate recorded balance for the account
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Get all income for this account
    const totalIncome = await prisma.income.aggregate({
      where: { accountId },
      _sum: { amount: true },
    })

    // Get all expenses for this account
    const totalExpenses = await prisma.expense.aggregate({
      where: { accountId },
      _sum: { amount: true },
    })

    // Get all transfers FROM this account
    const totalTransfersOut = await prisma.transfer.aggregate({
      where: { fromAccountId: accountId },
      _sum: { amount: true },
    })

    // Get all transfers TO this account
    const totalTransfersIn = await prisma.transfer.aggregate({
      where: { toAccountId: accountId },
      _sum: { amount: true },
    })

    // Get all previous adjustments for this account
    const totalAdjustments = await prisma.adjustment.aggregate({
      where: { accountId },
      _sum: { difference: true },
    })

    const recordedBalance =
      account.initialBalance +
      (totalIncome._sum.amount || 0) -
      (totalExpenses._sum.amount || 0) +
      (totalTransfersIn._sum.amount || 0) -
      (totalTransfersOut._sum.amount || 0) +
      (totalAdjustments._sum.difference || 0)

    const difference = parseFloat(actualBalance.toString()) - recordedBalance

    const adjustment = await prisma.adjustment.create({
      data: {
        accountId,
        recordedBalance,
        actualBalance: parseFloat(actualBalance.toString()),
        difference,
        note,
      },
      include: {
        account: true,
      },
    })

    return NextResponse.json(adjustment, { status: 201 })
  } catch (error) {
    console.error('Error creating adjustment:', error)
    return NextResponse.json({ error: 'Failed to create adjustment' }, { status: 500 })
  }
}
