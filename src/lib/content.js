import { supabase } from './supabase'

/** Only pages with real content are meant to be shown — empty ones mean the admin hasn't written them yet. */
export async function fetchLegalPage(slug) {
  const { data, error } = await supabase.from('legal_pages').select('*').eq('slug', slug).maybeSingle()
  if (error) throw error
  return data
}

/** All legal pages that currently have content — used to decide which footer links to show. */
export async function fetchAvailableLegalPages() {
  const { data, error } = await supabase.from('legal_pages').select('slug, title').neq('content', '')
  if (error) throw error
  return data || []
}

export async function fetchActiveAnnouncement() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}
