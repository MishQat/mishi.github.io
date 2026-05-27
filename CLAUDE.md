# CLAUDE.md — Mishqat's Portfolio Site

## What this is
Personal portfolio for Ahmed Mishqat, a Mechanical Engineering undergraduate at the
University of Manchester. The site is a static frontend hosted on GitHub Pages.
No build tools, no frameworks — plain HTML, CSS, and JavaScript only.

---

## Repo structure
```
mishi.github.io/
├── index.html           ← single-page app, all sections live here
├── assets/
│   ├── images/          ← photos and project images
│   ├── cv/              ← CV PDF
│   ├── code/            ← Python scripts and project files
│   └── vids/            ← project videos
```

If new project assets are added (images, PDFs, videos), they go in the relevant
subfolder under assets/. Never place asset files in the root.

---

## Existing projects (in order on the page)
1. Autonomous Poker Dealer Robotic Arm
2. DMT Gravity-Propelled Car
3. 3-Axis CNC Positioning System
4. Hack-A-Bot: Toxic Waste Disposal Rover (24-hour hackathon)
5. Gear-Prix: Drivetrain Design Challenge

New projects should follow the same modal card pattern as these existing five.

---

## Design rules — DO NOT deviate from these

- Match the existing visual style exactly unless explicitly told otherwise
- Do not introduce new fonts — use whatever is already declared in the CSS
- Do not change the colour palette unless explicitly instructed
- Do not alter the nav or header under any circumstances
- Do not alter the footer under any circumstances
- Do not alter the CV modal or its open/close logic
- Do not remove or reorder existing projects unless explicitly asked
- Preserve all existing interactive 3D model embeds (they use a custom viewer)
- Preserve all existing modal open/close logic — new projects must use the same pattern
- Keep all file paths relative (e.g. assets/images/foo.jpg not /assets/images/foo.jpg)
  because the site is hosted in a subdirectory on GitHub Pages

---

## How to add a new project

1. Add a project card in the "Selected Projects" section of index.html
   - Follow the exact same HTML structure as the existing project cards
   - Use the next available project ID (e.g. project6, project7)
   - Include: title, short subtitle, one-line description
   - Link it to its modal using the same href="#projectN" pattern

2. Add the corresponding modal at the bottom of index.html
   - Follow the exact same modal HTML structure as existing ones
   - Include: title, tags/tech stack, role, description, reflection, any media
   - Use id="projectN" matching the card link

3. Place any images for the project in assets/images/
4. Place any PDFs in assets/code/ (yes, PDFs go here — that's the existing convention)
5. Place any videos in assets/vids/

---

## GitHub Pages deployment notes

- There is no build step. All changes go live on push to main.
- The site lives at: https://mishqat.github.io/mishi.github.io/
- Because it's in a subdirectory repo, ALL internal links and asset paths must be
  relative. Never use absolute paths starting with /
- After making changes, the deploy command is simply:
  git add . && git commit -m "your message" && git push

---

## What you are allowed to do without being asked
- Fix broken links
- Fix typos
- Correct indentation and formatting in HTML/CSS
- Ensure new additions are mobile responsive

## What you must always ask before doing
- Changing any colours, fonts, or visual design
- Restructuring the page layout
- Removing or reordering existing content
- Touching the nav, footer, or CV modal
- Adding any new JavaScript libraries or external dependencies

---

## Tone of the site
Engineering-focused, honest, and reflective. Project write-ups acknowledge failure and
limitations openly — this is intentional and should be preserved. Do not rewrite
project descriptions to sound more polished or marketing-y unless explicitly asked.

---

## Commit message style
Lowercase, concise, imperative tense.
Examples: `add imechE robot project`, `fix broken pdf link in project3`, `update bio text`
