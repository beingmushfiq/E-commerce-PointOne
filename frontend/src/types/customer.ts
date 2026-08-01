export interface Address {
  id: number;
  type: 'shipping' | 'billing';
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export interface WalletTransaction {
  id: number;
  type: 'credit' | 'debit';
  amount: number;
  reference?: string;
  description: string;
  created_at: string;
}

export interface Wallet {
  id: number;
  balance: number;
  reward_points: number;
  transactions?: WalletTransaction[];
}

export interface SupportTicket {
  id: number;
  ticket_number: string;
  subject: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  messages?: { id: number; message: string; created_at: string }[];
}
