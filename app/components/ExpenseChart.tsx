'use client'

import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

interface ExpenseChartProps {
  categoryStats: {
    category: string
    icon: string
    color: string
    total: number
    count: number
  }[]
}

export default function ExpenseChart({ categoryStats }: ExpenseChartProps) {
  if (categoryStats.length === 0) return null

  const pieData = {
    labels: categoryStats.map(cat => `${cat.icon} ${cat.category}`),
    datasets: [
      {
        label: 'Pengeluaran',
        data: categoryStats.map(cat => cat.total),
        backgroundColor: categoryStats.map(cat => cat.color),
        borderColor: categoryStats.map(cat => cat.color),
        borderWidth: 1,
      },
    ],
  }

  const barData = {
    labels: categoryStats.map(cat => cat.icon),
    datasets: [
      {
        label: 'Total Pengeluaran (IDR)',
        data: categoryStats.map(cat => cat.total),
        backgroundColor: categoryStats.map(cat => cat.color + 'CC'),
        borderColor: categoryStats.map(cat => cat.color),
        borderWidth: 1,
      },
    ],
  }

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || ''
            const value = new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0,
            }).format(context.parsed)
            return `${label}: ${value}`
          }
        }
      }
    },
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0,
            }).format(context.parsed.y)
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value)
          }
        }
      }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Visualisasi Pengeluaran</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <div className="flex flex-col">
          <h3 className="text-md font-semibold text-gray-700 mb-4 text-center">Distribusi per Kategori</h3>
          <div className="h-64">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>

        {/* Bar Chart */}
        <div className="flex flex-col">
          <h3 className="text-md font-semibold text-gray-700 mb-4 text-center">Total per Kategori</h3>
          <div className="h-64">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>
    </div>
  )
}
