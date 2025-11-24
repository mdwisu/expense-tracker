'use client'

interface Account {
  id: string
  name: string
  icon: string
  color: string
  type: string
}

interface AccountSelectorProps {
  accounts: Account[]
  selectedAccountId: string
  onChange: (accountId: string) => void
  label?: string
  required?: boolean
}

export default function AccountSelector({
  accounts,
  selectedAccountId,
  onChange,
  label = 'Akun',
  required = true,
}: AccountSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={selectedAccountId}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Pilih akun</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.icon} {account.name}
          </option>
        ))}
      </select>
    </div>
  )
}
