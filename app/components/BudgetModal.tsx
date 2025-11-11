'use client'

import { useState, useEffect } from 'react'

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

interface Budget {
  id: string
  categoryId: string
  amount: number
  category: Category
}

interface BudgetModalProps {
  isOpen: boolean
  onClose: () => void
  categories: Category[]
  budgets: Budget[]
  month: number
  year: number
  onSuccess: () => void
}

export default function BudgetModal({
  isOpen,
  onClose,
  categories,
  budgets,
  month,
  year,
  onSuccess,
}: BudgetModalProps) {
  const [budgetValues, setBudgetValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Initialize budget values from existing budgets
    const initialValues: Record<string, string> = {}
    budgets.forEach(budget => {
      initialValues[budget.categoryId] = budget.amount.toString()
    })
    setBudgetValues(initialValues)
  }, [budgets])

  if (!isOpen) return null

  const handleSave = async () => {
    setSaving(true)

    try {
      // Save all budgets with values
      const promises = Object.entries(budgetValues)
        .filter(([_, value]) => value && parseFloat(value) > 0)
        .map(([categoryId, amount]) =>
          fetch('/api/budgets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              categoryId,
              amount: parseFloat(amount),
              month,
              year,
            }),
          })
        )

      await Promise.all(promises)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving budgets:', error)
      alert('Gagal menyimpan budget')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Atur Budget Bulanan</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Tetapkan limit budget per kategori untuk mengontrol pengeluaran
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {categories.map(category => {
              const value = budgetValues[category.id] || ''
              const numValue = parseFloat(value) || 0

              return (
                <div key={category.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: category.color + '20' }}
                  >
                    {category.icon}
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      {category.name}
                    </label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setBudgetValues({
                        ...budgetValues,
                        [category.id]: e.target.value
                      })}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>

                  {numValue > 0 && (
                    <div className="text-sm text-gray-600 flex-shrink-0">
                      {formatCurrency(numValue)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={saving}
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Budget'}
          </button>
        </div>
      </div>
    </div>
  )
}
