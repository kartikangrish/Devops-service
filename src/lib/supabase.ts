import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Some features may not work correctly.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Database types
export interface WorkflowConfig {
  id: string;
  user_id: string;
  repo_name: string;
  template_id: string;
  variables: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: 'create' | 'update' | 'delete';
  resource_type: 'workflow' | 'template' | 'cron';
  resource_id: string;
  details: Record<string, any>;
  created_at: string;
}

export interface NotificationConfig {
  id: string;
  user_id: string;
  type: 'slack' | 'email' | 'webhook';
  config: {
    url?: string;
    email?: string;
    channel?: string;
  };
  events: string[];
  created_at: string;
  updated_at: string;
}

// Database functions
export async function saveWorkflowConfig(config: any) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase not configured, skipping workflow config save');
    return;
  }
  try {
    const { data, error } = await supabase
      .from('workflow_configs')
      .insert([config]);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving workflow config:', error);
    throw error;
  }
}

export async function getWorkflowConfigs(userId: string) {
  const { data, error } = await supabase
    .from('workflow_configs')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}

export async function logAuditEvent(event: any) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase not configured, skipping audit log');
    return;
  }
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert([event]);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error logging audit event:', error);
    throw error;
  }
}

export async function saveNotificationConfig(config: Omit<NotificationConfig, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('notification_configs')
    .insert([config])
    .select()
    .single();

  if (error) throw error;
  return data;
} 