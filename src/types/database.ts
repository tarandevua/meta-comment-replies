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
          event_id: string;
          platform: string;
          comment_id: string;
          post_id: string | null;
          status: string;
          error_message: string | null;
          received_at: string;
          processed_at: string | null;
          attempts: number;
          processing_started_at: string;
        };
        Insert: {
          event_id: string;
          platform: string;
          comment_id: string;
          post_id?: string | null;
          status?: string;
          error_message?: string | null;
          received_at?: string;
          processed_at?: string | null;
          attempts?: number;
          processing_started_at?: string;
        };
        Update: {
          event_id?: string;
          platform?: string;
          comment_id?: string;
          post_id?: string | null;
          status?: string;
          error_message?: string | null;
          received_at?: string;
          processed_at?: string | null;
          attempts?: number;
          processing_started_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      claim_processed_event: {
        Args: {
          p_event_id: string;
          p_platform: string;
          p_comment_id: string;
          p_post_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
