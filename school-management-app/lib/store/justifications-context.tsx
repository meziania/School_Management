'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface JustificationItem {
  id: string
  studentName: string
  className: string
  date: string
  motif: string
  hasFile: boolean
  fileName?: string
  status: 'PENDING' | 'VALIDATED' | 'REFUSED'
}

const INITIAL_MOCK_JUSTIFICATIONS: JustificationItem[] = [
  {
    id: 'a9d8c8c7-66dc-4dc6-b4a3-aeb44efad812',
    studentName: 'Lucas Dupont',
    className: 'CM1 A',
    date: '03/08/2026',
    motif: 'Certificat médical transmis par le Dr. Alami - Repos 48h suite à une grippe aiguë.',
    hasFile: true,
    fileName: 'certificat_medical_grippe.pdf',
    status: 'PENDING',
  },
  {
    id: 'fe7b8e0d-e5a4-4f1f-9cd5-fc8d3890ebc7',
    studentName: 'Noah Bernard',
    className: 'CM2 B',
    date: '05/08/2026',
    motif: 'Rendez-vous médical urgent en ophtalmologie (Consultation spécialisée).',
    hasFile: true,
    fileName: 'attestation_ophtalmologie.pdf',
    status: 'PENDING',
  },
  {
    id: 'b2e0e7fd-b1b4-47d0-ada7-7f20dd636a80',
    studentName: 'Cherkaoui Ayoub',
    className: '1BAC G1',
    date: '05/08/2026',
    motif: 'Raison familiale majeure urgente (Cas de force majeure justifié).',
    hasFile: true,
    fileName: 'justificatif_famille.pdf',
    status: 'PENDING',
  },
]

interface JustificationsContextType {
  justifications: JustificationItem[]
  pendingCount: number
  validatedCount: number
  refusedCount: number
  validateJustification: (id: string) => Promise<void>
  refuseJustification: (id: string) => Promise<void>
}

const JustificationsContext = createContext<JustificationsContextType | undefined>(undefined)

export function JustificationsProvider({ children }: { children: React.ReactNode }) {
  const [justifications, setJustifications] = useState<JustificationItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('school_justifications_v2')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        } catch {}
      }
    }
    return INITIAL_MOCK_JUSTIFICATIONS
  })

  // Sync to localStorage so state persists across hard page reloads
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('school_justifications_v2', JSON.stringify(justifications))
    }
  }, [justifications])

  const pendingCount = justifications.filter(j => j.status === 'PENDING').length
  const validatedCount = justifications.filter(j => j.status === 'VALIDATED').length
  const refusedCount = justifications.filter(j => j.status === 'REFUSED').length

  const validateJustification = async (id: string) => {
    // 1. Update global store immediately
    setJustifications(prev => prev.map(item =>
      item.id === id ? { ...item, status: 'VALIDATED' as const } : item
    ))

    // 2. Persist to API
    try {
      await fetch('/api/admin/attendance/justify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendance_id: id, action: 'accept' }),
      })
    } catch (e) {
      console.error('Erreur sync validateJustification API:', e)
    }
  }

  const refuseJustification = async (id: string) => {
    // 1. Update global store immediately
    setJustifications(prev => prev.map(item =>
      item.id === id ? { ...item, status: 'REFUSED' as const } : item
    ))

    // 2. Persist to API
    try {
      await fetch('/api/admin/attendance/justify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendance_id: id, action: 'reject' }),
      })
    } catch (e) {
      console.error('Erreur sync refuseJustification API:', e)
    }
  }

  return (
    <JustificationsContext.Provider
      value={{
        justifications,
        pendingCount,
        validatedCount,
        refusedCount,
        validateJustification,
        refuseJustification,
      }}
    >
      {children}
    </JustificationsContext.Provider>
  )
}

export function useJustifications() {
  const context = useContext(JustificationsContext)
  if (!context) {
    throw new Error('useJustifications doit être utilisé dans un JustificationsProvider')
  }
  return context
}
