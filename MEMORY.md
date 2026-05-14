# VrseBuilder Agent Memory

This is the jsonClaw workspace — a VrseBuilder story editing system.

## Project
- Repo: `C:\autovrse\jsonClaw`
- Plugin: `openclaw-plugin-vrsebuilder-tools` (14 tools for story editing)
- Gateway port: 19001

## Stack
- Plugin tools: load/search/edit/save VrseBuilder story JSON
- Storage: Pinecone (vector search) + in-memory workspaceContext
- Pipeline: atomic diffs with rollback via executor.js

## Key tools
- `load_story` — must be called first with a storyId and file path
- `apply_diffs` — atomic field-level edits with rollback
- `verify_story` — integrity checks after edits
- `save_story` — write final JSON to disk
