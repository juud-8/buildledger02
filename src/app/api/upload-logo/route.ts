import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createServerAdminClient } from '@/lib/supabase/server-admin'

/*
 * REQUIRED SUPABASE RLS POLICIES FOR THIS API TO WORK:
 * 
 * 1. Allow users to insert their own profile:
 * CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
 * 
 * 2. Allow users to update their own profile:
 * CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
 * 
 * 3. Allow users to read their own profile:
 * CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
 * 
 * 4. Ensure the 'logos' storage bucket exists and is public or has correct permissions
 * 
 * NOTE: This assumes you have a user_id column (UUID) separate from the id column (bigint)
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated:', user.id)
    console.log('User email:', user.email)
    console.log('User session:', !!user)

    // --- IMPORTANT: Ensure the 'logos' bucket is public or has correct permissions in Supabase dashboard ---
    // Debug: Check if user profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id, logo_url, logo_filename')
      .eq('user_id', user.id)
      .single()

    console.log('Existing profile:', existingProfile)
    console.log('Profile error:', profileError)
    console.log('User ID:', user.id)
    console.log('Profile user_id:', existingProfile?.user_id)

    // If no profile found with user_id, check if there's a profile with NULL user_id that we should update
    if (!existingProfile && profileError?.code === 'PGRST116') {
      console.log('No profile found with user_id, checking for profile with NULL user_id...')
      const { data: nullUserProfile } = await supabase
        .from('profiles')
        .select('id, user_id, logo_url, logo_filename')
        .is('user_id', null)
        .limit(1)
        .single()

      if (nullUserProfile) {
        console.log('Found profile with NULL user_id, updating it...')
        const { error: updateUserError } = await supabase
          .from('profiles')
          .update({
            user_id: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', nullUserProfile.id)

        if (updateUserError) {
          console.error('Failed to update profile user_id:', updateUserError)
          return NextResponse.json({ 
            error: 'Failed to update profile user_id', 
            details: updateUserError.message 
          }, { status: 500 })
        }

        console.log('Profile user_id updated successfully')
        // Set existingProfile to the updated profile
        // Note: We'll continue with the existing flow since existingProfile is const
        // The profile will be updated in the next step
      }
    }

    // If profile doesn't exist, create it first
    if (!existingProfile && profileError?.code === 'PGRST116') {
      console.log('Profile does not exist, creating one...')
      console.log('Attempting to insert profile with user_id:', user.id)
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          updated_at: new Date().toISOString()
        })
      
      if (insertError) {
        console.error('Failed to create profile:', insertError)
        console.error('Insert error details:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        })
        return NextResponse.json({ 
          error: 'Failed to create user profile', 
          details: insertError.message 
        }, { status: 500 })
      }
      
      console.log('Profile created successfully')
    } else if (profileError) {
      console.error('Error checking profile:', profileError)
      console.error('Profile check error details:', {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code
      })
      return NextResponse.json({ 
        error: 'Failed to check user profile', 
        details: profileError.message 
      }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    // Validate file existence and type
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file provided or invalid file type' }, { status: 400 })
    }
    // TypeScript: file is now Blob, but may not have .name/.type/.size in all runtimes
    // Defensive fallback for name/type/size
    const fileWithMeta = file as Blob & { name?: string; type?: string; size?: number }
    const fileNameRaw = fileWithMeta.name || 'logo-uploaded-file'
    const fileType = fileWithMeta.type || ''
    const fileSize = fileWithMeta.size || 0

    if (!fileType.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 })
    }

    if (fileSize > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = fileNameRaw.split('.').pop()
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
      // Surface the actual Supabase error message
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file', details: uploadError.message }, { status: 500 })
    }

    console.log('File uploaded successfully:', data)

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('logos')
      .getPublicUrl(fileName)
    const publicUrl = publicUrlData?.publicUrl || null

    console.log('Public URL:', publicUrl)

    // Update user profile with logo URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        logo_url: publicUrl,
        logo_filename: fileNameRaw,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (updateError) {
      // Try to delete the uploaded file if profile update fails
      await supabase.storage.from('logos').remove([fileName])
      console.error('Profile update error:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update profile', 
        details: updateError.message 
      }, { status: 500 })
    }

    console.log('Profile updated successfully')

    return NextResponse.json({
      success: true,
      logoUrl: publicUrl,
      filename: fileNameRaw
    })

  } catch (error) {
    // Surface the error message for easier debugging
    console.error('Logo upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload logo', details: error instanceof Error ? error.message : String(error) },
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
      .eq('user_id', user.id)
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
      .eq('user_id', user.id)

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