import { supabase } from './supabase'

async function describeError(error) {
  if (!error) return 'Unknown error'
  // supabase-js FunctionsHttpError carries the actual HTTP response on .context
  if (error.context && typeof error.context.text === 'function') {
    try {
      const bodyText = await error.context.text()
      return `${error.message} — ${bodyText}`
    } catch {
      return error.message
    }
  }
  return error.message || String(error)
}

export async function sendOtp(phone, channel = 'whatsapp') {
  const { data, error } = await supabase.functions.invoke('send-otp', {
    body: { phone, channel },
  })
  if (error) throw new Error(await describeError(error))
  return data
}

export async function verifyOtp(phone, code) {
  const { data, error } = await supabase.functions.invoke('verify-otp', {
    body: { phone, code },
  })
  if (error) throw new Error(await describeError(error))
  return data
}
