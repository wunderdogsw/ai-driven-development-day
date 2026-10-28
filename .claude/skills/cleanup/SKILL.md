---
name: cleanup
description: Show and remove what the hands-on day created for a participant's repo (the worktree or clone, the ai-day branch, workshop state). Use when the participant types /cleanup.
disable-model-invocation: true
---

Read `AGENTS.md`. Then, for the active target (or the one named in `$ARGUMENTS`):

1. Read `.workshop/targets/<name>/profile.json`.
2. List what exists, one line each:
   - The uncommitted drafts: `git -C targets/<name> status --short`.
   - The worktree (`git -C <source> worktree list`) or the clone in `targets/<name>/`.
   - The branch `ai-day/<participant>` in their repo.
   - `.workshop/targets/<name>/`.
3. Say: "If you want to keep a draft, copy it into your own checkout first. These commands delete the drafts."
4. Ask "Remove all of it?" On yes:
   - Worktree: `git -C <source> worktree remove --force targets/<name>` then `git -C <source> branch -D ai-day/<participant>`.
   - Clone: `rm -rf targets/<name>`.
   - Then `rm -rf .workshop/targets/<name>` and clear `activeTarget` in `progress.json`.
5. Confirm in one line what was removed. Their own checkout and branches were never changed.
