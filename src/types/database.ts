export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      campaigns: {
        Row: {
          id: string;
          name: string;
          status: string;
          facebook_post_id: string | null;
          instagram_media_id: string | null;
          response_set_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          status?: string;
          facebook_post_id?: string | null;
          instagram_media_id?: string | null;
          response_set_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          status?: string;
          facebook_post_id?: string | null;
          instagram_media_id?: string | null;
          response_set_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      responses: {
        Row: {
          id: string;
          response_set_id: string;
          selection: number;
          title: string | null;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          response_set_id: string;
          selection: number;
          title?: string | null;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          response_set_id?: string;
          selection?: number;
          title?: string | null;
          message?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      processed_events: {
        Row: {
          id: string;
          event_id: string;
          platform: string;
          comment_id: string;
          post_id: string | null;
          status: string;
          error_message: string | null;
          received_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          event_id: string;
          platform: string;
          comment_id: string;
          post_id?: string | null;
          status?: string;
          error_message?: string | null;
          received_at?: string;
          processed_at?: string | null;
        };
        Update: {
          id?: string;
          event_id?: string;
          platform?: string;
          comment_id?: string;
          post_id?: string | null;
          status?: string;
          error_message?: string | null;
          received_at?: string;
          processed_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}