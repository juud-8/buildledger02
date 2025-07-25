import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createServerAdminClient } from '@/lib/supabase/server-admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated:', user.id)

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('File received:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`

    console.log('Generated filename:', fileName)

    // Upload file to Supabase Storage
    console.log('Uploading file to storage...')
    const { data, error: uploadError } = await supabase.storage
      .from('logos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error(`Failed to upload file: ${uploadError.message}`)
    }

    console.log('File uploaded successfully:', data)

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(fileName)

    console.log('Public URL:', publicUrl)

    // Update user profile with logo URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        logo_url: publicUrl,
        logo_filename: file.name,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Profile update error:', updateError)
      // Try to delete the uploaded file if profile update fails
      await supabase.storage.from('logos').remove([fileName])
      return NextResponse.json({ 
        error: 'Failed to update profile', 
        details: updateError.message 
      }, { status: 500 })
    }

    console.log('Profile updated successfully')

    return NextResponse.json({
      success: true,
      logoUrl: publicUrl,
      filename: file.name
    })

  } catch (error) {
    console.error('Logo upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload logo', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const supabase = await createServerClient()
    const adminClient = createServerAdminClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current logo filename from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('logo_filename')
      .eq('id', user.id)
      .single()

    if (profile?.logo_filename) {
      // Extract filename from the stored URL or use the filename directly
      const fileName = profile.logo_filename.includes(user.id) 
        ? profile.logo_filename 
        : `${user.id}-${profile.logo_filename}`

      // Delete from storage using admin client
      const { error: deleteError } = await adminClient.storage
        .from('logos')
        .remove([fileName])

      if (deleteError) {
        console.error('Storage delete error:', deleteError)
      }
    }

    // Update profile to remove logo references
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        logo_url: null,
        logo_filename: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Logo delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete logo', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 