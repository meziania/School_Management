import { z } from 'zod'

// ── Auth ──────────────────────────────────────────────────────

export const signupSchoolSchema = z.object({
  school_name: z.string().min(2, 'Le nom de l\'école doit contenir au moins 2 caractères').max(100),
  subdomain: z
    .string()
    .min(3, 'Le sous-domaine doit contenir au moins 3 caractères')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Uniquement des lettres minuscules, chiffres et tirets'),
  admin_email: z.string().email('Email invalide'),
  admin_password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  admin_full_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
})

export type SignupSchoolInput = z.infer<typeof signupSchoolSchema>

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

export type LoginInput = z.infer<typeof loginSchema>

// ── Classes ───────────────────────────────────────────────────

export const classSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  level: z.string().max(50).optional(),
})

export type ClassInput = z.infer<typeof classSchema>

// ── Students ──────────────────────────────────────────────────

export const studentSchema = z.object({
  last_name: z.string().min(1, 'Le nom est requis').max(100),
  first_name: z.string().min(1, 'Le prénom est requis').max(100),
  class_id: z.string().uuid('Classe invalide').optional(),
  birth_date: z.string().optional(),
})

export type StudentInput = z.infer<typeof studentSchema>

// ── Parents ───────────────────────────────────────────────────

export const inviteParentSchema = z.object({
  email: z.string().email('Email invalide'),
  full_name: z.string().min(2, 'Le nom est requis').max(100),
  student_ids: z.array(z.string().uuid()).min(1, 'Sélectionnez au moins un élève'),
})

export type InviteParentInput = z.infer<typeof inviteParentSchema>

// ── Attendance ────────────────────────────────────────────────

export const attendanceEntrySchema = z.object({
  student_id: z.string().uuid(),
  status: z.enum(['present', 'absent', 'late']),
})

export const attendanceBatchSchema = z.object({
  class_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)'),
  entries: z.array(attendanceEntrySchema),
})

export type AttendanceBatchInput = z.infer<typeof attendanceBatchSchema>

export const justifyAbsenceSchema = z.object({
  attendance_id: z.string().uuid(),
  justification: z.string().min(1, 'La justification est requise').max(500),
})

export type JustifyAbsenceInput = z.infer<typeof justifyAbsenceSchema>

// ── Grades ────────────────────────────────────────────────────

export const gradeSchema = z.object({
  student_id: z.string().uuid(),
  subject: z.string().min(1, 'La matière est requise').max(100),
  score: z.number().min(0, 'Note minimum 0').max(20, 'Note maximum 20'),
  coefficient: z.number().min(0.1, 'Coefficient minimum 0.1').max(10),
  term: z.number().min(1).max(3),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  comment: z.string().max(500).optional(),
})

export type GradeInput = z.infer<typeof gradeSchema>

// ── Announcements ─────────────────────────────────────────────

export const announcementSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200),
  content: z.string().min(1, 'Le contenu est requis').max(5000),
  target: z.string().default('all'), // 'all' ou class_id UUID
  class_id: z.string().uuid().optional().nullable(),
})

export type AnnouncementInput = z.infer<typeof announcementSchema>

// ── Messages ──────────────────────────────────────────────────

export const messageSchema = z.object({
  receiver_id: z.string().uuid(),
  content: z.string().min(1, 'Le message ne peut pas être vide').max(2000),
})

export type MessageInput = z.infer<typeof messageSchema>
