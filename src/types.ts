export type RelationType = 'Immediate family' | 'Extended family' | 'Close friend' | 'Colleague' | 'Other';
export type GiftType = 'Cash envelope' | 'Check' | 'Venmo/Zelle/Digital';
export type ReciprocityStatus = 'pending' | 'upcoming' | 'fulfilled';
export type EventType = 'Wedding' | 'Birthday Party' | 'Other';

export interface Wedding {
  id: string;
  event_type: EventType;
  event_name?: string; // For 'Other' type
  couple_name: string; // Keep for legacy/wedding specific, or use as primary name
  wedding_date: string;
  created_by: string;
  created_at: string;
}

export interface Gift {
  id: string;
  wedding_id: string;
  guest_name: string;
  amount: number;
  relation: RelationType;
  gift_type: GiftType;
  note?: string;
  logged_by: string;
  logged_at: string;
  reciprocity_status: ReciprocityStatus;
  their_event_type?: string;
  their_event_date?: string;
}

export interface WeddingMember {
  id: string;
  wedding_id: string;
  user_id: string;
  invited_email: string;
  role: 'owner' | 'member';
}
