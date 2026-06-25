import { supabase } from './supabase'
import type { Establishment, Payment, EstablishmentWithStatus } from './types'
import {
  differenceInDays,
  parseISO,
  isAfter,
  isBefore,
  startOfDay,
} from 'date-fns'

// ─── Establishments ───────────────────────────────────────────────
export async function fetchEstablishments(): Promise<Establishment[]> {
  const { data, error } = await supabase
    .from('establishments')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createEstablishment(name: string): Promise<Establishment> {
  const { data, error } = await supabase
    .from('establishments')
    .insert({ name })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteEstablishment(id: string): Promise<void> {
  const { error } = await supabase.from('establishments').delete().eq('id', id)
  if (error) throw error
}

// ─── Payments ─────────────────────────────────────────────────────
export async function fetchPayments(
  establishmentId: string
): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('establishment_id', establishmentId)
    .order('start_date', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createPayment(
  establishmentId: string,
  amount: number,
  startDate: string,
  endDate: string
): Promise<Payment> {
  const { data, error } = await supabase
    .from('payments')
    .insert({
      establishment_id: establishmentId,
      amount,
      start_date: startDate,
      end_date: endDate,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── Computed ─────────────────────────────────────────────────────
export function computeEstablishmentStatus(
  est: Establishment,
  payments: Payment[]
): EstablishmentWithStatus {
  const today = startOfDay(new Date())
  const sorted = [...payments].sort(
    (a, b) =>
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  )

  const activePayment = sorted.find((p) => {
    const start = startOfDay(parseISO(p.start_date))
    const end = startOfDay(parseISO(p.end_date))
    return (
      (isAfter(today, start) || today.getTime() === start.getTime()) &&
      (isBefore(today, end) || today.getTime() === end.getTime())
    )
  }) ?? null

  if (activePayment) {
    const start = parseISO(activePayment.start_date)
    const end = parseISO(activePayment.end_date)
    const daysTotal = differenceInDays(end, start) + 1
    const daysElapsed = differenceInDays(today, start)
    const daysLeft = daysTotal - daysElapsed
    const progressPercent = Math.min(
      100,
      Math.round((daysElapsed / daysTotal) * 100)
    )

    return {
      ...est,
      payments,
      activePayment,
      daysTotal,
      daysElapsed: Math.max(0, daysElapsed),
      daysLeft: Math.max(0, daysLeft),
      progressPercent,
      isActive: true,
    }
  }

  return {
    ...est,
    payments,
    activePayment: null,
    daysTotal: 0,
    daysElapsed: 0,
    daysLeft: 0,
    progressPercent: 0,
    isActive: false,
  }
}
