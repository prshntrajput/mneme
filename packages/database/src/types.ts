// Hand-written types matching the DB schema.
// Run `npm run db:types` after every migration to regenerate from Supabase.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          plan: 'free' | 'pro';
          tab_quota: number;
          blocked_domains: string[];
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          plan?: 'free' | 'pro';
          tab_quota?: number;
          blocked_domains?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          plan?: 'free' | 'pro';
          tab_quota?: number;
          blocked_domains?: string[];
          created_at?: string;
        };
        Relationships: [];
      };
      tabs: {
        Row: {
          id: string;
          user_id: string;
          url: string;
          url_hash: string;
          title: string | null;
          favicon_url: string | null;
          raw_content: string | null;
          summary: string | null;
          key_points: string[] | null;
          tags: string[];
          category: string | null;
          embedding: number[] | null;
          status: 'pending' | 'processing' | 'ready' | 'failed';
          source: 'auto' | 'manual' | 'session' | 'cleanup';
          visited_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          url: string;
          title?: string | null;
          favicon_url?: string | null;
          raw_content?: string | null;
          summary?: string | null;
          key_points?: string[] | null;
          tags?: string[];
          category?: string | null;
          embedding?: number[] | null;
          status?: 'pending' | 'processing' | 'ready' | 'failed';
          source?: 'auto' | 'manual' | 'session' | 'cleanup';
          visited_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string | null;
          favicon_url?: string | null;
          raw_content?: string | null;
          summary?: string | null;
          key_points?: string[] | null;
          tags?: string[];
          category?: string | null;
          embedding?: number[] | null;
          status?: 'pending' | 'processing' | 'ready' | 'failed';
          visited_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          name: string | null;
          ai_name: string | null;
          tab_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string | null;
          ai_name?: string | null;
          tab_count?: number;
          created_at?: string;
        };
        Update: {
          name?: string | null;
          ai_name?: string | null;
          tab_count?: number;
        };
        Relationships: [];
      };
      session_tabs: {
        Row: { session_id: string; tab_id: string; position: number | null };
        Insert: { session_id: string; tab_id: string; position?: number | null };
        Update: { position?: number | null };
        Relationships: [
          {
            foreignKeyName: 'session_tabs_tab_id_fkey';
            columns: ['tab_id'];
            isOneToOne: false;
            referencedRelation: 'tabs';
            referencedColumns: ['id'];
          },
        ];
      };
      collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          ai_generated: boolean;
          centroid: number[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          ai_generated?: boolean;
          centroid?: number[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          ai_generated?: boolean;
          centroid?: number[] | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      collection_tabs: {
        Row: { collection_id: string; tab_id: string; similarity: number | null };
        Insert: { collection_id: string; tab_id: string; similarity?: number | null };
        Update: { similarity?: number | null };
        Relationships: [
          {
            foreignKeyName: 'collection_tabs_tab_id_fkey';
            columns: ['tab_id'];
            isOneToOne: false;
            referencedRelation: 'tabs';
            referencedColumns: ['id'];
          },
        ];
      };
      processing_jobs: {
        Row: {
          id: string;
          user_id: string | null;
          tab_id: string | null;
          job_type: string;
          status: string;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          tab_id?: string | null;
          job_type: string;
          status: string;
          error?: string | null;
          created_at?: string;
        };
        Update: { status?: string; error?: string | null };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_tabs_keyword: {
        Args: { p_user_id: string; p_query: string; p_limit: number };
        Returns: {
          id: string;
          title: string | null;
          url: string;
          summary: string | null;
          category: string | null;
          favicon_url: string | null;
          rank: number;
        }[];
      };
      search_tabs_vector: {
        Args: { p_user_id: string; p_embedding: string; p_limit: number };
        Returns: {
          id: string;
          title: string | null;
          url: string;
          summary: string | null;
          category: string | null;
          favicon_url: string | null;
          similarity: number;
        }[];
      };
    };
    Enums: Record<string, never>;
  };
}
