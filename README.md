# CA Final Study Tracker — November 2027

Personal study tracker for CA Final Nov 2027 with three revision cycles, question practice, spaced repetition, and a daily planner.

**Live:** https://study-tracker-six-murex.vercel.app

## Subjects
- **FR** — lecture based (preloaded Batch data)
- **AFM** — lecture based (preloaded Batch data)
- **Audit** — lectures + Fast Track (preloaded)
- **DT / IDT / IBS** — self-study (upload a schedule anytime to switch to lecture mode)

## Features (v5)
- Dashboard with readiness score, **Today’s plan**, exam milestones, and lecture-hour burn-down
- Lecture progress + duration tracking (cleaned titles/chapters)
- Three revision stages: R1 / R2 / R3 with **due / overdue / upcoming** filters
- Optional **SM-2 spaced repetition** (Settings → Revision algorithm)
- **Question bank**: RTP / MTP / ICAI / class practice with accuracy & weak flags
- **Study session timer** (sidebar — Start/Pause; double-click time to log hours)
- **Syllabus coverage** by Ind AS / SA / chapter on the Subjects page
- Exam countdown milestones (lectures finish, R1, R2, R3, exam)
- **Printable weekly revision sheet**
- **Dark mode** toggle
- Mobile hamburger navigation
- Resource library (Drive, YouTube, ICAI, notes, Q-banks)
- Bulk Excel/CSV import with column auto-detect
- JSON backup / restore
- Works fully offline after first load (static site, localStorage)

## Deploy
Static site. Deploy to Vercel or GitHub Pages. No build step.

## Data
Preloaded lecture lists live in `data/fr.json`, `data/afm.json`, `data/audit.json` (cleaned titles, chapters, syllabus tags, durations in seconds). First visit loads them automatically if the local store is empty.

## Settings tips
1. Set **Exam date**, **Lecture finish target**, and R1/R2/R3 targets.
2. Set realistic **daily hours**.
3. Switch to **SM-2** once you are in revision mode for theory-heavy subjects.
4. Use **Print week sheet** every Sunday to plan the next 7 days.
