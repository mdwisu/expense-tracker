import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json(accounts)
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, icon, color, initialBalance } = body

    if (!name || !type || !icon || !color) {
      return NextResponse.json(
        { error: 'Name, type, icon, and color are required' },
        { status: 400 }
      )
    }

    const account = await prisma.account.create({
      data: {
        name,
        type,
        icon,
        color,
        initialBalance: initialBalance ? parseFloat(initialBalance) : 0,
        isDefault: false,
      },
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error('Error creating account:', error)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, type, icon, color, initialBalance } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    if (!name || !type || !icon || !color) {
      return NextResponse.json(
        { error: 'Name, type, icon, and color are required' },
        { status: 400 }
      )
    }

    const account = await prisma.account.update({
      where: { id },
      data: {
        name,
        type,
        icon,
        color,
        initialBalance: initialBalance !== undefined ? parseFloat(initialBalance) : undefined,
      },
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error('Error updating account:', error)
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Check if account is default
    const account = await prisma.account.findUnique({
      where: { id },
    })

    if (account?.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default account' },
        { status: 400 }
      )
    }

    // Check if account has transactions
    const expenseCount = await prisma.expense.count({
      where: { accountId: id },
    })

    const incomeCount = await prisma.income.count({
      where: { accountId: id },
    })

    if (expenseCount > 0 || incomeCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete account with existing transactions' },
        { status: 400 }
      )
    }

    await prisma.account.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Account deleted successfully' })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
