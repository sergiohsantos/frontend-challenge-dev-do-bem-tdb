"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, ArrowLeft, Loader2, Save, Plus, Trash2, Calendar } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { getToken, getUser } from "@/lib/auth"
import { toast } from "sonner"

interface TimeSlot {
  id: string
  start: string
  end: string
}

interface DayAvailability {
  day: string
  dayName: string
  enabled: boolean
  slots: TimeSlot[]
}

type AvailabilityApiPayload = Record<string, { enabled?: boolean; slots?: Array<{ start?: string; end?: string }> }>

const daysOfWeek = [
  { day: "monday", name: "Segunda-feira" },
  { day: "tuesday", name: "Terça-feira" },
  { day: "wednesday", name: "Quarta-feira" },
  { day: "thursday", name: "Quinta-feira" },
  { day: "friday", name: "Sexta-feira" },
  { day: "saturday", name: "Sábado" },
  { day: "sunday", name: "Domingo" },
]

const timeOptions = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00",
]

const STORAGE_KEY = "tdb_volunteer_availability"

function defaultAvailability(): DayAvailability[] {
  return daysOfWeek.map((d) => ({
    day: d.day,
    dayName: d.name,
    enabled: false,
    slots: [],
  }))
}

function normalizeArrayPayload(data: unknown): DayAvailability[] | null {
  if (!Array.isArray(data)) return null
  const baseMap = new Map(daysOfWeek.map((item) => [item.day, item.name]))
  return data.map((item, index) => {
    const row = item as Partial<DayAvailability>
    const day = typeof row.day === "string" ? row.day : daysOfWeek[index]?.day || `day-${index}`
    return {
      day,
      dayName: typeof row.dayName === "string" ? row.dayName : baseMap.get(day) || day,
      enabled: Boolean(row.enabled),
      slots: Array.isArray(row.slots)
        ? row.slots.map((slot, slotIndex) => ({
            id: (slot as Partial<TimeSlot>).id || `${day}-${slotIndex}-${Date.now()}`,
            start: typeof (slot as Partial<TimeSlot>).start === "string" ? (slot as Partial<TimeSlot>).start! : "09:00",
            end: typeof (slot as Partial<TimeSlot>).end === "string" ? (slot as Partial<TimeSlot>).end! : "17:00",
          }))
        : [],
    }
  })
}

function normalizeObjectPayload(data: unknown): DayAvailability[] | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null
  const payload = data as AvailabilityApiPayload
  return daysOfWeek.map(({ day, name }) => {
    const source = payload[day] || {}
    const rawSlots = Array.isArray(source.slots) ? source.slots : []
    return {
      day,
      dayName: name,
      enabled: Boolean(source.enabled),
      slots: rawSlots.map((slot, index) => ({
        id: `${day}-${index}-${slot.start || "09:00"}`,
        start: typeof slot.start === "string" ? slot.start : "09:00",
        end: typeof slot.end === "string" ? slot.end : "17:00",
      })),
    }
  })
}

function loadAvailabilityFromStorage(): DayAvailability[] | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    return normalizeArrayPayload(parsed)
  } catch {
    return null
  }
}

