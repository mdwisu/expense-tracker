'use client'

interface AccountBalance {
  accountId: string
  accountName: string
  accountIcon: string
  accountColor: string
  accountType: string
  balance: number
}

interface AccountBalanceCardsProps {
  accountBalances: AccountBalance[]
  onReconcileClick: (accountId: string) => void
}

export default function AccountBalanceCards({
  accountBalances,
  onReconcileClick,
}: AccountBalanceCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'bank':
        return 'Bank'
      case 'cash':
        return 'Tunai'
      case 'ewallet':
        return 'E-Wallet'
      default:
        return type
    }
  }

  if (accountBalances.length === 0) {
    return null
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Saldo Per Akun</h3>
        <p className="text-sm text-gray-500">{accountBalances.length} akun</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {accountBalances.map((account) => (
          <div
            key={account.accountId}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 border-l-4"
            style={{ borderLeftColor: account.accountColor }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{account.accountIcon}</span>
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm">
                    {account.accountName}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {getTypeLabel(account.accountType)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">Saldo</p>
              <p
                className={`text-xl font-bold ${
                  account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(account.balance)}
              </p>
            </div>

            <button
              onClick={() => onReconcileClick(account.accountId)}
              className="w-full px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors flex items-center justify-center gap-1"
              title="Sesuaikan saldo jika ada perbedaan"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sesuaikan
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
