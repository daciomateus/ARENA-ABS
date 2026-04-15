import { useCallback, useEffect, useMemo, useState } from 'react'
import { differenceInCalendarDays, isSameMonth, parseISO, startOfDay } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Mail, MessageCircleMore, Search } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { LoadingState } from '../components/LoadingState'
import { StatusBadge } from '../components/StatusBadge'
import { listEnrollments } from '../services/enrollmentService'
import { createFinanceiro, listFinanceiro, updateFinanceiro } from '../services/monthlyService'
import { listProfiles, updateProfile } from '../services/profileService'
import { cancelReservation, listReservations } from '../services/reservationService'
import { formatCurrency, formatShortDate } from '../utils/date'
import { buildFinanceiroPayload, buildReservationDayOptions, getFinanceiroStatus } from '../utils/monthly'

const STUDENTS_PER_PAGE = 8

const initialFilters = {
  nome: '',
  quadra: '',
  horario: '',
  data_reserva: '',
}

const initialPaymentForm = {
  alunoId: '',
  modalidade: '',
  valor: '',
  dataPagamento: '',
  observacoes: '',
}

const initialStudentEditor = {
  telefone: '',
  modalidade: '',
  valor: '',
  dataPagamento: '',
  observacoes: '',
}

const studentStatusFilterOptions = [
  { value: 'todos', label: 'Todos' },
  { value: 'vencido', label: 'Vencidos' },
  { value: 'pago', label: 'Em dia' },
  { value: 'pendente', label: 'Sem pagamento' },
]

const modalidadeOptions = ['Beach', 'Futevolei']

const studentStatusPriority = {
  vencido: 0,
  vence_hoje: 1,
  vence_em_breve: 2,
  pendente: 3,
  pago: 4,
}

function getFinanceSortValue(registro) {
  return registro?.data_ultimo_pagamento || registro?.created_at || registro?.proximo_vencimento || ''
}

function getStudentStatusPill(statusKey) {
  if (statusKey === 'vencido') return 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'
  if (statusKey === 'vence_hoje' || statusKey === 'vence_em_breve') return 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'
  if (statusKey === 'pendente') return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
  return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
}

function formatPaymentDate(value) {
  if (!value) return 'Nao registrado'
  return formatShortDate(new Date(`${value}T00:00:00`))
}

function getEnrollmentUserKey(enrollment) {
  return enrollment?.user_id || enrollment?.aluno_id || enrollment?.profile_id || null
}

function getFinanceAlunoKey(registro) {
  return registro?.aluno_id || registro?.user_id || registro?.profile_id || null
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '')
}

function getDueContext(dateString) {
  if (!dateString) return { daysUntilDue: null, detail: 'Sem vencimento definido.' }

  const today = startOfDay(new Date())
  const dueDate = startOfDay(parseISO(`${dateString}T00:00:00`))
  const daysUntilDue = differenceInCalendarDays(dueDate, today)

  if (daysUntilDue < 0) return { daysUntilDue, detail: `${Math.abs(daysUntilDue)} dia(s) em atraso.` }
  if (daysUntilDue === 0) return { daysUntilDue, detail: 'Vence hoje.' }

  return { daysUntilDue, detail: `Vence em ${daysUntilDue} dia(s).` }
}

