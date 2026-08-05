// Types TypeScript — alignés sur le schéma de la base de données
// Tables en anglais, labels UI en français

export type UserRole = 'super_admin' | 'school_admin' | 'teacher' | 'parent'
export type SchoolPlan = 'trial' | 'starter' | 'standard' | 'enterprise'
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled'
export type AttendanceStatus = 'present' | 'absent' | 'late'
export type NotificationType = 'announcement' | 'absence' | 'grade' | 'message' | 'justification_submitted'

export type MoroccanLevel =
  | '1AP' | '2AP' | '3AP' | '4AP' | '5AP' | '6AP'
  | '1AC' | '2AC' | '3AC'
  | 'TCS' | '1BAC' | '2BAC'

export type ExamType =
  | 'controle_continu'
  | 'examen_normalise_provincial'
  | 'examen_normalise_regional'
  | 'examen_regional'
  | 'examen_national'

export interface ExamConfig {
  id?: string
  school_id?: string
  level: string
  cc_weight: number
  provincial_weight: number
  regional_weight: number
  national_weight: number
  passing_grade: number
  created_at?: string
  updated_at?: string
}

export interface School {
  id: string
  name: string
  subdomain: string
  plan: SchoolPlan
  subscription_status: SubscriptionStatus
  trial_ends_at: string
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  school_id: string | null
  role: UserRole
  email: string
  full_name: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type MoroccanFiliere =
  | 'Sciences Mathématiques A'
  | 'Sciences Mathématiques B'
  | 'Sciences Physiques'
  | 'SVT (Sciences de la Vie et de la Terre)'
  | 'Sciences Économiques et Gestion'
  | 'Sciences et Technologies Électriques'
  | 'Sciences et Technologies Mécaniques'
  | 'Lettres et Sciences Humaines'
  | 'Tronc Commun Scientifique'
  | 'Tronc Commun Lettres et Sciences Humaines'

export interface Class {
  id: string
  school_id: string
  name: string
  level: string | null
  filiere?: MoroccanFiliere | string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  school_id: string
  class_id: string | null
  last_name: string
  first_name: string
  birth_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ParentStudent {
  id: string
  school_id: string
  parent_user_id: string
  student_id: string
  created_at: string
}

export interface Attendance {
  id: string
  school_id: string
  student_id: string
  date: string
  status: 'present' | 'absent' | 'PRESENT' | 'ABSENT' | AttendanceStatus
  justification: string | null
  is_justified: boolean
  justification_file_url?: string | null
  justified_file?: string | null
  motif?: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface SchoolSettings {
  id?: string
  school_id: string
  deduction_per_unjustified_absence: number
  deduction_per_justified_absence: number
  created_at?: string
  updated_at?: string
}

export interface Grade {
  id: string
  school_id: string
  student_id: string
  subject: string
  score: number
  coefficient: number
  term: 1 | 2 | 3
  date: string
  comment: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Announcement {
  id: string
  school_id: string
  title: string
  content: string
  target: 'all' | string // 'all' ou class_id
  class_id: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  school_id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
}

export interface Notification {
  id: string
  school_id: string
  user_id: string
  type: NotificationType
  content: string
  link: string | null
  is_read: boolean
  created_at: string
}

export interface Subscription {
  id: string
  school_id: string
  plan: SchoolPlan
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  status: SubscriptionStatus
  current_period_start: string | null
  current_period_end: string | null
  trial_ends_at: string | null
  created_at: string
  updated_at: string
}

// ── Types enrichis (avec jointures) ──────────────────────────

export interface StudentWithClass extends Student {
  classes?: Class | null
}

export interface AttendanceWithStudent extends Attendance {
  students?: Pick<Student, 'id' | 'first_name' | 'last_name'>
}

export interface GradeWithStudent extends Grade {
  students?: Pick<Student, 'id' | 'first_name' | 'last_name'>
}

export interface MessageWithUsers extends Message {
  sender?: Pick<UserProfile, 'id' | 'full_name' | 'role'>
  receiver?: Pick<UserProfile, 'id' | 'full_name' | 'role'>
}

// ── JWT Claims ────────────────────────────────────────────────

export interface JWTClaims {
  sub: string
  email: string
  school_id: string | null
  role: UserRole
  iat: number
  exp: number
}

// ── API Response types ────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T
  error: null
}

export interface ApiError {
  data: null
  error: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError
