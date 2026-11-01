// TypeScript types for JanSetu AI

export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  role: 'resident' | 'staff' | 'admin'
  is_active: boolean
  created_at: string
}

export interface StatusHistoryItem {
  id: string
  status: string
  note?: string
  created_at: string
  changed_by?: string
}

export interface Complaint {
  id: string
  reference_id: string
  original_text: string
  edited_text?: string
  language?: string
  is_code_mixed: boolean
  status: string
  priority: string
  location_text?: string
  landmark?: string
  latitude?: number
  longitude?: number
  category_id?: number
  created_at: string
  updated_at?: string
  category_name?: string
  department_name?: string
  status_history?: StatusHistoryItem[]
}

export interface ComplaintListResponse {
  items: Complaint[]
  total: number
  page: number
  per_page: number
}

export interface CategoryPrediction {
  category_id: number
  category_name: string
  category_slug: string
  confidence?: number
}

export interface DuplicateCandidate {
  complaint_id: string
  reference_id: string
  text_snippet: string
  similarity_score: number
  category_name?: string
  status: string
  created_at: string
}

export interface ClassifyResponse {
  predicted_category: CategoryPrediction
  all_predictions: CategoryPrediction[]
  detected_language?: string
  is_code_mixed: boolean
  suggested_priority: string
  priority_reason: string
  model_name: string
  model_version: string
  latency_ms: number
  similar_complaints: DuplicateCandidate[]
}

export interface ModelInfo {
  name: string
  version: string
  description: string
  trained_at?: string
  accuracy?: number
  macro_f1?: number
  is_available: boolean
  notes: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  complaint_id?: string
}

export interface AdminOverview {
  total: number
  new_today: number
  open: number
  in_progress: number
  resolved: number
  overdue: number
}

export interface CategoryStat {
  category: string
  count: number
  percentage: number
}

export interface TrendPoint {
  date: string
  count: number
}

export const CATEGORIES = [
  { id: 1, name: 'Water Supply and Leakage',    slug: 'water_supply',       icon: '💧', color: '#0284c7' },
  { id: 2, name: 'Roads and Potholes',           slug: 'roads_potholes',     icon: '🛣️', color: '#92400e' },
  { id: 3, name: 'Garbage and Sanitation',       slug: 'garbage_sanitation', icon: '🗑️', color: '#166534' },
  { id: 4, name: 'Electricity and Streetlights', slug: 'electricity_lights', icon: '💡', color: '#a16207' },
  { id: 5, name: 'Drainage and Sewage',          slug: 'drainage_sewage',    icon: '🌊', color: '#0369a1' },
  { id: 6, name: 'Public Safety Hazards',        slug: 'public_safety',      icon: '⚠️', color: '#dc2626' },
  { id: 7, name: 'Public Transport',             slug: 'public_transport',   icon: '🚌', color: '#7c3aed' },
  { id: 8, name: 'Other / Unclassified',         slug: 'other',              icon: '📋', color: '#6b7280' },
]

export const EXAMPLE_COMPLAINTS = [
  { text: 'Mere area mein paani nahi aa raha hai pichle 2 din se.', lang: 'Hinglish' },
  { text: 'Namma area alli water bartha illa, 3 dina aitu.', lang: 'Kanglish' },
  { text: 'Road alli tumba potholes ide, car damage agtide.', lang: 'Kanglish' },
  { text: 'Street light work agtilla, raat ko bahut dark hai.', lang: 'Kanglish' },
  { text: 'Hamare area mein garbage collect nahi hua 5 din se.', lang: 'Hinglish' },
  { text: 'There is sewage overflowing near my house.', lang: 'English' },
]
