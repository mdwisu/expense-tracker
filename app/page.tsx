'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AddExpenseForm from './components/AddExpenseForm'
import AddIncomeForm from './components/AddIncomeForm'
import TransferForm from './components/TransferForm'
import ReconcileModal from './components/ReconcileModal'
import AccountBalanceCards from './components/AccountBalanceCards'
import ExpenseChart from './components/ExpenseChart'
import BudgetModal from './components/BudgetModal'
import InitialBalanceModal from './components/InitialBalanceModal'
import CategoryManagementModal from './components/CategoryManagementModal'
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

interface Account {
  id: string
  name: string
  icon: string
  color: string
  type: string
}

interface Expense {
  id: string
  title: string
  amount: number
  description: string | null
  date: string
  category: Category
  account: Account
}

interface Income {
  id: string
  title: string
  amount: number
  date: string
  account: Account
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
  totalBalance: number
  ytdBalance: number
  categoryStats: {
    category: string
    icon: string
    color: string
    total: number
    count: number
  }[]
  accountBalances: {
    accountId: string
    accountName: string
    accountIcon: string
    accountColor: string
    accountType: string
    balance: number
  }[]
}

export default function Home() {
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [incomes, setIncomes] = useState<Income[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
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
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [selectedAccountForReconcile, setSelectedAccountForReconcile] = useState('')

  const { toasts, removeToast, success, error, info } = useToast()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [expensesRes, incomesRes, categoriesRes, accountsRes, statsRes, budgetsRes] = await Promise.all([
        fetch(`/api/expenses?month=${selectedMonth}&year=${selectedYear}`),
        fetch(`/api/income?month=${selectedMonth}&year=${selectedYear}`),
        fetch('/api/categories'),
        fetch('/api/accounts'),
        fetch(`/api/stats?month=${selectedMonth}&year=${selectedYear}`),
        fetch(`/api/budgets?month=${selectedMonth}&year=${selectedYear}`),
      ])

      const [expensesData, incomesData, categoriesData, accountsData, statsData, budgetsData] = await Promise.all([
        expensesRes.json(),
        incomesRes.json(),
        categoriesRes.json(),
        accountsRes.json(),
        statsRes.json(),
        budgetsRes.json(),
      ])

      setExpenses(expensesData)
      setIncomes(incomesData)
      setCategories(categoriesData)
      setAccounts(accountsData)
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

  const handleReconcileClick = (accountId: string) => {
    setSelectedAccountForReconcile(accountId)
    setIsReconcileModalOpen(true)
  }

  const handleReconcileSuccess = () => {
    success('Saldo berhasil disesuaikan')
    fetchData()
    setIsReconcileModalOpen(false)
    setSelectedAccountForReconcile('')
  }

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">Expense Tracker</h1>
          <p className="text-sm sm:text-base text-gray-600">Kelola keuangan Anda dengan mudah</p>
        </div>

        {/* Month Selector */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4 sm:mb-6">
          {/* Date Selectors */}
          <div className="flex gap-2 mb-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[2023, 2024, 2025, 2026].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons - Grid on Mobile */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:flex gap-2 flex-wrap">
            {/* Kelola Akun Button */}
            <button
              onClick={() => router.push('/accounts')}
              className="px-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm"
              title="Kelola Akun"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="text-xs sm:text-sm whitespace-nowrap">Kelola Akun</span>
            </button>

            {/* Kelola Piutang Button */}
            <button
              onClick={() => router.push('/receivables')}
              className="px-2 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm"
              title="Kelola Piutang"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs sm:text-sm whitespace-nowrap">Piutang</span>
            </button>

            {/* Initial Balance Button */}
            <button
              onClick={() => setIsBalanceModalOpen(true)}
              className="px-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm"
              title="Atur Saldo Awal"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs sm:text-sm">Saldo</span>
            </button>

            {/* Budget Button */}
            <button
              onClick={() => setIsBudgetModalOpen(true)}
              className="px-2 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm"
              title="Atur Budget"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-xs sm:text-sm">Budget</span>
            </button>

            {/* Kelola Kategori Button */}
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-2 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm"
              title="Kelola Kategori"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="text-xs sm:text-sm whitespace-nowrap">Kategori</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="px-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm"
              title="Export ke CSV"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs sm:text-sm">CSV</span>
            </button>

            {/* Export PDF */}
            <button
              onClick={handlePrintPDF}
              className="px-2 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm"
              title="Print PDF"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="text-xs sm:text-sm">PDF</span>
            </button>

            {/* Add Income */}
            <AddIncomeForm
              accounts={accounts}
              onSuccess={() => {
                success('Pemasukan berhasil ditambahkan')
                fetchData()
              }}
            />

            {/* Transfer */}
            <TransferForm
              accounts={accounts}
              onSuccess={() => {
                success('Transfer berhasil dilakukan')
                fetchData()
              }}
            />
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <>
            {/* Income and Expense Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 mb-3 sm:mb-6">
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Pemasukan Bulan Ini</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-600">
                      {formatCurrency(stats.totalIncome)}
                    </p>
                  </div>
                  <div className="text-2xl sm:text-4xl">💰</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Pengeluaran Bulan Ini</p>
                    <p className="text-lg sm:text-2xl font-bold text-red-600">
                      {formatCurrency(stats.totalExpenses)}
                    </p>
                  </div>
                  <div className="text-2xl sm:text-4xl">💸</div>
                </div>
              </div>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-8">
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="w-full">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Saldo Bulan Ini</p>
                    <p className={`text-lg sm:text-2xl font-bold ${stats.monthlyBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(stats.monthlyBalance)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                      Selisih pemasukan & pengeluaran
                    </p>
                  </div>
                  <div className="text-2xl sm:text-4xl">{stats.monthlyBalance >= 0 ? '📊' : '📉'}</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg p-4 sm:p-6 md:transform md:hover:scale-105 transition-transform">
                <div className="flex items-center justify-between">
                  <div className="w-full">
                    <p className="text-xs sm:text-sm text-white/90 mb-1 font-medium">💎 Total Saldo Semua Akun</p>
                    <p className={`text-xl sm:text-3xl font-bold text-white`}>
                      {formatCurrency(stats.totalBalance)}
                    </p>
                    <p className="text-xs text-white/80 mt-1 sm:mt-2">
                      Dari semua akun yang terdaftar
                    </p>
                  </div>
                  <div className="text-2xl sm:text-4xl">{stats.totalBalance >= 0 ? '✅' : '⚠️'}</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="w-full">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Saldo Year-to-Date</p>
                    <p className={`text-lg sm:text-2xl font-bold ${stats.ytdBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(stats.ytdBalance)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                      Akumulasi tahun {selectedYear}
                    </p>
                  </div>
                  <div className="text-2xl sm:text-4xl">📅</div>
                </div>
              </div>
            </div>

            {/* Account Balance Cards */}
            {stats.accountBalances && stats.accountBalances.length > 0 ? (
              <AccountBalanceCards
                accountBalances={stats.accountBalances}
                onReconcileClick={handleReconcileClick}
              />
            ) : (
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Saldo per akun akan muncul di sini.</strong> Klik <strong>"Kelola Akun"</strong> di menu atas untuk menambah atau mengelola akun Anda.
                  </p>
                </div>
              </div>
            )}
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
        <div className="bg-white rounded-lg shadow-md p-5 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-5">Riwayat Pemasukan</h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500 text-sm">Loading...</div>
          ) : incomes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Belum ada pemasukan bulan ini
            </div>
          ) : (
            <div className="space-y-4">
              {incomes.map((income) => (
                <div
                  key={income.id}
                  className="p-4 sm:p-5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {/* Top section with icon and info */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 flex-shrink-0 rounded-full bg-green-100 flex items-center justify-center text-2xl">
                      💰
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 text-base sm:text-lg mb-1 truncate">{income.title}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white font-medium"
                          style={{ backgroundColor: income.account.color }}
                        >
                          {income.account.icon} {income.account.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(income.date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom section with amount and buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xl font-bold text-green-600">
                      +{formatCurrency(income.amount)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditIncome(income)}
                        className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteIncome(income.id)}
                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-lg shadow-md p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-5">Riwayat Pengeluaran</h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500 text-sm">Loading...</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Belum ada pengeluaran bulan ini
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="p-4 sm:p-5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {/* Top section with icon and info */}
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-14 h-14 flex-shrink-0 rounded-full flex items-center justify-center text-2xl"
                      style={{ backgroundColor: expense.category.color + '20' }}
                    >
                      {expense.category.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 text-base sm:text-lg mb-1 truncate">{expense.title}</h3>
                      <div className="flex items-center gap-2 flex-wrap text-sm text-gray-500">
                        <span>{expense.category.name}</span>
                        <span>•</span>
                        <span
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white font-medium"
                          style={{ backgroundColor: expense.account.color }}
                        >
                          {expense.account.icon} {expense.account.name}
                        </span>
                        <span>•</span>
                        <span>{formatDate(expense.date)}</span>
                      </div>
                      {expense.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{expense.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Bottom section with amount and buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xl font-bold text-red-600">
                      -{formatCurrency(expense.amount)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
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
        accounts={accounts}
        onSuccess={() => {
          success('Pengeluaran berhasil ditambahkan')
          fetchData()
        }}
      />

      {/* Edit Expense Modal */}
      {editingExpense && (
        <AddExpenseForm
          categories={categories}
          accounts={accounts}
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
            accountId: editingExpense.account.id,
            date: editingExpense.date,
          }}
          isOpen={isEditExpenseOpen}
          onClose={handleCloseEdit}
        />
      )}

      {/* Edit Income Modal */}
      {editingIncome && (
        <AddIncomeForm
          accounts={accounts}
          onSuccess={() => {
            success('Pemasukan berhasil diupdate')
            fetchData()
            handleCloseEditIncome()
          }}
          income={{
            id: editingIncome.id,
            title: editingIncome.title,
            amount: editingIncome.amount,
            accountId: editingIncome.account.id,
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

      {/* Category Management Modal */}
      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={() => {
          success('Kategori berhasil disimpan')
          fetchData()
        }}
      />

      {/* Reconcile Modal */}
      {stats && (
        <ReconcileModal
          accounts={accounts}
          accountBalances={stats.accountBalances || []}
          isOpen={isReconcileModalOpen}
          onClose={() => {
            setIsReconcileModalOpen(false)
            setSelectedAccountForReconcile('')
          }}
          onSuccess={handleReconcileSuccess}
        />
      )}

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
