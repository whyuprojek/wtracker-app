import { createClient } from '@supabase/supabase-js'

// URL dan Key dari Supabase kamu
const supabaseUrl = 'https://nqlaioexmmktjxasvhfj.supabase.co'
const supabaseKey = 'sb_publishable_GAFhSL2gV6SriJqZINqIIQ_7CJazadf'

export const supabase = createClient(supabaseUrl, supabaseKey)