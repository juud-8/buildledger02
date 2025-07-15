type TotalsProps = {
  subtotal: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  amountPaid: number
  balanceDue: number
}

export default function Totals({ subtotal, taxRate, taxAmount, totalAmount, amountPaid, balanceDue }: TotalsProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-end">
        <div className="w-64">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="text-gray-900">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax ({taxRate}%):</span>
                <span className="text-gray-900">${taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between text-lg font-medium">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900">${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            {amountPaid > 0 && (
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="text-green-600">${amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-900">Balance Due:</span>
                  <span className="text-red-600">${balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 