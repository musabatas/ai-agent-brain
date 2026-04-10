# Agent Intelligence Layer — Vision & Gap Analysis

> **Status:** Exploration / RFC  
> **Date:** 2026-04-10  
> **Scope:** Platform evolution from structured project management to active agent intelligence

---

## Problem Statement

AI coding agents (Claude Code, Cursor, Windsurf, Copilot, custom MCP clients) operate in a **stateful world with stateless persistence**. Their current memory mechanisms — flat markdown files, JSON configs, conversation context — are fundamentally inadequate for sustained, intelligent project work.

Every new agent session starts cold. Decisions are forgotten. Conventions are re-learned. Mistakes are repeated. Team knowledge is siloed per user. Context is served as "all or nothing" with no relevance filtering.

**No platform exists today that provides structured, semantic, queryable project intelligence designed agent-first.**

---

## Current Landscape

### How Agents Persist Today

| Mechanism | Format | Queryable | Shared | Scales |
|---|---|---|---|---|
| CLAUDE.md / Cursor rules | Static markdown | No — loaded entirely | Per-repo | Breaks at ~200 lines |
| Memory files (`.claude/`) | Flat files + index | Scan index, guess | Per-user | Hard ceiling |
| Conversation context | In-memory | Dies with session | No | Context window limit |
| Tasks / Plans | Ephemeral | Dies with session | No | N/A |
| Git history | Commits, diffs | `git log` / `blame` | Yes | Yes, but unstructured |

### Adjacent Tools (and why they're insufficient)

- **Mem0 / LangMem / Zep** — Key-value memory with vector search. No project structure, no entity relationships, no semantic understanding of decisions vs conventions vs tasks. Dumb storage.
- **Linear / Jira / GitHub Issues** — Human-first project management. Agents can read tickets via API but can't capture their own learnings or query decision rationale efficiently.
- **RAG systems** — Generic embedding + retrieval. Don't understand project semantics. "Find similar text" is not "find relevant context for this task."
- **Notion / Confluence APIs** — Knowledge bases designed for humans. No agent-native interface, no MCP, no structured intelligence.

---

## The Gap

**AI agents need persistent, structured, queryable project intelligence that makes them smarter over time.**

The difference:
```
Today:   Agent -> stores flat text -> reads everything back (passive filing cabinet)
Future:  Agent -> stores structured knowledge -> platform LEARNS -> serves relevant context (active intelligence)
```

---

## Specific Agent Pain Points

### 1. No Semantic Query Over Memory

Agents can't ask "What do I know about authentication?" — they must read an index file and guess which entries are relevant. At scale (50+ memories), this fails silently.

**Need:** Structured + semantic query across all project knowledge. One call to get exactly what's relevant.

### 2. Cross-Session Amnesia

Every session starts from scratch. No knowledge of what was worked on last session, where it stopped, what approach was being taken, or what failed.

**Need:** Session continuity — persistent task state, approach history, warm-start context.

### 3. Context Overload (All or Nothing)

Agent working on auth module still loads CSS conventions, MCP config details, and database seeding instructions. No filtering by relevance. No scoping by area.

**Need:** Contextual relevance — declare current focus, receive only applicable context.

### 4. No Outcome Tracking

Memories and decisions are write-once. No tracking of whether an approach worked, whether a convention held up, whether a pattern caused regressions. Knowledge doesn't compound.

**Need:** Feedback loops — outcome tracking, confidence scoring, staleness detection.

### 5. Team Knowledge Silos

Each user's agent learns independently. One developer's Claude discovers an N+1 query pattern — another developer's Claude repeats the same mistake next week.

**Need:** Shared project intelligence that propagates learnings across all agents on a project.

### 6. No Entity Relationships

Current memory systems store isolated entries. They can't express: "This decision AFFECTS these files", "This convention APPLIES TO this module", "This pattern SUPERSEDES that older pattern."

**Need:** Relational intelligence — entities linked to code, to each other, and traversable by agents.

### 7. Scaling Ceiling

Flat index files have hard limits (typically 200 lines). A serious project after 6 months of agent-assisted development generates hundreds of decisions, conventions, and learnings. Current systems can't hold this.

**Need:** No ceiling. Thousands of entities, all queryable, never truncated.

---

## What AI Dev Brain Already Has

The current entity model covers significant ground:

