// src/lib/hooks/useDashboard.ts
'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSupabase } from './useSupabase'

interface DashboardStats {
  totalInvoices: number
  totalRevenue: number
  outstandingAmount: number
  activeClients: number
  pendingQuotes: number
  overdueInvoices: number
  paidInvoices: number
  projectsInProgress: number
}

interface RecentActivity {
  id: string
  type: 'invoice_sent' | 'payment_received' | 'client_added' | 'quote_created' | 'project_updated'
  title: string
  description: string
  timestamp: string
  icon: string
}

interface UpcomingItem {
  id: string
  title: string
  description: string
  dueDate: string
  type: 'invoice_due' | 'project_deadline' | 'quote_expiry'
  isOverdue: boolean
}

interface DashboardData {
  stats: DashboardStats
  recentActivity: RecentActivity[]
  upcomingItems: UpcomingItem[]
  loading: boolean
  error: string | null
}

export const useDashboard = () => {
  const { user, supabase } = useSupabase()
  const [data, setData] = useState<DashboardData>({
    stats: {
      totalInvoices: 0,
      totalRevenue: 0,
      outstandingAmount: 0,
      activeClients: 0,
      pendingQuotes: 0,
      overdueInvoices: 0,
      paidInvoices: 0,
      projectsInProgress: 0
    },
    recentActivity: [],
    upcomingItems: [],
    loading: true,
    error: null
  })

  const fetchDashboardStats = useCallback(async () => {
    if (!user) return

    try {
      // Fetch invoice statistics
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('total_amount, amount_paid, status, payment_status, due_date, created_at, issued_date')
        .eq('user_id', user.id)

      if (invoicesError) throw invoicesError

      // Fetch client count
      const { count: clientCount, error: clientsError } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (clientsError) throw clientsError

      // Fetch quote statistics
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select('status, created_at')
        .eq('user_id', user.id)

      if (quotesError) throw quotesError

      // Fetch project statistics
      const { count: projectsInProgress, error: projectsError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['in_progress', 'approved'])

      if (projectsError) throw projectsError

      // Calculate statistics
      const today = new Date()
      const totalInvoices = invoices?.length || 0
      const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0) || 0
      const outstandingAmount = invoices?.reduce((sum, inv) => {
        if (inv.payment_status && inv.payment_status !== 'paid') {
          return sum + (inv.total_amount - (inv.amount_paid || 0))
        }
        return sum
      }, 0) || 0

      const overdueInvoices = invoices?.filter(inv => {
        const dueDate = inv.due_date ? new Date(inv.due_date) : null
        return dueDate && 
               dueDate < today && 
               inv.payment_status && 
               inv.payment_status !== 'paid'
      }).length || 0

      const paidInvoices = invoices?.filter(inv => inv.payment_status === 'paid').length || 0
      const pendingQuotes = quotes?.filter(quote => quote.status === 'draft' || quote.status === 'sent').length || 0

      setData(prev => ({
        ...prev,
        stats: {
          totalInvoices,
          totalRevenue,
          outstandingAmount,
          activeClients: clientCount || 0,
          pendingQuotes,
          overdueInvoices,
          paidInvoices,
          projectsInProgress: projectsInProgress || 0
        }
      }))

    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      setData(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard data'
      }))
    }
  }, [supabase, user])

  const fetchRecentActivity = useCallback(async () => {
    if (!user) return

    try {
      const activities: RecentActivity[] = []

      // Recent invoices
      const { data: recentInvoices, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          status,
          created_at,
          projects!inner (
            name,
            clients!inner (
              name,
              company_name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (invoicesError) throw invoicesError

      recentInvoices?.forEach(invoice => {
        const clientName = invoice.projects?.clients?.[0]?.company_name || 
                          invoice.projects?.clients?.[0]?.name || 'Unknown Client'
        
        activities.push({
          id: `invoice-${invoice.id}`,
          type: 'invoice_sent',
          title: `Invoice ${invoice.invoice_number} ${invoice.status}`,
          description: `${clientName}`,
          timestamp: invoice.created_at,
          icon: 'FileText'
        })
      })

      // Recent clients
      const { data: recentClients, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, company_name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3)

      if (clientsError) throw clientsError

      recentClients?.forEach(client => {
        activities.push({
          id: `client-${client.id}`,
          type: 'client_added',
          title: 'New client added',
          description: client.company_name || client.name,
          timestamp: client.created_at,
          icon: 'Users'
        })
      })

      // Recent quotes
      const { data: recentQuotes, error: quotesError } = await supabase
        .from('quotes')
        .select(`
          id,
          quote_number,
          status,
          created_at,
          projects!inner (
            name,
            clients!inner (
              name,
              company_name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3)

      if (quotesError) throw quotesError

      recentQuotes?.forEach(quote => {
        const clientName = quote.projects?.clients?.[0]?.company_name || 
                          quote.projects?.clients?.[0]?.name || 'Unknown Client'
        
        activities.push({
          id: `quote-${quote.id}`,
          type: 'quote_created',
          title: `Quote ${quote.quote_number} created`,
          description: `${clientName}`,
          timestamp: quote.created_at,
          icon: 'FileText'
        })
      })

      // Sort all activities by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setData(prev => ({
        ...prev,
        recentActivity: activities.slice(0, 6)
      }))

    } catch (error) {
      console.error('Error fetching recent activity:', error)
    }
  }, [supabase, user])

  const fetchUpcomingItems = useCallback(async () => {
    if (!user) return

    try {
      const upcoming: UpcomingItem[] = []
      const today = new Date()

      // Upcoming invoice due dates
      const { data: upcomingInvoices, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          due_date,
          payment_status,
          projects!inner (
            name,
            clients!inner (
              name,
              company_name
            )
          )
        `)
        .eq('user_id', user.id)
        .neq('payment_status', 'paid')
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true })
        .limit(5)

      if (invoicesError) throw invoicesError

      upcomingInvoices?.forEach(invoice => {
        const dueDate = new Date(invoice.due_date)
        const clientName = invoice.projects?.clients?.[0]?.company_name || 
                          invoice.projects?.clients?.[0]?.name || 'Unknown Client'
        
        upcoming.push({
          id: `invoice-due-${invoice.id}`,
          title: `Invoice ${invoice.invoice_number} Due`,
          description: `${clientName} - ${invoice.projects?.name || 'Unknown Project'}`,
          dueDate: invoice.due_date,
          type: 'invoice_due',
          isOverdue: dueDate < today
        })
      })

      // Upcoming project deadlines
      const { data: upcomingProjects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          end_date,
          status,
          clients!inner (
            name,
            company_name
          )
        `)
        .eq('user_id', user.id)
        .not('end_date', 'is', null)
        .in('status', ['in_progress', 'approved'])
        .order('end_date', { ascending: true })
        .limit(3)

      if (projectsError) throw projectsError

      upcomingProjects?.forEach(project => {
        const endDate = new Date(project.end_date)
        const clientName = project.clients?.company_name || project.clients?.name || 'Unknown Client'
        
        upcoming.push({
          id: `project-${project.id}`,
          title: project.name,
          description: `${clientName} - Project deadline`,
          dueDate: project.end_date,
          type: 'project_deadline',
          isOverdue: endDate < today
        })
      })

      // Sort by due date
      upcoming.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

      setData(prev => ({
        ...prev,
        upcomingItems: upcoming.slice(0, 5)
      }))

    } catch (error) {
      console.error('Error fetching upcoming items:', error)
    }
  }, [supabase, user])

  const fetchAllData = useCallback(async () => {
    setData(prev => ({ ...prev, loading: true, error: null }))
    
    await Promise.all([
      fetchDashboardStats(),
      fetchRecentActivity(),
      fetchUpcomingItems()
    ])
    
    setData(prev => ({ ...prev, loading: false }))
  }, [fetchDashboardStats, fetchRecentActivity, fetchUpcomingItems])

  useEffect(() => {
    if (user) {
      fetchAllData()
    }
  }, [user, fetchAllData])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return

    const channels = [
      // Listen to invoice changes
      supabase
        .channel('dashboard-invoices')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'invoices', filter: `user_id=eq.${user.id}` },
          () => {
            fetchDashboardStats()
            fetchRecentActivity()
            fetchUpcomingItems()
          }
        )
        .subscribe(),

      // Listen to client changes
      supabase
        .channel('dashboard-clients')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'clients', filter: `user_id=eq.${user.id}` },
          () => {
            fetchDashboardStats()
            fetchRecentActivity()
          }
        )
        .subscribe(),

      // Listen to quote changes
      supabase
        .channel('dashboard-quotes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'quotes', filter: `user_id=eq.${user.id}` },
          () => {
            fetchDashboardStats()
            fetchRecentActivity()
          }
        )
        .subscribe(),

      // Listen to project changes
      supabase
        .channel('dashboard-projects')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'projects', filter: `user_id=eq.${user.id}` },
          () => {
            fetchDashboardStats()
            fetchUpcomingItems()
          }
        )
        .subscribe()
    ]

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel))
    }
  }, [user, supabase, fetchDashboardStats, fetchRecentActivity, fetchUpcomingItems])

  return {
    ...data,
    refetch: fetchAllData
  }
} 