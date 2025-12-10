import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const receivableId = searchParams.get('receivableId')

    let whereClause = {}

    if (receivableId) {
      whereClause = {
        receivableId: receivableId,
      }
    }

    const payments = await prisma.receivablePayment.findMany({
      where: whereClause,
      include: {
        account: true,
        receivable: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching receivable payments:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { receivableId, amount, accountId, date, note } = body

    if (!receivableId || !amount || !accountId) {
      return NextResponse.json(
        { error: 'Receivable ID, amount, and account are required' },
        { status: 400 }
      )
    }

    // Get receivable to check remaining amount
    const receivable = await prisma.receivable.findUnique({
      where: { id: receivableId },
    })

    if (!receivable) {
      return NextResponse.json({ error: 'Receivable not found' }, { status: 404 })
    }

    const paymentAmount = parseFloat(amount)

    // Check if payment amount exceeds remaining
    if (paymentAmount > receivable.remaining) {
      return NextResponse.json(
        { error: 'Payment amount exceeds remaining balance' },
        { status: 400 }
      )
    }

    // Calculate new remaining and status
    const newRemaining = receivable.remaining - paymentAmount
    let newStatus = receivable.status

    if (newRemaining === 0) {
      newStatus = 'paid'
    } else if (newRemaining < receivable.totalAmount) {
      newStatus = 'partially_paid'
    }

    // Use transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create payment record
      const payment = await tx.receivablePayment.create({
        data: {
          receivableId,
          amount: paymentAmount,
          accountId,
          date: date ? new Date(date) : new Date(),
          note,
        },
        include: {
          account: true,
          receivable: true,
        },
      })

      // 2. Update receivable
      await tx.receivable.update({
        where: { id: receivableId },
        data: {
          remaining: newRemaining,
          status: newStatus,
        },
      })

      // 3. Create income record to update account balance
      await tx.income.create({
        data: {
          title: `Pembayaran Piutang - ${receivable.debtorName}`,
          amount: paymentAmount,
          accountId,
          date: date ? new Date(date) : new Date(),
        },
      })

      return payment
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Get payment details
    const payment = await prisma.receivablePayment.findUnique({
      where: { id },
      include: {
        receivable: true,
      },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Use transaction to reverse all changes
    await prisma.$transaction(async (tx) => {
      // 1. Delete payment record
      await tx.receivablePayment.delete({
        where: { id },
      })

      // 2. Update receivable - add back the payment amount to remaining
      const newRemaining = payment.receivable.remaining + payment.amount
      let newStatus = 'active'

      if (newRemaining === payment.receivable.totalAmount) {
        newStatus = 'active'
      } else if (newRemaining < payment.receivable.totalAmount) {
        newStatus = 'partially_paid'
      }

      await tx.receivable.update({
        where: { id: payment.receivableId },
        data: {
          remaining: newRemaining,
          status: newStatus,
        },
      })

      // 3. Delete the corresponding income record
      // Find income with matching amount, date, and title pattern
      await tx.income.deleteMany({
        where: {
          title: {
            contains: `Pembayaran Piutang - ${payment.receivable.debtorName}`,
          },
          amount: payment.amount,
          accountId: payment.accountId,
          date: payment.date,
        },
      })
    })

    return NextResponse.json({ message: 'Payment deleted successfully' })
  } catch (error) {
    console.error('Error deleting payment:', error)
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 })
  }
}
