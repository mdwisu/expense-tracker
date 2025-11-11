interface Expense {
  id: string
  title: string
  amount: number
  description: string | null
  date: string
  category: {
    name: string
    icon: string
  }
}

interface Income {
  id: string
  title: string
  amount: number
  date: string
}

export function exportToCSV(expenses: Expense[], incomes: Income[], month: number, year: number) {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  // Header CSV
  let csvContent = `Laporan Keuangan - ${monthNames[month - 1]} ${year}\n\n`

  // Expenses Section
  csvContent += 'PENGELUARAN\n'
  csvContent += 'Tanggal,Judul,Kategori,Jumlah,Deskripsi\n'

  expenses.forEach(expense => {
    const date = new Date(expense.date).toLocaleDateString('id-ID')
    const amount = expense.amount
    const description = expense.description || '-'
    csvContent += `${date},${expense.title},${expense.category.name},${amount},"${description}"\n`
  })

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  csvContent += `\nTotal Pengeluaran:,,,${totalExpenses}\n\n`

  // Incomes Section
  csvContent += 'PEMASUKAN\n'
  csvContent += 'Tanggal,Sumber,Jumlah\n'

  incomes.forEach(income => {
    const date = new Date(income.date).toLocaleDateString('id-ID')
    csvContent += `${date},${income.title},${income.amount}\n`
  })

  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0)
  csvContent += `\nTotal Pemasukan:,,${totalIncome}\n`

  csvContent += `\nSaldo:,,${totalIncome - totalExpenses}\n`

  // Download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `laporan-keuangan-${monthNames[month - 1]}-${year}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function printToPDF(
  expenses: Expense[],
  incomes: Income[],
  stats: {
    totalIncome: number
    totalExpenses: number
    monthlyBalance: number
    previousBalance: number
    cumulativeBalance: number
    ytdBalance: number
    categoryStats: {
      category: string
      icon: string
      total: number
      count: number
    }[]
  },
  month: number,
  year: number
) {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

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

  // Create print window with styled content
  const printWindow = window.open('', '', 'height=800,width=800')

  if (!printWindow) {
    alert('Popup diblokir! Silakan izinkan popup untuk print.')
    return
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Laporan Keuangan - ${monthNames[month - 1]} ${year}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Arial', sans-serif;
            padding: 40px;
            color: #333;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #1e40af;
            font-size: 28px;
            margin-bottom: 5px;
          }
          .header p {
            color: #6b7280;
            font-size: 16px;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .summary-card {
            padding: 20px;
            border-radius: 8px;
            border: 2px solid #e5e7eb;
          }
          .summary-card h3 {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 8px;
            text-transform: uppercase;
          }
          .summary-card p {
            font-size: 24px;
            font-weight: bold;
          }
          .income { border-color: #10b981; }
          .income p { color: #10b981; }
          .expense { border-color: #ef4444; }
          .expense p { color: #ef4444; }
          .balance { border-color: #3b82f6; }
          .balance p { color: #3b82f6; }

          .section {
            margin-bottom: 30px;
          }
          .section h2 {
            font-size: 20px;
            margin-bottom: 15px;
            color: #1e40af;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          th {
            background-color: #f3f4f6;
            font-weight: 600;
            color: #374151;
          }
          tr:hover { background-color: #f9fafb; }
          .total-row {
            font-weight: bold;
            background-color: #f3f4f6;
          }
          .category-stat {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Expense Tracker</h1>
          <p>Laporan Keuangan - ${monthNames[month - 1]} ${year}</p>
        </div>

        <div class="summary">
          <div class="summary-card income">
            <h3>Total Pemasukan</h3>
            <p>${formatCurrency(stats.totalIncome)}</p>
          </div>
          <div class="summary-card expense">
            <h3>Total Pengeluaran</h3>
            <p>${formatCurrency(stats.totalExpenses)}</p>
          </div>
          <div class="summary-card balance">
            <h3>Saldo Bulan Ini</h3>
            <p>${formatCurrency(stats.monthlyBalance)}</p>
          </div>
        </div>

        <div class="summary" style="margin-bottom: 30px;">
          <div class="summary-card">
            <h3>Saldo Awal Bulan</h3>
            <p style="color: #6b7280;">${formatCurrency(stats.previousBalance)}</p>
          </div>
          <div class="summary-card" style="border-width: 3px; border-color: #3b82f6; background-color: #eff6ff;">
            <h3>💎 Saldo Kumulatif</h3>
            <p style="color: #1e40af; font-size: 28px;">${formatCurrency(stats.cumulativeBalance)}</p>
          </div>
          <div class="summary-card">
            <h3>Saldo YTD ${year}</h3>
            <p style="color: ${stats.ytdBalance >= 0 ? '#10b981' : '#ef4444'};">${formatCurrency(stats.ytdBalance)}</p>
          </div>
        </div>

        ${stats.categoryStats.length > 0 ? `
        <div class="section">
          <h2>Pengeluaran per Kategori</h2>
          ${stats.categoryStats.map(cat => {
            const percentage = stats.totalExpenses > 0 ? (cat.total / stats.totalExpenses) * 100 : 0
            return `
              <div class="category-stat">
                <span>${cat.icon} ${cat.category} (${cat.count}x)</span>
                <span><strong>${formatCurrency(cat.total)}</strong> (${percentage.toFixed(1)}%)</span>
              </div>
            `
          }).join('')}
        </div>
        ` : ''}

        ${incomes.length > 0 ? `
        <div class="section">
          <h2>Riwayat Pemasukan</h2>
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Sumber</th>
                <th style="text-align: right;">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              ${incomes.map(income => `
                <tr>
                  <td>${formatDate(income.date)}</td>
                  <td>${income.title}</td>
                  <td style="text-align: right; color: #10b981; font-weight: 600;">+${formatCurrency(income.amount)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="2">Total Pemasukan</td>
                <td style="text-align: right;">${formatCurrency(stats.totalIncome)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        ` : ''}

        ${expenses.length > 0 ? `
        <div class="section">
          <h2>Riwayat Pengeluaran</h2>
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Judul</th>
                <th>Kategori</th>
                <th style="text-align: right;">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              ${expenses.map(expense => `
                <tr>
                  <td>${formatDate(expense.date)}</td>
                  <td>${expense.title}${expense.description ? `<br><small style="color: #6b7280;">${expense.description}</small>` : ''}</td>
                  <td>${expense.category.icon} ${expense.category.name}</td>
                  <td style="text-align: right; color: #ef4444; font-weight: 600;">-${formatCurrency(expense.amount)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3">Total Pengeluaran</td>
                <td style="text-align: right;">${formatCurrency(stats.totalExpenses)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="footer">
          <p>Dicetak pada ${new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
    </html>
  `)

  printWindow.document.close()
}
