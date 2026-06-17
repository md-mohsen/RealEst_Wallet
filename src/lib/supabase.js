import { createClient } from '@supabase/supabase-js'

const SBU = 'https://fyuoawuxlpqiqqyozqmq.supabase.co'
const SBK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dW9hd3V4bHBxaXFxeW96cW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NTUwMTYsImV4cCI6MjA5NzAzMTAxNn0.kCjlbWiQKGpYXt553Ym-_OOKav5WZnzx8dJu63CroY4'

export const supabase = createClient(SBU, SBK)
