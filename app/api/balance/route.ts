import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const balance = await prisma.initialBalance.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    if (!balance) {
      return NextResponse.json({ amount: 0, note: null })
    }

    return NextResponse.json(balance)
  } catch (error) {
    console.error('Error fetching initial balance:', error)
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, note } = body

    if (amount === undefined || amount === null) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 })
    }

    const balance = await prisma.initialBalance.create({
      data: {
        amount: parseFloat(amount),
        note: note || null,
      },
    })

    return NextResponse.json(balance, { status: 201 })
  } catch (error) {
    console.error('Error setting initial balance:', error)
    return NextResponse.json({ error: 'Failed to set balance' }, { status: 500 })
  }
}
