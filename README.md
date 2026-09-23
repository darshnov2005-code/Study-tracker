# CA Final Study Tracker — November 2027

Built for a CA Final November 2027 preparation plan with three revisions.

## Subject model
- FR — lecture based
- AFM — lecture based
- Audit — lecture based + Fast Track / alternative resources
- DT — self-study for now; lectures can be added later
- IDT — self-study for now; lectures can be added later
- IBS — self-study / case-study based

## Features
- Dashboard and subject cards
- Lecture progress and duration tracking
- Three revision stages: R1, R2, R3
- Resource library for Google Drive, YouTube, ICAI, RTP, MTP, notes and question banks
- Bulk PDF / Excel / CSV import with preview
- Different source layouts can be normalized into one tracker
- Manual self-study items
- Search/filter lecture tracker
- Analytics
- JSON backup/restore
- No OpenAI API key required

## Source formats supported
The importer is designed around the actual FR/AFM table-of-contents PDFs and Audit lecture sheet supplied for this project.

For FR/AFM, the source contains day, lecture, duration, size, question numbers, concepts and board-note page information.
For Audit, the source contains serial number, lecture name, duration, category and topic/coverage information, including pending/fast-track notes.

## Deploy
Static site. Deploy the repository to Vercel or GitHub Pages. No build command is required.


## Preloaded data
The repository now includes preloaded lecture data extracted from the FR Batch 9, AFM Batch 9 and Audit B56 lecture sheets supplied in this project. The app loads these automatically on first launch. You can still import updated PDFs/Excels later.

## Planner
Set your lecture-completion, R1, R2, R3 and exam dates under Settings. Planner then calculates remaining lecture hours and the approximate lecture hours/day needed to hit the lecture target.

## Direct upload
Import Centre now has a direct **Upload PDF / Excel** button on each lecture-based subject, so you do not need to first select the subject and then look for a file picker.