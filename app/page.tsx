'use client'

import { useEffect, useState } from 'react'
import AddExpenseForm from './components/AddExpenseForm'
import AddIncomeForm from './components/AddIncomeForm'
import ExpenseChart from './components/ExpenseChart'
import BudgetModal from './components/BudgetModal'
import InitialBalanceModal from './components/InitialBalanceModal'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import Toast from './components/Toast'
import { exportToCSV, printToPDF } from '@/lib/export'
import { useToast } from '@/lib/useToast'

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

interface Expense {
  id: string
  title: string
  amount: number
  description: string | null
  date: string
  category: Category
}

interface Income {
  id: string
  title: string
  amount: number
  date: string
}

interface Budget {
  id: string
  categoryId: string
  amount: number
  category: Category
}

interface Stats {
  totalIncome: number
  totalExpenses: number
  monthlyBalance: number
  previousBalance: number
  cumulativeBalance: number
  ytdBalance: number
  categoryStats: {
    category: string
    icon: string
    color: string
    total: number
    count: number
  }[]
}

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [incomes, setIncomes] = useState<Income[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
  const [isEditIncomeOpen, setIsEditIncomeOpen] = useState(false)
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false)

  const { toasts, removeToast, success, error, info } = useToast()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [expensesRes, incomesRes, categoriesRes, statsRes, budgetsRes] = await Promise.all([
        fetch(`/api/expenses?month=${selectedMonth}&year=${selectedYear}`),
        fetch(`/api/income?month=${selectedMonth}&year=${selectedYear}`),
        fetch('/api/categories'),
        fetch(`/api/stats?month=${selectedMonth}&year=${selectedYear}`),
        fetch(`/api/budgets?month=${selectedMonth}&year=${selectedYear}`),
      ])

      const [expensesData, incomesData, categoriesData, statsData, budgetsData] = await Promise.all([
        expensesRes.json(),
        incomesRes.json(),
        categoriesRes.json(),
        statsRes.json(),
        budgetsRes.json(),
      ])

      setExpenses(expensesData)
      setIncomes(incomesData)
      setCategories(categoriesData)
      setStats(statsData)
      setBudgets(budgetsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedMonth, selectedYear])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setIsEditExpenseOpen(true)
  }

  const handleCloseEdit = () => {
    setEditingExpense(null)
    setIsEditExpenseOpen(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pengeluaran ini?')) return

    try {
      const response = await fetch(`/api/expenses?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        success('Pengeluaran berhasil dihapus')
        fetchData()
      } else {
        error('Gagal menghapus pengeluaran')
      }
    } catch (err) {
      console.error('Error deleting expense:', err)
      error('Terjadi kesalahan saat menghapus')
    }
  }

  const handleEditIncome = (income: Income) => {
    setEditingIncome(income)
    setIsEditIncomeOpen(true)
  }

  const handleCloseEditIncome = () => {
    setEditingIncome(null)
    setIsEditIncomeOpen(false)
  }

  const handleDeleteIncome = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pemasukan ini?')) return

    try {
      const response = await fetch(`/api/income?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        success('Pemasukan berhasil dihapus')
        fetchData()
      } else {
        error('Gagal menghapus pemasukan')
      }
    } catch (err) {
      console.error('Error deleting income:', err)
      error('Terjadi kesalahan saat menghapus')
    }
  }

  const handleExportCSV = () => {
    try {
      exportToCSV(expenses, incomes, selectedMonth, selectedYear)
      success('Data berhasil diexport ke CSV')
    } catch (err) {
      console.error('Error exporting CSV:', err)
      error('Gagal export ke CSV')
    }
  }

  const handlePrintPDF = () => {
    if (!stats) return
    try {
      printToPDF(expenses, incomes, stats, selectedMonth, selectedYear)
      info('Membuka jendela print...')
    } catch (err) {
      console.error('Error printing PDF:', err)
      error('Gagal membuka print PDF')
    }
  }

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Expense Tracker</h1>
          <p className="text-gray-600">Kelola keuangan Anda dengan mudah</p>
        </div>

        {/* Month Selector */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map((month, index) => (
                <option key={index} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[2023, 2024, 2025, 2026].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            {/* Initial Balance Button */}
            <button
              onClick={() => setIsBalanceModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              title="Atur Saldo Awal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">Saldo Awal</span>
            </button>

            {/* Budget Button */}
            <button
              onClick={() => setIsBudgetModalOpen(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-2"
              title="Atur Budget"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Budget</span>
            </button>

            {/* Export Buttons */}
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
              title="Export ke CSV"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={handlePrintPDF}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
              title="Print PDF"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="hidden sm:inline">PDF</span>
            </button>

            <AddIncomeForm
              onSuccess={() => {
                success('Pemasukan berhasil ditambahkan')
                fetchData()
              }}
            />
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <>
            {/* Income and Expense Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Pemasukan Bulan Ini</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats.totalIncome)}
                    </p>
                  </div>
                  <div className="text-4xl">💰</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Pengeluaran Bulan Ini</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(stats.totalExpenses)}
                    </p>
                  </div>
                  <div className="text-4xl">💸</div>
                </div>
              </div>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div className="w-full">
                    <p className="text-sm text-gray-600 mb-1">Saldo Bulan Ini</p>
                    <p className={`text-2xl font-bold ${stats.monthlyBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(stats.monthlyBalance)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Selisih pemasukan & pengeluaran
                    </p>
                  </div>
                  <div className="text-4xl">{stats.monthlyBalance >= 0 ? '📊' : '📉'}</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg p-6 transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-between">
                  <div className="w-full">
                    <p className="text-sm text-white/90 mb-1 font-medium">💎 Saldo Kumulatif</p>
                    <p className={`text-3xl font-bold text-white`}>
                      {formatCurrency(stats.cumulativeBalance)}
                    </p>
                    <p className="text-xs text-white/80 mt-2">
                      Saldo awal: {formatCurrency(stats.previousBalance)}
                    </p>
                  </div>
                  <div className="text-4xl">{stats.cumulativeBalance >= 0 ? '✅' : '⚠️'}</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div className="w-full">
                    <p className="text-sm text-gray-600 mb-1">Saldo Year-to-Date</p>
                    <p className={`text-2xl font-bold ${stats.ytdBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(stats.ytdBalance)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Akumulasi tahun {selectedYear}
                    </p>
                  </div>
                  <div className="text-4xl">📅</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Chart Visualization */}
        {stats && stats.categoryStats.length > 0 && (
          <ExpenseChart categoryStats={stats.categoryStats} />
        )}

        {/* Category Stats */}
        {stats && stats.categoryStats.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Pengeluaran per Kategori</h2>
            <div className="space-y-4">
              {stats.categoryStats.map((cat) => {
                const percentage = stats.totalExpenses > 0
                  ? (cat.total / stats.totalExpenses) * 100
                  : 0

                // Find budget for this category
                const categoryBudget = budgets.find(b => b.category.name === cat.category)
                const budgetAmount = categoryBudget?.amount || 0
                const budgetPercentage = budgetAmount > 0 ? (cat.total / budgetAmount) * 100 : 0
                const isOverBudget = budgetAmount > 0 && cat.total > budgetAmount

                return (
                  <div key={cat.category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {cat.icon} {cat.category} ({cat.count}x)
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">
                          {formatCurrency(cat.total)}
                        </span>
                        {budgetAmount > 0 && (
                          <span className="text-xs text-gray-500">
                            / {formatCurrency(budgetAmount)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Budget Progress Bar */}
                    {budgetAmount > 0 ? (
                      <div className="space-y-1">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full transition-all ${
                              isOverBudget ? 'bg-red-500' : ''
                            }`}
                            style={{
                              width: `${Math.min(budgetPercentage, 100)}%`,
                              backgroundColor: isOverBudget ? undefined : cat.color,
                            }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className={isOverBudget ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                            {budgetPercentage.toFixed(0)}% dari budget
                            {isOverBudget && ' - Melebihi budget!'}
                          </span>
                          <span className="text-gray-500">
                            {percentage.toFixed(1)}% dari total
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: cat.color,
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          {percentage.toFixed(1)}% dari total pengeluaran
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Income History */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Riwayat Pemasukan</h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : incomes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Belum ada pemasukan bulan ini
            </div>
          ) : (
            <div className="space-y-3">
              {incomes.map((income) => (
                <div
                  key={income.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">
                      💰
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{income.title}</h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(income.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-green-600">
                      +{formatCurrency(income.amount)}
                    </span>
                    <button
                      onClick={() => handleEditIncome(income)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteIncome(income.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Hapus"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Riwayat Pengeluaran</h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Belum ada pengeluaran bulan ini
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                      style={{ backgroundColor: expense.category.color + '20' }}
                    >
                      {expense.category.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{expense.title}</h3>
                      <p className="text-sm text-gray-500">
                        {expense.category.name} • {formatDate(expense.date)}
                      </p>
                      {expense.description && (
                        <p className="text-sm text-gray-600 mt-1">{expense.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-red-600">
                      -{formatCurrency(expense.amount)}
                    </span>
                    <button
                      onClick={() => handleEdit(expense)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Hapus"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Button */}
      <AddExpenseForm
        categories={categories}
        onSuccess={() => {
          success('Pengeluaran berhasil ditambahkan')
          fetchData()
        }}
      />

      {/* Edit Expense Modal */}
      {editingExpense && (
        <AddExpenseForm
          categories={categories}
          onSuccess={() => {
            success('Pengeluaran berhasil diupdate')
            fetchData()
            handleCloseEdit()
          }}
          expense={{
            id: editingExpense.id,
            title: editingExpense.title,
            amount: editingExpense.amount,
            description: editingExpense.description || undefined,
            categoryId: editingExpense.category.id,
            date: editingExpense.date,
          }}
          isOpen={isEditExpenseOpen}
          onClose={handleCloseEdit}
        />
      )}

      {/* Edit Income Modal */}
      {editingIncome && (
        <AddIncomeForm
          onSuccess={() => {
            success('Pemasukan berhasil diupdate')
            fetchData()
            handleCloseEditIncome()
          }}
          income={{
            id: editingIncome.id,
            title: editingIncome.title,
            amount: editingIncome.amount,
            date: editingIncome.date,
          }}
          isOpen={isEditIncomeOpen}
          onClose={handleCloseEditIncome}
        />
      )}

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        categories={categories}
        budgets={budgets}
        month={selectedMonth}
        year={selectedYear}
        onSuccess={() => {
          success('Budget berhasil disimpan')
          fetchData()
        }}
      />

      {/* Initial Balance Modal */}
      <InitialBalanceModal
        isOpen={isBalanceModalOpen}
        onClose={() => setIsBalanceModalOpen(false)}
        onSuccess={() => {
          success('Saldo awal berhasil disimpan')
          fetchData()
        }}
      />

      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  )
}
