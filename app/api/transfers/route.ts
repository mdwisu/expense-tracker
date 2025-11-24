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

    const transfers = await prisma.transfer.findMany({
      where: whereClause,
      include: {
        fromAccount: true,
        toAccount: true,
      },
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(transfers)
  } catch (error) {
    console.error('Error fetching transfers:', error)
    return NextResponse.json({ error: 'Failed to fetch transfers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fromAccountId, toAccountId, amount, date, note } = body

    if (!fromAccountId || !toAccountId || !amount) {
      return NextResponse.json(
        { error: 'From account, to account, and amount are required' },
        { status: 400 }
      )
    }

    if (fromAccountId === toAccountId) {
      return NextResponse.json(
        { error: 'Cannot transfer to the same account' },
        { status: 400 }
      )
    }

    if (parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    const transfer = await prisma.transfer.create({
      data: {
        fromAccountId,
        toAccountId,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        note,
      },
      include: {
        fromAccount: true,
        toAccount: true,
      },
    })

    return NextResponse.json(transfer, { status: 201 })
  } catch (error) {
    console.error('Error creating transfer:', error)
    return NextResponse.json({ error: 'Failed to create transfer' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await prisma.transfer.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Transfer deleted successfully' })
  } catch (error) {
    console.error('Error deleting transfer:', error)
    return NextResponse.json({ error: 'Failed to delete transfer' }, { status: 500 })
  }
}
