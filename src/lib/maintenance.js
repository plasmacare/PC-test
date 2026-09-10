import { supabase } from './supabase'

export async function fetchMaintenanceSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('maintenance_customer, maintenance_staff, maintenance_b2b, maintenance_message')
    .eq('id', 1)
    .single()
  if (error) return { maintenance_customer: false, maintenance_staff: false, maintenance_b2b: false, maintenance_message: '' }
  return data
}

export function subscribeMaintenanceSettings(onChange) {
  // Both the customer App.jsx and every PortalGate mount call this in
  // the same tab — a shared/fixed channel name caused the exact same
  // "cannot add postgres_changes callbacks after subscribe()" crash the
  // site-viewers Presence channel had earlier. A unique name per call
  // avoids the collision entirely; multiple channels listening to the
  // same table update is completely fine.
  const channel = supabase
    .channel(`maintenance-settings-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_settings' }, (payload) => {
      onChange(payload.new)
    })
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
