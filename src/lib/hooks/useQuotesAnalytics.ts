// src/lib/hooks/useQuotesAnalytics.ts
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSupabase } from './useSupabase'
import { QuoteStatusData } from '@/types/analytics'

export const useQuotesAnalytics = () => {
  const { user, supabase } = useSupabase()
  const [data, setData] = useState<QuoteStatusData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const { data: rows, error } = await supabase
        .from('quotes')
        .select('status')
        .eq('user_id', user.id)

      if (error) throw error

      const counts: Record<string, number> = {}
      rows?.forEach(row => {
        counts[row.status] = (counts[row.status] || 0) + 1
      })

      const result: QuoteStatusData[] = Object.entries(counts).map(([status, count]) => ({
        status,
        count
      }))

      setData(result)
    } catch (err) {
      console.error('Error fetching quote analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, fetchData])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('quotes-analytics')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quotes', filter: `user_id=eq.${user.id}` },
        fetchData
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase, fetchData])

  return { data, loading, error, refetch: fetchData }
}