| Entity | Purpose | Status |
|---|---|---|
| **Decision** | Architectural choices and rationale | Built |
| **Rule** | Project conventions and constraints | Built |
| **Memory** | Persistent learnings and notes | Built |
| **Document** | Long-form knowledge and specs | Built |
| **Feature** | Feature tracking with status | Built |
| **Task** | Work items with priorities | Built |
| **Activity** | Change log | Built |
| **Comment** | Discussion threads on entities | Built |
| **Revision** | Version history | Built |

Plus: MCP interface (40+ tools), multi-org/multi-project, dual auth (session + API key), activity logging.

**The entity model may already be correct. The missing piece is intelligent behaviors on top of it.**

---

## Proposed Evolution: Intelligence Capabilities

### Capability 1: Semantic Search Across All Entities

Unified search that spans decisions, rules, memories, documents, features, and tasks — combining structured filters with embedding-based semantic similarity.

```
// Single query, structured + semantic
context.search({
  query: "authentication flow decisions",
  types: ["decision", "rule"],
  scope: { module: "auth" },
  limit: 10
})
```

**Requires:** Embedding pipeline, vector storage, hybrid query engine.

### Capability 2: Session Continuity

Track agent session state across conversations: what was worked on, where it stopped, what approach was taken, what's pending.

Agents start warm instead of cold. Platform answers: "Last session worked on X, reached step 3, blocked on Y."

### Capability 3: Contextual Relevance Engine

Instead of serving all project context, serve only what's relevant to the agent's current focus.

Agent declares intent ("working on payment module") -> platform filters and ranks applicable decisions, rules, conventions, recent changes.

### Capability 4: Entity-to-Code Linking

Decisions and rules linked to specific files/modules they affect. When an agent modifies a file, platform can surface: "3 decisions and 2 rules apply to this area."

### Capability 5: Outcome Tracking & Confidence

Track whether decisions held up, whether conventions are followed, whether patterns caused issues. Build confidence scores over time. Flag stale or contradicted knowledge.

### Capability 6: Convention Scoping

Rules and conventions scoped to specific modules, file patterns, or entity types — not global-only. "In the API layer, always use X" vs "In the frontend, always use Y."

---

## What This Does NOT Require

Based on analysis, the following were considered and **deprioritized**:

- **Custom entity type system** — Adds schema management complexity without proportional value. Current semantic types give agents strong, immediate understanding. Generic entities lose that.
- **Raw SQL exposure** — Security risk (injection, cross-tenant leaks) with no benefit over a safe query DSL.
- **Plugin/extension system** — Market isn't ready. Premature abstraction.
- **Universal flexibility** — "Configure anything" = optimize nothing. Sharp semantic primitives > generic building blocks.

---

## Architecture Direction

```
+---------------------------------------------------+
|              Relevance Engine                      |
|         (contextual filtering + ranking)           |
+---------------------------------------------------+
|           Hybrid Query Layer                       |
|      (structured filters + semantic search)        |
+---------------------------+-----------------------+
|   Semantic Primitives     |   Intelligence        |
|   (Decision, Rule, Task,  |   (Confidence scores, |
|    Feature, Memory, Doc)  |    outcome tracking,  |
|                           |    staleness detection)|
+---------------------------+-----------------------+
|         Entity Relationships & Code Linking        |
+---------------------------------------------------+
|         Session State & Continuity                 |
+---------------------------------------------------+
|              MCP Interface                         |
|     (universal access from any AI tool)            |
+---------------------------------------------------+
```

---

## Open Questions

1. **Embedding strategy** — Which model? Where to run? Per-field or per-entity? Cost at scale?
2. **Relevance ranking** — How does the platform determine what's relevant to a given task? File-based? Module-based? Semantic similarity?
3. **Session model** — How granular? Per-conversation? Per-work-unit? How does handoff work?
4. **Code linking** — Static file paths (fragile) vs semantic references (fuzzy)? How to handle renames/refactors?
5. **Confidence decay** — How fast should unvalidated knowledge lose confidence? What triggers revalidation?
6. **Migration path** — How do existing users adopt intelligence features without breaking current workflows?

---

## Summary

The platform's current entity model provides a strong foundation. The evolution path is not adding more entity types or generic flexibility — it's adding **intelligence behaviors** on top of existing structure:

| From (current) | To (evolution) |
|---|---|
| Store and retrieve | Store, learn, and serve relevant context |
| Flat entity list | Relational knowledge graph |
| Manual memory management | Automatic outcome tracking and confidence |
| All-or-nothing context | Scoped, ranked, relevant context |
| Per-user knowledge | Shared team intelligence |
| Cold session starts | Warm session continuity |

**The competitive position:** First structured intelligence layer designed agent-first, accessible via MCP, that makes AI agents genuinely smarter over time on specific projects.
