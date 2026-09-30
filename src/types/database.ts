export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type CampaignStatus = "draft" | "active" | "paused";
type EventPlatform = "facebook" | "instagram";
type EventStatus = "processing" | "sent" | "ignored" | "failed";
type IgnoredReason =
  | "no_selection"
  | "ambiguous_selection"
  | "selection_not_found"
  | "campaign_not_found";

export interface Database {
  public: {
    Tables: {
      response_sets: {
        Row: {
          id: string;
          name: string;
          selection_type: "number";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          selection_type?: "number";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          selection_type?: "number";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      campaigns: {
        Row: {
          id: string;
          name: string;
          status: CampaignStatus;
          facebook_post_id: string | null;
          instagram_media_id: string | null;
          response_set_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          status?: CampaignStatus;
          facebook_post_id?: string | null;
          instagram_media_id?: string | null;
          response_set_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          status?: CampaignStatus;
          facebook_post_id?: string | null;
          instagram_media_id?: string | null;
          response_set_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaigns_response_set_id_fkey";
            columns: ["response_set_id"];
            isOneToOne: false;
            referencedRelation: "response_sets";
            referencedColumns: ["id"];
          },
        ];
      };
      responses: {
        Row: {
          id: string;
          response_set_id: string;
          selection: number;
          title: string | null;
          message: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          response_set_id: string;
          selection: number;
          title?: string | null;
          message: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          response_set_id?: string;
          selection?: number;
          title?: string | null;
          message?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "responses_response_set_id_fkey";
            columns: ["response_set_id"];
            isOneToOne: false;
            referencedRelation: "response_sets";
            referencedColumns: ["id"];
          },
        ];
      };
      processed_events: {
        Row: {
          event_id: string;
          platform: EventPlatform;
          comment_id: string;
          post_id: string;
          campaign_id: string | null;
          status: EventStatus;
          reason: IgnoredReason | null;
          error_message: string | null;
          received_at: string;
          processed_at: string | null;
          attempts: number;
          processing_started_at: string;
        };
        Insert: {
          event_id: string;
          platform: EventPlatform;
          comment_id: string;
          post_id: string;
          campaign_id?: string | null;
          status?: EventStatus;
          reason?: IgnoredReason | null;
          error_message?: string | null;
          received_at?: string;
          processed_at?: string | null;
          attempts?: number;
          processing_started_at?: string;
        };
        Update: {
          event_id?: string;
          platform?: EventPlatform;
          comment_id?: string;
          post_id?: string;
          campaign_id?: string | null;
          status?: EventStatus;
          reason?: IgnoredReason | null;
          error_message?: string | null;
          received_at?: string;
          processed_at?: string | null;
          attempts?: number;
          processing_started_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "processed_events_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      claim_processed_event: {
        Args: {
          p_event_id: string;
          p_platform: EventPlatform;
          p_comment_id: string;
          p_post_id: string;
          p_campaign_id: string | null;
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
