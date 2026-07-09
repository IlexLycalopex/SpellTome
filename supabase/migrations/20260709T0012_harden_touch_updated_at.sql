-- Applied to project edmeogmkquhslpvjelyq on 2026-07-09 (via MCP).
-- Advisor fix: pin the trigger function's search_path (it references no
-- tables, but a mutable search_path is flagged by the security linter).
alter function tome_private.touch_updated_at() set search_path = '';
