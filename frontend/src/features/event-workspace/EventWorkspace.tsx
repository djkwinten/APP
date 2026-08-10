import { Booking } from '../../types/booking'
import { BookingContractInfo, WorkspaceTab } from './types'
import { ContractInfoTab } from './tabs/ContractInfoTab'
import { QuestionnaireTab } from './tabs/QuestionnaireTab'
import { FilesTab } from './tabs/FilesTab'
import { CommunicationTab } from './tabs/CommunicationTab'

export function EventWorkspace({ booking, activeTab, onShowQuestionnaireChanges, onContractInfoSaved }: {
  booking: Booking
  activeTab: WorkspaceTab
  onShowQuestionnaireChanges: () => void
  onContractInfoSaved?: (info: BookingContractInfo) => void
}) {
  if (activeTab === 'contract') return <ContractInfoTab booking={booking} onSaved={onContractInfoSaved} />
  if (activeTab === 'vragenlijst') return <QuestionnaireTab booking={booking} onShowChanges={onShowQuestionnaireChanges} />
  if (activeTab === 'bestanden') return <FilesTab booking={booking} />
  if (activeTab === 'communicatie') return <CommunicationTab />
  return null
}
