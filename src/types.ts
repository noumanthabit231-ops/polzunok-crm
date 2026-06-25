export interface Establishment {
  id: string
  name: string
  created_at: string
}

export interface Payment {
  id: string
  establishment_id: string
  amount: number
  start_date: string
  end_date: string
  created_at: string
}

export interface EstablishmentWithStatus extends Establishment {
  payments: Payment[]
  activePayment: Payment | null
  daysTotal: number
  daysElapsed: number
  daysLeft: number
  progressPercent: number
  isActive: boolean
}
