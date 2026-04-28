'use client'

import { useEffect, useMemo, useState } from 'react'
import { Mail, Bell } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import {
  getNotificationPreferencesAction,
  setEmailNotificationPreferenceAction,
} from '@/app/actions/notification-preference'
import {
  getNotificationTypeLabel,
  type NotificationChannelPreference,
} from '@/lib/entities/notification'
import { useToast } from '@/hooks/use-toast'

interface NotificationPreferencesProps {
  userId: string
}

export function NotificationPreferences({ userId }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationChannelPreference[]>([])
  const [loading, setLoading] = useState(true)
  const [savingType, setSavingType] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      const data = await getNotificationPreferencesAction(userId)
      if (active) {
        setPreferences(data)
        setLoading(false)
      }
    }

    if (userId) {
      load()
    } else {
      setLoading(false)
    }

    return () => {
      active = false
    }
  }, [userId])

  const orderedPreferences = useMemo(
    () =>
      [...preferences].sort((a, b) =>
        getNotificationTypeLabel(a.type).localeCompare(getNotificationTypeLabel(b.type))
      ),
    [preferences]
  )

  const toggleEmailPreference = async (
    type: NotificationChannelPreference['type'],
    nextValue: boolean
  ) => {
    setSavingType(type)
    setPreferences((prev) =>
      prev.map((pref) =>
        pref.type === type ? { ...pref, email_enabled: nextValue } : pref
      )
    )

    const ok = await setEmailNotificationPreferenceAction(userId, type, nextValue)
    setSavingType(null)

    if (!ok) {
      setPreferences((prev) =>
        prev.map((pref) =>
          pref.type === type ? { ...pref, email_enabled: !nextValue } : pref
        )
      )
      toast({
        title: 'Could not save notification preference',
        description: 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Loading notification preferences...</p>
      </div>
    )
  }

  if (orderedPreferences.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">No notification preferences available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b pb-2 text-xs text-muted-foreground">
        <span>Notification type</span>
        <span className="inline-flex items-center gap-1">
          <Bell className="h-3.5 w-3.5" />
          In-app
        </span>
        <span className="inline-flex items-center gap-1">
          <Mail className="h-3.5 w-3.5" />
          Email
        </span>
      </div>

      {orderedPreferences.map((pref) => (
        <div
          key={pref.type}
          className="grid grid-cols-[1fr_auto_auto] items-center gap-3"
        >
          <div>
            <p className="text-sm font-medium text-foreground">
              {getNotificationTypeLabel(pref.type)}
            </p>
          </div>

          <div className="flex items-center justify-center">
            <Switch checked disabled aria-label={`${pref.type}-in-app-enabled`} />
          </div>

          <div className="flex items-center justify-center">
            <Switch
              checked={pref.email_enabled}
              disabled={savingType === pref.type}
              onCheckedChange={(checked) => toggleEmailPreference(pref.type, Boolean(checked))}
              aria-label={`${pref.type}-email-enabled`}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
