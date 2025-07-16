import { NextResponse } from 'next/server'
import { createServerAdminClient } from '@/lib/supabase/server-admin'

export async function GET() {
  try {
    const supabase = await createServerAdminClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Test storage bucket access
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      return NextResponse.json({ 
        error: 'Failed to list buckets', 
        details: bucketsError.message 
      }, { status: 500 })
    }

    // Check if logos bucket exists
    const logosBucket = buckets.find(bucket => bucket.name === 'logos')
    
    if (!logosBucket) {
      return NextResponse.json({ 
        error: 'Logos bucket not found', 
        availableBuckets: buckets.map(b => b.name)
      }, { status: 404 })
    }

    // Test listing files in logos bucket
    const { data: files, error: filesError } = await supabase.storage
      .from('logos')
      .list()

    if (filesError) {
      return NextResponse.json({ 
        error: 'Failed to list files in logos bucket', 
        details: filesError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      bucketExists: true,
      bucketName: logosBucket.name,
      bucketPublic: logosBucket.public,
      fileCount: files.length,
      files: files.map(f => f.name)
    })

  } catch (error) {
    console.error('Storage test error:', error)
    return NextResponse.json(
      { error: 'Storage test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 