function persistAvailability(value: DayAvailability[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
}

function toApiPayload(value: DayAvailability[]): AvailabilityApiPayload {
  return value.reduce<AvailabilityApiPayload>((acc, item) => {
    acc[item.day] = {
      enabled: item.enabled,
      slots: item.enabled
        ? item.slots.map((slot) => ({ start: slot.start, end: slot.end }))
        : [],
    }
    return acc
  }, {})
}

export default function VoluntarioDisponibilidadePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [availability, setAvailability] = useState<DayAvailability[]>([])
  const user = getUser()

  useEffect(() => {
    void fetchAvailability()
  }, [])

  async function fetchAvailability() {
    setLoading(true)
    try {
      const token = getToken()
      const data = await apiFetch<unknown>("/api/volunteers/availability", {}, token)
      const normalized = normalizeArrayPayload(data) || normalizeObjectPayload(data) || loadAvailabilityFromStorage() || defaultAvailability()
      setAvailability(normalized)
      persistAvailability(normalized)
    } catch (error) {
      console.error("Erro ao carregar disponibilidade:", error)
      const fallback = loadAvailabilityFromStorage() || defaultAvailability()
      setAvailability(fallback)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const token = getToken()
      const payload = toApiPayload(availability)
      await apiFetch("/api/volunteers/availability", {
        method: "PUT",
        body: JSON.stringify(payload),
      }, token)
      persistAvailability(availability)
      toast.success("Disponibilidade salva com sucesso")
    } catch (error) {
      console.error("Erro ao salvar:", error)
      persistAvailability(availability)
      toast.success("Disponibilidade salva no navegador e mantida após refresh")
    } finally {
      setSaving(false)
    }
  }

  function toggleDay(day: string) {
    setAvailability((prev) => {
      const next = prev.map((d) => {
        if (d.day !== day) return d
        const enabled = !d.enabled
        return {
          ...d,
          enabled,
          slots: enabled ? (d.slots.length > 0 ? d.slots : [{ id: `${day}-${Date.now()}`, start: "09:00", end: "17:00" }]) : [],
        }
      })
      persistAvailability(next)
      return next
    })
  }

  function addSlot(day: string) {
    setAvailability((prev) => {
      const next = prev.map((d) => d.day === day ? {
        ...d,
        slots: [...d.slots, { id: `${day}-${Date.now()}`, start: "09:00", end: "17:00" }],
      } : d)
      persistAvailability(next)
      return next
    })
  }

  function removeSlot(day: string, slotId: string) {
    setAvailability((prev) => {
      const next = prev.map((d) => d.day === day ? { ...d, slots: d.slots.filter((s) => s.id !== slotId) } : d)
      persistAvailability(next)
      return next
    })
  }

  function updateSlot(day: string, slotId: string, field: "start" | "end", value: string) {
    setAvailability((prev) => {
      const next = prev.map((d) => d.day === day ? {
        ...d,
        slots: d.slots.map((s) => s.id === slotId ? { ...s, [field]: value } : s),
      } : d)
      persistAvailability(next)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader userName={user?.full_name || "Voluntário"} userType="voluntario" notificationCount={0} />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader userName={user?.full_name || "Voluntário"} userType="voluntario" notificationCount={0} />
      <main className="flex-1 py-6 lg:py-8">
        <div className="container mx-auto px-4">
          <div className="mb-4 flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/voluntario">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Disponibilidade
              </CardTitle>
              <CardDescription>
                Configure seus horários disponíveis para atendimento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {availability.map((dayData) => (
                <div key={dayData.day} className="rounded-lg border p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Switch
                        id={`switch-${dayData.day}`}
                        checked={dayData.enabled}
                        onCheckedChange={() => toggleDay(dayData.day)}
                      />
                      <Label
                        htmlFor={`switch-${dayData.day}`}
                        className={dayData.enabled ? "font-medium" : "text-muted-foreground"}
                      >
                        {dayData.dayName}
                      </Label>
                    </div>
                    {dayData.enabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addSlot(dayData.day)}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar horário
                      </Button>
                    )}
                  </div>

                  {dayData.enabled && dayData.slots.length > 0 && (
                    <div className="space-y-3 pl-10">
                      {dayData.slots.map((slot) => (
                        <div key={slot.id} className="flex flex-wrap items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <Select
                            value={slot.start}
                            onValueChange={(value) => updateSlot(dayData.day, slot.id, "start", value)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-muted-foreground">até</span>
                          <Select
                            value={slot.end}
                            onValueChange={(value) => updateSlot(dayData.day, slot.id, "end", value)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {dayData.slots.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSlot(dayData.day, slot.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
