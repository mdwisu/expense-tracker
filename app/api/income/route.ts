import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    let whereClause = {}

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)

      whereClause = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      }
    }

    const income = await prisma.income.findMany({
      where: whereClause,
      include: {
        account: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(income)
  } catch (error) {
    console.error('Error fetching income:', error)
    return NextResponse.json({ error: 'Failed to fetch income' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, amount, accountId, date } = body

    if (!title || !amount || !accountId) {
      return NextResponse.json(
        { error: 'Title, amount, and account are required' },
        { status: 400 }
      )
    }

    const income = await prisma.income.create({
      data: {
        title,
        amount: parseFloat(amount),
        accountId,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        account: true,
      },
    })

    return NextResponse.json(income, { status: 201 })
  } catch (error) {
    console.error('Error creating income:', error)
    return NextResponse.json({ error: 'Failed to create income' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, amount, accountId, date } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    if (!title || !amount || !accountId) {
      return NextResponse.json(
        { error: 'Title, amount, and account are required' },
        { status: 400 }
      )
    }

    const income = await prisma.income.update({
      where: { id },
      data: {
        title,
        amount: parseFloat(amount),
        accountId,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        account: true,
      },
    })

    return NextResponse.json(income)
  } catch (error) {
    console.error('Error updating income:', error)
    return NextResponse.json({ error: 'Failed to update income' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await prisma.income.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Income deleted successfully' })
  } catch (error) {
    console.error('Error deleting income:', error)
    return NextResponse.json({ error: 'Failed to delete income' }, { status: 500 })
  }
}
