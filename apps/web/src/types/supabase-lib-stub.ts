// Stub that satisfies @supabase/ssr's broken import path:
// @supabase/supabase-js/dist/module/lib/types
// (removed in supabase-js v2.105+ but @supabase/ssr v0.6.x still references it)
export type { SupabaseClientOptions } from '@supabase/supabase-js';

// GenericSchema is not re-exported by postgrest-js, so define it here
// to match the exact shape used internally by the SDK.
type GenericRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};
type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: GenericRelationship[];
};
type GenericView = { Row: Record<string, unknown>; Relationships: GenericRelationship[] };
type GenericFunction = { Args: Record<string, unknown> | never; Returns: unknown };
export type GenericSchema = {
  Tables: Record<string, GenericTable>;
  Views: Record<string, GenericView>;
  Functions: Record<string, GenericFunction>;
};
