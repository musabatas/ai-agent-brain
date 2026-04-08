-- ============================================================
-- AI Dev Brain: PostgreSQL Full-Text Search Setup
-- Run via: node prisma/setup-search.js
-- Idempotent: safe to run multiple times.
-- ============================================================

-- Add tsvector columns
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE "Decision" ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE "Rule" ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE "Memory" ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create GIN indexes
CREATE INDEX IF NOT EXISTS idx_task_search ON "Task" USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_decision_search ON "Decision" USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_rule_search ON "Rule" USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_document_search ON "Document" USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_memory_search ON "Memory" USING GIN(search_vector);

-- Create trigger functions
CREATE OR REPLACE FUNCTION update_task_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.title, '') || ' ' || coalesce(NEW.description, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_decision_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.title, '') || ' ' || coalesce(NEW.context, '') || ' ' || coalesce(NEW.decision, '') || ' ' || coalesce(NEW.consequences, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_rule_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.title, '') || ' ' || coalesce(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_document_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.title, '') || ' ' || coalesce(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_memory_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.key, '') || ' ' || coalesce(NEW.value, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers (drop if exist first for idempotency)
DROP TRIGGER IF EXISTS task_search_vector_update ON "Task";
CREATE TRIGGER task_search_vector_update BEFORE INSERT OR UPDATE ON "Task" FOR EACH ROW EXECUTE FUNCTION update_task_search_vector();

DROP TRIGGER IF EXISTS decision_search_vector_update ON "Decision";
CREATE TRIGGER decision_search_vector_update BEFORE INSERT OR UPDATE ON "Decision" FOR EACH ROW EXECUTE FUNCTION update_decision_search_vector();

DROP TRIGGER IF EXISTS rule_search_vector_update ON "Rule";
CREATE TRIGGER rule_search_vector_update BEFORE INSERT OR UPDATE ON "Rule" FOR EACH ROW EXECUTE FUNCTION update_rule_search_vector();

DROP TRIGGER IF EXISTS document_search_vector_update ON "Document";
CREATE TRIGGER document_search_vector_update BEFORE INSERT OR UPDATE ON "Document" FOR EACH ROW EXECUTE FUNCTION update_document_search_vector();

DROP TRIGGER IF EXISTS memory_search_vector_update ON "Memory";
CREATE TRIGGER memory_search_vector_update BEFORE INSERT OR UPDATE ON "Memory" FOR EACH ROW EXECUTE FUNCTION update_memory_search_vector();

-- Backfill existing records
UPDATE "Task" SET search_vector = to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''));
UPDATE "Decision" SET search_vector = to_tsvector('english', coalesce(title, '') || ' ' || coalesce(context, '') || ' ' || coalesce(decision, '') || ' ' || coalesce(consequences, ''));
UPDATE "Rule" SET search_vector = to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''));
UPDATE "Document" SET search_vector = to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''));
UPDATE "Memory" SET search_vector = to_tsvector('english', coalesce(key, '') || ' ' || coalesce(value, ''));
