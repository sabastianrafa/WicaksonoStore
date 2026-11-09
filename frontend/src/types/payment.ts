export type PaymentStatusType =
  | "pending"
  | "paid"
  | "rejected"
  | "refunded"
  | "partially_refunded"

export interface Payment {
  id: number
  method: string
  amount: number | string
  status: PaymentStatusType
}

export interface PaymentOrder {
  id: number
  order_number: string
  total: number
  status: string
}

export interface PaymentDetails {
  payment: Payment
  midtrans_attempt_status: string | null
  order: PaymentOrder
}

export interface PaymentDetailsResponse {
  data: PaymentDetails
}

export interface SnapTokenResponse {
  data: {
    snap_token: string
    client_key: string
    is_production: boolean
  }
}

export interface SnapOptions {
  embedId: string
  onSuccess?: () => void
  onPending?: () => void
  onError?: () => void
  onClose?: () => void
}

export interface MidtransSnap {
  embed: (token: string, options: SnapOptions) => void
  hide?: () => void
}

declare global {
  interface Window {
    snap?: MidtransSnap
  }
}