CREATE TABLE "ai_opportunities" (
	"id" serial PRIMARY KEY NOT NULL,
	"occupation_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"impact_level" integer NOT NULL,
	"effort_level" integer NOT NULL,
	"is_ai_generated" boolean DEFAULT true NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"source" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "detailed_work_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"dwa_id" text NOT NULL,
	"dwa_title" text NOT NULL,
	"iwa_id" text,
	"iwa_title" text,
	"gwa_title" text,
	"automation_template" text,
	"applicable_tools" text,
	"occupation_count" integer DEFAULT 0,
	"avg_automation_score" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "detailed_work_activities_dwa_id_unique" UNIQUE("dwa_id")
);
--> statement-breakpoint
CREATE TABLE "job_micro_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"occupation_id" integer NOT NULL,
	"task_name" text NOT NULL,
	"task_description" text NOT NULL,
	"frequency" text NOT NULL,
	"ai_applicable" boolean DEFAULT true NOT NULL,
	"ai_how_it_helps" text,
	"ai_impact_level" integer,
	"ai_effort_to_implement" integer,
	"ai_category" text,
	"ai_tools" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "occupations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"major_category" text NOT NULL,
	"sub_category" text,
	"employment" integer,
	"hourly_wage" integer,
	"annual_wage" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onet_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"onet_soc_code" text NOT NULL,
	"task_id" text,
	"task_title" text NOT NULL,
	"task_description" text NOT NULL,
	"task_type" text,
	"occupation_id" integer,
	"ai_automatable" boolean,
	"ai_automation_score" integer,
	"ai_difficulty" text,
	"estimated_time_saved_percent" integer,
	"ai_tools" text,
	"dwa_id" text,
	"dwa_title" text,
	"iwa_id" text,
	"gwa_title" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"occupation_id" integer NOT NULL,
	"skill_name" text NOT NULL,
	"skill_description" text NOT NULL,
	"difficulty" text NOT NULL,
	"learning_resources" text,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks_to_dwas" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"onet_soc_code" text NOT NULL,
	"dwa_id" text NOT NULL,
	"occupation_id" integer
);
--> statement-breakpoint
ALTER TABLE "ai_opportunities" ADD CONSTRAINT "ai_opportunities_occupation_id_occupations_id_fk" FOREIGN KEY ("occupation_id") REFERENCES "public"."occupations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_micro_tasks" ADD CONSTRAINT "job_micro_tasks_occupation_id_occupations_id_fk" FOREIGN KEY ("occupation_id") REFERENCES "public"."occupations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onet_tasks" ADD CONSTRAINT "onet_tasks_occupation_id_occupations_id_fk" FOREIGN KEY ("occupation_id") REFERENCES "public"."occupations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_recommendations" ADD CONSTRAINT "skill_recommendations_occupation_id_occupations_id_fk" FOREIGN KEY ("occupation_id") REFERENCES "public"."occupations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks_to_dwas" ADD CONSTRAINT "tasks_to_dwas_occupation_id_occupations_id_fk" FOREIGN KEY ("occupation_id") REFERENCES "public"."occupations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_opportunities_occupation_idx" ON "ai_opportunities" USING btree ("occupation_id");--> statement-breakpoint
CREATE INDEX "ai_opportunities_category_idx" ON "ai_opportunities" USING btree ("category");--> statement-breakpoint
CREATE INDEX "dwa_iwa_idx" ON "detailed_work_activities" USING btree ("iwa_id");--> statement-breakpoint
CREATE INDEX "dwa_automation_idx" ON "detailed_work_activities" USING btree ("avg_automation_score");--> statement-breakpoint
CREATE INDEX "job_micro_tasks_occupation_idx" ON "job_micro_tasks" USING btree ("occupation_id");--> statement-breakpoint
CREATE INDEX "job_micro_tasks_ai_applicable_idx" ON "job_micro_tasks" USING btree ("ai_applicable");--> statement-breakpoint
CREATE UNIQUE INDEX "occupations_slug_idx" ON "occupations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "occupations_major_category_idx" ON "occupations" USING btree ("major_category");--> statement-breakpoint
CREATE INDEX "occupations_title_idx" ON "occupations" USING btree ("title");--> statement-breakpoint
CREATE INDEX "onet_tasks_soc_idx" ON "onet_tasks" USING btree ("onet_soc_code");--> statement-breakpoint
CREATE INDEX "onet_tasks_occupation_idx" ON "onet_tasks" USING btree ("occupation_id");--> statement-breakpoint
CREATE INDEX "onet_tasks_dwa_idx" ON "onet_tasks" USING btree ("dwa_id");--> statement-breakpoint
CREATE INDEX "onet_tasks_ai_automatable_idx" ON "onet_tasks" USING btree ("ai_automatable");--> statement-breakpoint
CREATE INDEX "skill_recommendations_occupation_idx" ON "skill_recommendations" USING btree ("occupation_id");--> statement-breakpoint
CREATE INDEX "ttd_dwa_idx" ON "tasks_to_dwas" USING btree ("dwa_id");--> statement-breakpoint
CREATE INDEX "ttd_soc_idx" ON "tasks_to_dwas" USING btree ("onet_soc_code");