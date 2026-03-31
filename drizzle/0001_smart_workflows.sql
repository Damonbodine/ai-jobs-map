CREATE TABLE "smart_workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_template_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"source_url" text,
	"category" text NOT NULL,
	"tags" text,
	"integrations" text,
	"integration_count" integer DEFAULT 0,
	"trigger_type" text,
	"complexity" text,
	"estimated_hours_saved" real,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "smart_workflows_source_template_id_unique" UNIQUE("source_template_id")
);
--> statement-breakpoint
CREATE TABLE "smart_workflow_occupation_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" integer NOT NULL,
	"occupation_id" integer,
	"major_category" text,
	"skill_code_prefix" text,
	"automation_solution_key" text,
	"relevance_score" real DEFAULT 0.5 NOT NULL,
	"mapping_source" text DEFAULT 'auto_keyword' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "smart_workflow_internal_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" integer NOT NULL,
	"internal_workflow_code" text NOT NULL,
	"relationship" text DEFAULT 'reference' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "smart_workflow_occupation_mappings" ADD CONSTRAINT "smart_workflow_occupation_mappings_workflow_id_smart_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."smart_workflows"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "smart_workflow_occupation_mappings" ADD CONSTRAINT "smart_workflow_occupation_mappings_occupation_id_occupations_id_fk" FOREIGN KEY ("occupation_id") REFERENCES "public"."occupations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "smart_workflow_internal_mappings" ADD CONSTRAINT "smart_workflow_internal_mappings_workflow_id_smart_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."smart_workflows"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "smart_workflows_category_idx" ON "smart_workflows" USING btree ("category");
--> statement-breakpoint
CREATE INDEX "smart_workflows_complexity_idx" ON "smart_workflows" USING btree ("complexity");
--> statement-breakpoint
CREATE INDEX "swom_workflow_idx" ON "smart_workflow_occupation_mappings" USING btree ("workflow_id");
--> statement-breakpoint
CREATE INDEX "swom_occupation_idx" ON "smart_workflow_occupation_mappings" USING btree ("occupation_id");
--> statement-breakpoint
CREATE INDEX "swom_category_idx" ON "smart_workflow_occupation_mappings" USING btree ("major_category");
--> statement-breakpoint
CREATE INDEX "swom_skill_prefix_idx" ON "smart_workflow_occupation_mappings" USING btree ("skill_code_prefix");
--> statement-breakpoint
CREATE INDEX "swom_solution_idx" ON "smart_workflow_occupation_mappings" USING btree ("automation_solution_key");
--> statement-breakpoint
CREATE INDEX "swim_workflow_idx" ON "smart_workflow_internal_mappings" USING btree ("workflow_id");
--> statement-breakpoint
CREATE INDEX "swim_internal_code_idx" ON "smart_workflow_internal_mappings" USING btree ("internal_workflow_code");
