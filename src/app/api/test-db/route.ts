// src/app/api/test-db/route.ts
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerClient()
    
    // Test 1: Check if we can connect to the database
    const { data: connection, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (connectionError) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: connectionError.message
      }, { status: 500 })
    }

    // Test 2: Check if profiles table exists and has correct structure
    const { error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'profiles' })
      .select()
    
    if (tableError) {
      console.log('Table info error:', tableError)
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      profilesTable: connection !== null ? 'exists' : 'missing',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 