function buildWhatsappReminder(student) {
  const phone = normalizePhone(student.telefone)
  if (!phone) return null

  const dueDate = student.proximoVencimento ? formatPaymentDate(student.proximoVencimento) : 'a confirmar'
  const amount = student.valor ? formatCurrency(student.valor) : 'valor a confirmar'
  const message = [
    `Ola, ${student.nome}.`,
    'Passando para lembrar sobre sua mensalidade na Arena ABS.',
    `Modalidade: ${student.modalidade || 'Plano mensal'}`,
    `Vencimento: ${dueDate}`,
    `Valor: ${amount}`,
    'Se ja tiver pago, desconsidere esta mensagem.',
  ].join('\n')

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

function buildMailTo(student) {
  if (!student.email) return null

  const dueDate = student.proximoVencimento ? formatPaymentDate(student.proximoVencimento) : 'a confirmar'
  const subject = encodeURIComponent('Arena ABS - lembrete de mensalidade')
  const body = encodeURIComponent([
    `Ola, ${student.nome}.`,
    '',
    'Estamos entrando em contato sobre sua mensalidade na Arena ABS.',
    `Modalidade: ${student.modalidade || 'Plano mensal'}`,
    `Vencimento: ${dueDate}`,
    `Valor: ${student.valor ? formatCurrency(student.valor) : 'a confirmar'}`,
    '',
    'Se ja tiver pago, desconsidere este aviso.',
  ].join('\n'))

  return `mailto:${student.email}?subject=${subject}&body=${body}`
}

function QuickActions({ student, onEdit, onPay, compact = false }) {
  const actionClass = compact ? 'secondary-btn !h-8 !px-3 !py-0 text-xs' : 'secondary-btn !px-3.5 !py-2 text-xs'

  function handleWhatsapp() {
    const url = buildWhatsappReminder(student)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  function handleEmail() {
    const url = buildMailTo(student)
    if (url) window.location.href = url
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? 'justify-end' : ''}`}>
      <button type="button" className={actionClass} onClick={() => onPay(student)}>Registrar pagamento</button>
      <button type="button" className={actionClass} onClick={() => onEdit(student)}>Editar cadastro</button>
      <button type="button" className={actionClass} onClick={handleWhatsapp} disabled={!normalizePhone(student.telefone)}>
        <MessageCircleMore size={14} className="mr-1.5" />
        WhatsApp
      </button>
      <button type="button" className={actionClass} onClick={handleEmail} disabled={!student.email}>
        <Mail size={14} className="mr-1.5" />
        E-mail
      </button>
    </div>
  )
}

function AlertStudentCard({ student, onEdit, onPay }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-ink-950">{student.nome}</p>
            <p className="mt-1 text-sm text-slate-500">{student.modalidade || 'Plano mensal'} · {student.email || 'Sem e-mail'}</p>
          </div>
          <StatusBadge status={student.status.key} label={student.status.label} />
        </div>
        <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          <p><strong className="text-ink-950">Vencimento:</strong> {formatPaymentDate(student.proximoVencimento)}</p>
          <p><strong className="text-ink-950">Valor:</strong> {student.valor ? formatCurrency(student.valor) : 'Nao informado'}</p>
          <p><strong className="text-ink-950">Telefone:</strong> {student.telefone || 'Sem telefone'}</p>
          <p><strong className="text-ink-950">Status:</strong> {student.status.detail}</p>
        </div>
        <QuickActions student={student} onEdit={onEdit} onPay={onPay} />
      </div>
    </article>
  )
}

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const [reservations, setReservations] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [financeiro, setFinanceiro] = useState([])
  const [profiles, setProfiles] = useState([])
  const filters = initialFilters
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm)
  const [selectedReservationDay, setSelectedReservationDay] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [studentStatusFilter, setStudentStatusFilter] = useState('todos')
  const [studentPage, setStudentPage] = useState(1)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [showPaymentDrawer, setShowPaymentDrawer] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [studentEditor, setStudentEditor] = useState(initialStudentEditor)
  const [loading, setLoading] = useState(true)
  const [savingPayment, setSavingPayment] = useState(false)
  const [savingStudentEdit, setSavingStudentEdit] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [cancellingId, setCancellingId] = useState('')

  const loadData = useCallback(async (currentFilters = filters) => {
    setLoading(true)
    try {
      const [reservationData, enrollmentData, financeiroData, profileData] = await Promise.all([
        listReservations({ isAdmin: true, filters: currentFilters }),
        listEnrollments({ isAdmin: true }),
        listFinanceiro({ isAdmin: true }),
        listProfiles(),
      ])
      setReservations(reservationData)
      setEnrollments(enrollmentData)
      setFinanceiro(financeiroData)
      setProfiles(profileData)
      setError('')
    } catch (loadError) {
      setError(loadError.message || 'Nao foi possivel carregar o painel admin.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleCancel(id) {
    setCancellingId(id)
    setError('')
    setFeedback('')
    try {
      await cancelReservation(id)
      setFeedback('Reserva cancelada pelo admin com sucesso.')
      await loadData(filters)
    } catch (cancelError) {
      setError(cancelError.message || 'Nao foi possivel cancelar a reserva.')
    } finally {
      setCancellingId('')
    }
  }

  async function handleRegisterPayment(event) {
    event.preventDefault()
    setSavingPayment(true)
    setError('')
    setFeedback('')

    try {
      if (!paymentForm.alunoId || !paymentForm.modalidade || !paymentForm.valor || !paymentForm.dataPagamento) {
        throw new Error('Preencha aluno, modalidade, valor e data do pagamento.')
      }

      const payload = buildFinanceiroPayload(paymentForm)
      await createFinanceiro(payload)
      setFeedback('Pagamento registrado com sucesso. O proximo vencimento foi calculado automaticamente.')
      setPaymentForm(initialPaymentForm)
      await loadData(filters)
    } catch (paymentError) {
      setError(paymentError.message || 'Nao foi possivel registrar este pagamento.')
    } finally {
      setSavingPayment(false)
    }
  }

  const profileById = useMemo(() => {
    return profiles.reduce((accumulator, profile) => {
      accumulator[profile.id] = profile
      return accumulator
    }, {})
  }, [profiles])

  const latestFinanceByAluno = useMemo(() => {
    return financeiro.reduce((accumulator, registro) => {
      const financeKey = getFinanceAlunoKey(registro)
      if (!financeKey) return accumulator

      const current = accumulator[financeKey]
      if (!current || getFinanceSortValue(registro) > getFinanceSortValue(current)) {
        accumulator[financeKey] = registro
      }
      return accumulator
    }, {})
  }, [financeiro])

  const enrolledStudents = useMemo(() => {
    const grouped = new Map()

    enrollments.forEach((enrollment) => {
      const enrollmentKey = getEnrollmentUserKey(enrollment) || enrollment.email || enrollment.nome
      if (!grouped.has(enrollmentKey)) {
        grouped.set(enrollmentKey, enrollment)
      }
    })

    return Array.from(grouped.entries()).map(([rawKey, enrollment]) => {
      const profile = profileById[rawKey] || profiles.find((item) => item.email && enrollment.email && item.email === enrollment.email) || null
      const effectiveUserId = profile?.id || rawKey
      const latestFinance = latestFinanceByAluno[effectiveUserId] || null
      const financeStatus = latestFinance
        ? getFinanceiroStatus(latestFinance)
        : { key: 'pendente', label: 'Sem pagamento', detail: 'Nenhum pagamento registrado ainda.' }

      return {
        userId: effectiveUserId,
        nome: profile?.nome || enrollment.nome || 'Aluno',
        email: profile?.email || enrollment.email || '',
        telefone: profile?.telefone || enrollment.telefone || '',
        modalidade: latestFinance?.modalidade || enrollment.modalidade || 'Matricula ativa',
        ultimoPagamento: latestFinance?.data_ultimo_pagamento || null,
        proximoVencimento: latestFinance?.proximo_vencimento || null,
        valor: latestFinance?.valor ? Number(latestFinance.valor) : null,
        observacoes: latestFinance?.observacoes || '',
        financeiroId: latestFinance?.id || '',
        status: financeStatus,
        ...getDueContext(latestFinance?.proximo_vencimento || ''),
      }
    }).sort((a, b) => a.nome.localeCompare(b.nome))
  }, [enrollments, profileById, latestFinanceByAluno, profiles])

  const latestFinanceRecords = useMemo(() => Object.values(latestFinanceByAluno), [latestFinanceByAluno])

  const financialSummary = useMemo(() => {
    const now = new Date()
    const faturamentoPrevistoMes = latestFinanceRecords.reduce((sum, registro) => {
      if (!registro?.proximo_vencimento || !isSameMonth(parseISO(`${registro.proximo_vencimento}T00:00:00`), now)) return sum
      return sum + Number(registro.valor || 0)
    }, 0)

    const faturamentoRecebidoMes = financeiro.reduce((sum, registro) => {
      if (!registro?.data_ultimo_pagamento || !isSameMonth(parseISO(`${registro.data_ultimo_pagamento}T00:00:00`), now)) return sum
      return sum + Number(registro.valor || 0)
    }, 0)

    return {
      faturamentoPrevistoMes,
      faturamentoRecebidoMes,
      alunosInadimplentes: enrolledStudents.filter((student) => student.status.key === 'vencido').length,
      alunosVencendo7Dias: enrolledStudents.filter((student) => student.daysUntilDue !== null && student.daysUntilDue >= 0 && student.daysUntilDue <= 7).length,
    }
  }, [enrolledStudents, financeiro, latestFinanceRecords])

  const dueThisWeekStudents = useMemo(() => {
    return enrolledStudents
      .filter((student) => student.daysUntilDue !== null && student.daysUntilDue >= 0 && student.daysUntilDue <= 7)
      .sort((a, b) => (a.daysUntilDue ?? 99) - (b.daysUntilDue ?? 99) || a.nome.localeCompare(b.nome))
  }, [enrolledStudents])

  const overdueStudents = useMemo(() => {
    return enrolledStudents
      .filter((student) => student.status.key === 'vencido')
      .sort((a, b) => (a.daysUntilDue ?? 0) - (b.daysUntilDue ?? 0) || a.nome.localeCompare(b.nome))
  }, [enrolledStudents])

  const filteredEnrolledStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase()

    return enrolledStudents
      .filter((student) => {
        const matchesName = !query
          || student.nome.toLowerCase().includes(query)
          || student.telefone.toLowerCase().includes(query)
          || student.modalidade.toLowerCase().includes(query)
          || student.email.toLowerCase().includes(query)
        const matchesStatus = studentStatusFilter === 'todos' || student.status.key === studentStatusFilter
        return matchesName && matchesStatus
      })
      .sort((a, b) => {
        const priorityDiff = (studentStatusPriority[a.status.key] ?? 99) - (studentStatusPriority[b.status.key] ?? 99)
        if (priorityDiff !== 0) return priorityDiff
        return a.nome.localeCompare(b.nome)
      })
  }, [enrolledStudents, studentSearch, studentStatusFilter])

  const selectedStudent = useMemo(() => {
    return enrolledStudents.find((student) => student.userId === selectedStudentId) || null
  }, [enrolledStudents, selectedStudentId])

  useEffect(() => {
    if (!enrolledStudents.length) {
      setSelectedStudentId('')
      setIsDrawerOpen(false)
      return
    }

    if (selectedStudentId && !enrolledStudents.some((student) => student.userId === selectedStudentId)) {
      setSelectedStudentId('')
      setIsDrawerOpen(false)
    }
  }, [enrolledStudents, selectedStudentId])

  useEffect(() => {
    if (!selectedStudent) {
      setStudentEditor(initialStudentEditor)
      return
    }

    setStudentEditor({
      telefone: selectedStudent.telefone || '',
      modalidade: selectedStudent.modalidade || '',
      valor: selectedStudent.valor ? String(selectedStudent.valor) : '',
      dataPagamento: selectedStudent.ultimoPagamento || '',
      observacoes: selectedStudent.observacoes || '',
    })
  }, [selectedStudent])

  const totalStudentPages = Math.max(1, Math.ceil(filteredEnrolledStudents.length / STUDENTS_PER_PAGE))

  useEffect(() => {
    if (studentPage > totalStudentPages) {
      setStudentPage(1)
    }
  }, [studentPage, totalStudentPages])

  const paginatedStudents = useMemo(() => {
    const startIndex = (studentPage - 1) * STUDENTS_PER_PAGE
    return filteredEnrolledStudents.slice(startIndex, startIndex + STUDENTS_PER_PAGE)
  }, [filteredEnrolledStudents, studentPage])

  const activeReservations = useMemo(() => reservations.filter((item) => item.status !== 'cancelada'), [reservations])

  const reservationDayOptions = useMemo(() => buildReservationDayOptions(activeReservations), [activeReservations])

  const reservationCountByDay = useMemo(() => {
    return activeReservations.reduce((accumulator, reservation) => {
      accumulator[reservation.data_reserva] = (accumulator[reservation.data_reserva] || 0) + 1
      return accumulator
    }, {})
  }, [activeReservations])

  useEffect(() => {
    if (!reservationDayOptions.length) {
      setSelectedReservationDay('')
      return
    }

    if (!selectedReservationDay || !reservationDayOptions.some((option) => option.value === selectedReservationDay)) {
      setSelectedReservationDay(reservationDayOptions[0].value)
    }
  }, [reservationDayOptions, selectedReservationDay])

  const reservationsForSelectedDay = useMemo(() => {
    if (!selectedReservationDay) return []
    return activeReservations.filter((reservation) => reservation.data_reserva === selectedReservationDay)
  }, [activeReservations, selectedReservationDay])


  const todayDateString = new Date().toISOString().slice(0, 10)

  const currentDateLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date())

  const stats = useMemo(() => ({
    reservationsToday: activeReservations.filter((item) => item.data_reserva === todayDateString).length,
  }), [activeReservations, todayDateString])

  function openStudentEditor(student) {
    if (selectedStudentId === student.userId && !showPaymentDrawer) {
      setSelectedStudentId('')
      setIsDrawerOpen(false)
      return
    }
    setSelectedStudentId(student.userId)
    setShowPaymentDrawer(false)
    setIsDrawerOpen(true)
  }

  function openPaymentDrawer(student = null) {
    if (student) {
      setSelectedStudentId(student.userId)
      fillQuickPayment(student)
    } else {
      setSelectedStudentId('')
      setPaymentForm(initialPaymentForm)
    }
    setShowPaymentDrawer(true)
    setIsDrawerOpen(true)
  }

  function closeDrawer() {
    setSelectedStudentId('')
    setShowPaymentDrawer(false)
    setIsDrawerOpen(false)
    setPaymentForm(initialPaymentForm)
  }

  function fillQuickPayment(student) {
    setShowPaymentDrawer(true)
    setIsDrawerOpen(true)
    setPaymentForm({
      alunoId: student.userId,
      modalidade: student.modalidade && student.modalidade !== 'Matricula ativa' ? student.modalidade : '',
      valor: student.valor || '',
      dataPagamento: '',
      observacoes: student.observacoes || '',
    })
  }

  async function handleSaveStudent(event) {
    event.preventDefault()
    if (!selectedStudent) return

    setSavingStudentEdit(true)
    setError('')
    setFeedback('')

    try {
      if (selectedStudent.userId && studentEditor.telefone !== selectedStudent.telefone) {
        await updateProfile(selectedStudent.userId, { telefone: studentEditor.telefone })
      }

      const hasFinanceData = Boolean(studentEditor.dataPagamento || studentEditor.modalidade || studentEditor.valor)
      if (hasFinanceData) {
        if (!studentEditor.dataPagamento || !studentEditor.modalidade || !studentEditor.valor) {
          throw new Error('Para corrigir o pagamento, preencha modalidade, valor e data do pagamento.')
        }

        const payload = buildFinanceiroPayload({
          alunoId: selectedStudent.userId,
          modalidade: studentEditor.modalidade,
          valor: studentEditor.valor,
          dataPagamento: studentEditor.dataPagamento,
          observacoes: studentEditor.observacoes,
        })

        if (selectedStudent.financeiroId) {
          await updateFinanceiro(selectedStudent.financeiroId, payload)
        } else {
          await createFinanceiro(payload)
        }
      }

      setFeedback('Dados do aluno atualizados com sucesso.')
      await loadData(filters)
    } catch (saveError) {
      setError(saveError.message || 'Nao foi possivel atualizar os dados do aluno.')
    } finally {
      setSavingStudentEdit(false)
    }
  }
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-700">Admin Arena ABS</p>
            <h1 className="mt-2 text-3xl font-black text-ink-950">Painel operacional</h1>
            <p className="mt-1 text-sm text-slate-500">{currentDateLabel}. Controle alunos, cobrancas e reservas com uma visao mais comercial.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="secondary-btn !px-4 !py-2.5" onClick={() => navigate('/matricula')}>
              Novo aluno
            </button>
            <button type="button" className="secondary-btn !px-4 !py-2.5" onClick={() => navigate('/quadras')}>
              Nova reserva
            </button>
            <button type="button" className="primary-btn !px-4 !py-2.5" onClick={() => openPaymentDrawer()}>
              Registrar pagamento
            </button>
          </div>
        </div>
      </section>

      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {feedback ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</p> : null}

      <section className="rounded-[28px] border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <article className="rounded-2xl bg-white px-4 py-3 ring-1 ring-brand-100">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-brand-700">Previsto no mes</p>
            <strong className="mt-2 block text-2xl font-black text-ink-950">{formatCurrency(financialSummary.faturamentoPrevistoMes)}</strong>
          </article>
          <article className="rounded-2xl bg-white px-4 py-3 ring-1 ring-emerald-100">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">Recebido no mes</p>
            <strong className="mt-2 block text-2xl font-black text-emerald-700">{formatCurrency(financialSummary.faturamentoRecebidoMes)}</strong>
          </article>
          <article className="rounded-2xl bg-white px-4 py-3 ring-1 ring-rose-100">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-rose-700">Inadimplentes</p>
            <strong className="mt-2 block text-2xl font-black text-rose-700">{financialSummary.alunosInadimplentes}</strong>
          </article>
          <article className="rounded-2xl bg-white px-4 py-3 ring-1 ring-amber-100">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-amber-700">Vencem em 7 dias</p>
            <strong className="mt-2 block text-2xl font-black text-amber-700">{financialSummary.alunosVencendo7Dias}</strong>
          </article>
          <article className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">Reservas hoje</p>
            <strong className="mt-2 block text-2xl font-black text-slate-700">{stats.reservationsToday}</strong>
          </article>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[28px] border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">Financeiro</p>
              <h2 className="mt-2 text-2xl font-black text-ink-950">Vencem hoje ou nesta semana</h2>
              <p className="mt-1 text-sm text-slate-600">Priorize quem precisa de contato antes do vencimento.</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-amber-700 ring-1 ring-amber-200">{dueThisWeekStudents.length}</span>
          </div>

          <div className="mt-4 space-y-3">
            {!loading && !dueThisWeekStudents.length ? (
              <EmptyState title="Nenhum vencimento nesta semana" description="Os proximos avisos financeiros vao aparecer aqui automaticamente." />
            ) : null}
            {dueThisWeekStudents.slice(0, 6).map((student) => (
              <AlertStudentCard key={student.userId} student={student} onEdit={openStudentEditor} onPay={openPaymentDrawer} />
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-rose-200 bg-rose-50/60 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-700">Cobranca</p>
              <h2 className="mt-2 text-2xl font-black text-ink-950">Alunos vencidos</h2>
              <p className="mt-1 text-sm text-slate-600">Lista pronta para cobrar com acoes rapidas.</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-rose-700 ring-1 ring-rose-200">{overdueStudents.length}</span>
          </div>

          <div className="mt-4 space-y-3">
            {!loading && !overdueStudents.length ? (
              <EmptyState title="Nenhum aluno em atraso" description="Quando houver inadimplencia, os casos criticos aparecem aqui com atalho para cobranca." />
            ) : null}
            {overdueStudents.slice(0, 6).map((student) => (
              <AlertStudentCard key={student.userId} student={student} onEdit={openStudentEditor} onPay={openPaymentDrawer} />
            ))}
          </div>
        </section>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_380px] xl:items-start">
        <div className="space-y-4">
          <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-700">Alunos</p>
                  <h2 className="mt-2 text-2xl font-black text-ink-950">Controle de alunos matriculados</h2>
                  <p className="mt-1 text-sm text-slate-500">Leitura horizontal, acoes diretas e densidade de informacao para operacao diaria.</p>
                </div>

                <div className="w-full xl:max-w-[680px]">
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
                    <Search size={16} className="shrink-0 text-slate-400" />
                    <input
                      className="w-full min-w-0 border-0 bg-transparent p-0 text-sm text-ink-950 outline-none placeholder:text-slate-400"
                      placeholder="Buscar por nome, telefone, modalidade ou e-mail"
                      value={studentSearch}
                      onChange={(event) => setStudentSearch(event.target.value)}
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {studentStatusFilterOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setStudentStatusFilter(option.value)}
                        className={studentStatusFilter === option.value ? 'primary-btn !px-4 !py-2.5' : 'secondary-btn !px-4 !py-2.5'}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {loading ? <LoadingState title="Carregando alunos matriculados" /> : null}
            {!loading && enrolledStudents.length === 0 ? (
              <div className="px-5 py-6">
                <EmptyState title="Sem alunos matriculados" description="Quando os alunos enviarem matriculas, a listagem operacional aparece aqui automaticamente." />
              </div>
            ) : null}

            {!loading && enrolledStudents.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <div className="min-w-[1420px]">
                    <div className="grid grid-cols-[minmax(230px,1.45fr)_130px_110px_110px_120px_120px_130px_300px] gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                      <span>Nome</span>
                      <span>Telefone</span>
                      <span>Modalidade</span>
                      <span>Valor</span>
                      <span>Ultimo pagamento</span>
                      <span>Proximo vencimento</span>
                      <span>Status</span>
                      <span className="text-right">Acoes</span>
                    </div>

                    {paginatedStudents.length === 0 ? (
                      <div className="px-5 py-8 text-sm text-slate-500">Nenhum aluno encontrado com esse filtro.</div>
                    ) : (
                      paginatedStudents.map((student) => (
                        <article key={student.userId} className="border-b border-slate-100 last:border-b-0">
                          <div className="grid grid-cols-[minmax(230px,1.45fr)_130px_110px_110px_120px_120px_130px_300px] gap-3 px-5 py-4 text-sm">
                            <div className="min-w-0 text-left">
                              <p className={`truncate font-semibold ${selectedStudentId === student.userId && isDrawerOpen ? 'text-brand-700' : 'text-ink-950'}`}>{student.nome}</p>
                              <p className="truncate text-xs text-slate-500">{student.email || 'Sem e-mail'}</p>
                            </div>
                            <p className="truncate text-slate-600">{student.telefone || 'Sem telefone'}</p>
                            <p className="truncate text-slate-600">{student.modalidade || '-'}</p>
                            <p className="font-semibold text-ink-950">{student.valor ? formatCurrency(student.valor) : '-'}</p>
                            <p className="text-slate-600">{formatPaymentDate(student.ultimoPagamento)}</p>
                            <p className="text-slate-600">{formatPaymentDate(student.proximoVencimento)}</p>
                            <div className="space-y-2">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStudentStatusPill(student.status.key)}`}>{student.status.label}</span>
                              <p className="text-xs text-slate-500">{student.detail}</p>
                            </div>
                            <QuickActions student={student} onEdit={openStudentEditor} onPay={openPaymentDrawer} compact />
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>

                {totalStudentPages > 1 ? (
                  <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm text-slate-600">
                    <span>{((studentPage - 1) * STUDENTS_PER_PAGE) + 1}-{Math.min(studentPage * STUDENTS_PER_PAGE, filteredEnrolledStudents.length)} de {filteredEnrolledStudents.length}</span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setStudentPage((current) => Math.max(1, current - 1))} disabled={studentPage === 1} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-brand-200 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Pagina anterior">
                        <ChevronLeft size={16} />
                      </button>
                      <button type="button" onClick={() => setStudentPage((current) => Math.min(totalStudentPages, current + 1))} disabled={studentPage === totalStudentPages} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-brand-200 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Proxima pagina">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6">
          <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-700">Reservas</p>
              <h2 className="mt-2 text-2xl font-black text-ink-950">Agenda do dia</h2>
              <p className="mt-1 text-sm text-slate-500">Lista cronologica para bater o olho rapido na operacao da quadra.</p>
            </div>

            {reservationDayOptions.length ? (
              <div className="flex gap-2 overflow-x-auto border-b border-slate-200 px-5 py-3">
                {reservationDayOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedReservationDay(option.value)}
                    className={selectedReservationDay === option.value ? 'primary-btn !px-4 !py-2.5 whitespace-nowrap' : 'secondary-btn !px-4 !py-2.5 whitespace-nowrap'}
                  >
                    {option.label} ({reservationCountByDay[option.value] || 0})
                  </button>
                ))}
              </div>
            ) : null}

            <div className="px-5 py-4">
              {loading ? <LoadingState title="Carregando reservas" /> : null}
              {!loading && !reservationDayOptions.length ? <EmptyState title="Nenhuma reserva encontrada" description="As reservas ativas vao aparecer aqui organizadas por dia." /> : null}
              {!loading && reservationDayOptions.length ? (
                <div className="space-y-3">
                  {reservationsForSelectedDay.map((reservation) => (
                    <article key={reservation.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-brand-700">{reservation.horario}</span>
                            <StatusBadge status={reservation.status} />
                          </div>
                          <p className="mt-3 text-sm font-semibold text-ink-950">{reservation.nome}</p>
                          <div className="mt-2 space-y-1 text-sm text-slate-600">
                            <p>{reservation.telefone || 'Sem telefone'}</p>
                            <p>{reservation.user_id ? 'Aluno' : 'Visitante'} · {reservation.quadra}</p>
                          </div>
                        </div>
                        <button type="button" className="secondary-btn !px-3 !py-2 text-xs" disabled={cancellingId === reservation.id} onClick={() => handleCancel(reservation.id)}>
                          {cancellingId === reservation.id ? 'Cancelando...' : 'Cancelar'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        </aside>
      </section>

      {isDrawerOpen ? (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/20 backdrop-blur-[1px]">
          <button type="button" className="flex-1" aria-label="Fechar painel" onClick={closeDrawer} />
          <aside className="relative z-50 h-full w-full max-w-[440px] overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 border-b border-slate-200 bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-700">{showPaymentDrawer ? 'Pagamento rapido' : 'Detalhes do aluno'}</p>
                  <h3 className="mt-2 text-2xl font-black text-ink-950">{showPaymentDrawer ? (selectedStudent?.nome || 'Registrar pagamento manual') : selectedStudent?.nome}</h3>
                  <p className="mt-1 text-sm text-slate-500">{showPaymentDrawer ? 'Selecione aluno, modalidade, valor e data de pagamento.' : (selectedStudent?.email || 'Sem e-mail cadastrado')}</p>
                </div>
                <button type="button" className="secondary-btn !px-3 !py-2 text-xs" onClick={closeDrawer}>Fechar</button>
              </div>
            </div>

            <div className="space-y-5 px-5 py-5">
              {selectedStudent && !showPaymentDrawer ? (
                <>
                  <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Telefone</p>
                        <p className="mt-1 text-sm text-ink-950">{selectedStudent.telefone || 'Nao informado'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Modalidade</p>
                        <p className="mt-1 text-sm text-ink-950">{selectedStudent.modalidade || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Valor</p>
                        <p className="mt-1 text-sm text-ink-950">{selectedStudent.valor ? formatCurrency(selectedStudent.valor) : '-'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Status</p>
                        <div className="mt-1">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStudentStatusPill(selectedStudent.status.key)}`}>{selectedStudent.status.label}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Ultimo pagamento</p>
                        <p className="mt-1 text-sm text-ink-950">{formatPaymentDate(selectedStudent.ultimoPagamento)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Proximo vencimento</p>
                        <p className="mt-1 text-sm text-ink-950">{formatPaymentDate(selectedStudent.proximoVencimento)}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <QuickActions student={selectedStudent} onEdit={openStudentEditor} onPay={openPaymentDrawer} />
                    </div>
                  </section>

                  <form className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4" onSubmit={handleSaveStudent}>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-700">Editar dados</p>
                      <p className="mt-1 text-sm text-slate-500">Atualize cadastro e financeiro sem sair do admin.</p>
                    </div>
                    <input className="input-shell mt-0" placeholder="Telefone" value={studentEditor.telefone} onChange={(event) => setStudentEditor((current) => ({ ...current, telefone: event.target.value }))} />
                    <select className="input-shell mt-0" value={studentEditor.modalidade} onChange={(event) => setStudentEditor((current) => ({ ...current, modalidade: event.target.value }))}>
                      <option value="">Selecione a modalidade</option>
                      {modalidadeOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input className="input-shell mt-0" type="number" step="0.01" placeholder="Valor" value={studentEditor.valor} onChange={(event) => setStudentEditor((current) => ({ ...current, valor: event.target.value }))} />
                      <input className="input-shell mt-0" type="date" value={studentEditor.dataPagamento} onChange={(event) => setStudentEditor((current) => ({ ...current, dataPagamento: event.target.value }))} />
                    </div>
                    <textarea className="input-shell mt-0 resize-none" placeholder="Observacoes" value={studentEditor.observacoes} onChange={(event) => setStudentEditor((current) => ({ ...current, observacoes: event.target.value }))} />
                    <button className="primary-btn w-full" type="submit" disabled={savingStudentEdit}>{savingStudentEdit ? 'Salvando...' : 'Salvar alteracoes'}</button>
                  </form>
                </>
              ) : null}

              <form className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4" onSubmit={handleRegisterPayment}>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-700">Registrar pagamento</p>
                  <p className="mt-1 text-sm text-slate-500">O sistema calcula o proximo vencimento automaticamente.</p>
                </div>
                <select className="input-shell mt-0" value={paymentForm.alunoId} onChange={(event) => setPaymentForm((current) => ({ ...current, alunoId: event.target.value }))}>
                  <option value="">Selecione o aluno</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>{profile.nome || profile.email}</option>
                  ))}
                </select>
                <select className="input-shell mt-0" value={paymentForm.modalidade} onChange={(event) => setPaymentForm((current) => ({ ...current, modalidade: event.target.value }))}>
                  <option value="">Selecione a modalidade</option>
                  {modalidadeOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="input-shell mt-0" type="number" step="0.01" placeholder="Valor" value={paymentForm.valor} onChange={(event) => setPaymentForm((current) => ({ ...current, valor: event.target.value }))} />
                  <input className="input-shell mt-0" type="date" value={paymentForm.dataPagamento} onChange={(event) => setPaymentForm((current) => ({ ...current, dataPagamento: event.target.value }))} />
                </div>
                <textarea className="input-shell mt-0 resize-none" placeholder="Observacoes (opcional)" value={paymentForm.observacoes} onChange={(event) => setPaymentForm((current) => ({ ...current, observacoes: event.target.value }))} />
                <button className="primary-btn w-full" type="submit" disabled={savingPayment}>{savingPayment ? 'Salvando...' : 'Registrar pagamento'}</button>
              </form>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  )
}















