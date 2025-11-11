import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year are required' }, { status: 400 })
    }

    const budgets = await prisma.budget.findMany({
      where: {
        month: parseInt(month),
        year: parseInt(year),
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(budgets)
  } catch (error) {
    console.error('Error fetching budgets:', error)
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { categoryId, amount, month, year } = body

    if (!categoryId || !amount || !month || !year) {
      return NextResponse.json(
        { error: 'Category, amount, month, and year are required' },
        { status: 400 }
      )
    }

    const budget = await prisma.budget.upsert({
      where: {
        categoryId_month_year: {
          categoryId,
          month: parseInt(month),
          year: parseInt(year),
        },
      },
      update: {
        amount: parseFloat(amount),
      },
      create: {
        categoryId,
        amount: parseFloat(amount),
        month: parseInt(month),
        year: parseInt(year),
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(budget, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating budget:', error)
    return NextResponse.json({ error: 'Failed to create/update budget' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await prisma.budget.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Budget deleted successfully' })
  } catch (error) {
    console.error('Error deleting budget:', error)
    return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 })
  }
}
