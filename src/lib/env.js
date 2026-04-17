const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const siteUrl = import.meta.env.VITE_SITE_URL

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
export const appSiteUrl = siteUrl?.trim() || ''
