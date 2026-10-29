# HrashidSkills

Claude Code skills by Hassan Rashid.

## presentation/webPresentation/deck

Cinematic, story-driven HTML presentations: one world, one camera, acts, and click-by-click build-ups, in a dark/light EPAM look. The skill interviews you for the story, gets a storyboard approved, builds a single offline HTML deck, and screenshot-checks every step in both themes.

**Install**

```bash
git clone https://github.com/human06/HrashidSkills.git
mkdir -p ~/.claude/skills
cp -R HrashidSkills/presentation/webPresentation/deck ~/.claude/skills/
```

Restart Claude Code, then ask for a presentation (or type `/deck`). The self-check needs Node.js and Edge or Chrome; the skill installs `playwright-core` on first run.

Start with `presentation/webPresentation/deck/SKILL.md`.
