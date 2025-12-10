import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    let whereClause = {}

    if (status) {
      whereClause = {
        status: status,
      }
    }

    const receivables = await prisma.receivable.findMany({
      where: whereClause,
      include: {
        payments: {
          include: {
            account: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(receivables)
  } catch (error) {
    console.error('Error fetching receivables:', error)
    return NextResponse.json({ error: 'Failed to fetch receivables' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { debtorName, totalAmount, description, date, dueDate } = body

    if (!debtorName || !totalAmount) {
      return NextResponse.json(
        { error: 'Debtor name and amount are required' },
        { status: 400 }
      )
    }

    const receivable = await prisma.receivable.create({
      data: {
        debtorName,
        totalAmount: parseFloat(totalAmount),
        remaining: parseFloat(totalAmount), // Initially, remaining = total
        description,
        date: date ? new Date(date) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'active',
      },
      include: {
        payments: true,
      },
    })

    return NextResponse.json(receivable, { status: 201 })
  } catch (error) {
    console.error('Error creating receivable:', error)
    return NextResponse.json({ error: 'Failed to create receivable' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, debtorName, totalAmount, description, date, dueDate } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    if (!debtorName || !totalAmount) {
      return NextResponse.json(
        { error: 'Debtor name and amount are required' },
        { status: 400 }
      )
    }

    // Get current receivable to check payments
    const currentReceivable = await prisma.receivable.findUnique({
      where: { id },
      include: { payments: true },
    })

    if (!currentReceivable) {
      return NextResponse.json({ error: 'Receivable not found' }, { status: 404 })
    }

    // Calculate total paid
    const totalPaid = currentReceivable.payments.reduce((sum, payment) => sum + payment.amount, 0)
    const newTotalAmount = parseFloat(totalAmount)
    const newRemaining = newTotalAmount - totalPaid

    // Check if new total is less than already paid
    if (newTotalAmount < totalPaid) {
      return NextResponse.json(
        { error: 'Total amount cannot be less than already paid amount' },
        { status: 400 }
      )
    }

    // Calculate new status
    let newStatus = 'active'
    if (newRemaining === 0) {
      newStatus = 'paid'
    } else if (newRemaining < newTotalAmount) {
      newStatus = 'partially_paid'
    }

    const receivable = await prisma.receivable.update({
      where: { id },
      data: {
        debtorName,
        totalAmount: newTotalAmount,
        remaining: newRemaining,
        description,
        date: date ? new Date(date) : undefined,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: newStatus,
      },
      include: {
        payments: {
          include: {
            account: true,
          },
        },
      },
    })

    return NextResponse.json(receivable)
  } catch (error) {
    console.error('Error updating receivable:', error)
    return NextResponse.json({ error: 'Failed to update receivable' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Check if receivable has payments
    const receivable = await prisma.receivable.findUnique({
      where: { id },
      include: { payments: true },
    })

    if (!receivable) {
      return NextResponse.json({ error: 'Receivable not found' }, { status: 404 })
    }

    if (receivable.payments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete receivable with payment history. Delete payments first.' },
        { status: 400 }
      )
    }

    await prisma.receivable.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Receivable deleted successfully' })
  } catch (error) {
    console.error('Error deleting receivable:', error)
    return NextResponse.json({ error: 'Failed to delete receivable' }, { status: 500 })
  }
}
