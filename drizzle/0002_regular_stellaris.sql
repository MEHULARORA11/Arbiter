ALTER TABLE "message_model_runs" ADD COLUMN "cached_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "message_model_runs" ADD COLUMN "ttft_ms" integer;