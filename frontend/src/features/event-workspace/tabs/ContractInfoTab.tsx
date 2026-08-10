import { useEffect, useState } from 'react'
import { Booking } from '../../../types/booking'
import { getContractInfo } from '../../../lib/api'
import { BookingContractInfo } from '../types'
import { ContractInfoForm } from '../components/ContractInfoForm'

export function ContractInfoTab({ booking, onSaved }: { booking: Booking; onSaved?: (info: BookingContractInfo) => void }) {
  const [info, setInfo] = useState<BookingContractInfo | null>(null)

  useEffect(() => {
    getContractInfo(booking.id).then(setInfo)
  }, [booking.id])

  if (!info) return <div className="text-center py-12 text-gray-400 animate-pulse">Contract info laden...</div>
  return <ContractInfoForm bookingId={booking.id} initial={info} onSaved={onSaved} readOnly={!!((booking.status_contract || booking.has_contract_pdf) && !booking.contract_info_unlocked)} />
}
