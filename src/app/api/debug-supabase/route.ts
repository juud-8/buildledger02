import { NextResponse } from 'next/server'
import { createServerAdminClient } from '@/lib/supabase/server-admin'

export async function GET() {
  try {
    const supabase = await createServerAdminClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      return NextResponse.json({ 
        error: 'Auth error', 
        details: authError.message 
      }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Test storage access
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    // Test profiles table access
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, company_name')
      .eq('id', user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        authenticated: true
      },
      storage: {
        error: bucketsError?.message || null,
        buckets: buckets || [],
        bucketCount: buckets?.length || 0
      },
      database: {
        error: profileError?.message || null,
        profileCount: profiles?.length || 0,
        profiles: profiles || [],
        profileExists: profiles && profiles.length > 0
      },
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...' || 'Not set'
      }
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: 'Debug failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 