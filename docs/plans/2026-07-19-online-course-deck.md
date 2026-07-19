# AI Course Deck Online Presentation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build and deploy a responsive 16-slide online course presentation that matches the approved Apple-like PowerPoint design.

**Architecture:** Use a framework-free static website with semantic HTML, a dedicated CSS design system, and small JavaScript modules for navigation state and DOM behavior. Vercel serves the repository directly, while Node’s built-in test runner verifies pure navigation logic and required presentation content.

**Tech Stack:** HTML5, CSS, JavaScript ES modules, Node.js test runner, Playwright/browser QA, Vercel static hosting

---

### Task 1: Establish Repository Safety and Test Harness

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Create: `tests/deck-state.test.mjs`
- Create: `tests/content.test.mjs`

**Step 1: Write failing navigation tests**

Test that slide indices clamp correctly, progress reaches 100% on the last slide, and hashes use `#slide-N`.

**Step 2: Write failing content tests**

Test that `index.html` contains exactly 16 slide sections, all required slide titles, the token rotation warning, and no visible prohibited brand names.

**Step 3: Run tests to verify they fail**

Run: `npm test`

Expected: FAIL because production files do not exist.

**Step 4: Add repository safety rules**

Ignore `.env`, `.env.*`, `.vercel`, macOS metadata, and local test artifacts.

**Step 5: Commit**

```bash
git add .gitignore package.json tests
git commit -m "test: define online deck behavior"
```

### Task 2: Implement Pure Navigation State

**Files:**
- Create: `deck-state.js`

**Step 1: Implement minimal navigation helpers**

Export functions for clamping indices, calculating progress, parsing slide hashes, and formatting slide hashes.

**Step 2: Run unit tests**

Run: `npm test`

Expected: navigation tests PASS; content tests remain FAIL because `index.html` is not implemented.

**Step 3: Commit**

```bash
git add deck-state.js
git commit -m "feat: add deck navigation state"
```

### Task 3: Build the Semantic 16-Slide Document

**Files:**
- Create: `index.html`

**Step 1: Add accessible document structure**

Create progress, slide navigation, click navigation controls, and 16 ordered slide sections.

**Step 2: Add concise approved course copy**

Preserve the current PowerPoint titles, chapter numbering, five-tool workflow, prerequisites, database concepts, deployment flow, and course conclusion.

**Step 3: Add explicit key-rotation guidance**

State that all tokens and API keys shared with AI must be regenerated after launch, and private/service-role keys never belong in frontend code.

**Step 4: Run content tests**

Run: `npm test`

Expected: all unit and content tests PASS.

**Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add online course deck content"
```

### Task 4: Implement Apple-Like Responsive Styling

**Files:**
- Create: `styles.css`
- Create: `assets/`

**Step 1: Define design tokens**

Add the approved white/gray surfaces, blue `#1668c2`, orange `#ef7d22`, typography scale, spacing, easing, and shadow tokens.

**Step 2: Build slide compositions**

Implement full-viewport scroll snapping, large headlines, chapter markers, tool visuals, workflow steps, and varied slide silhouettes.

**Step 3: Add responsive rules**

Adapt two-column slides to mobile, preserve readable typography, keep controls within safe areas, and prevent horizontal overflow.

**Step 4: Add motion and print rules**

Use opacity/transform reveals, respect reduced motion, and render one slide per printed page.

**Step 5: Inspect assets**

Use optimized local raster or SVG assets with descriptive alt text and no removed brand marks.

**Step 6: Commit**

```bash
git add styles.css assets
git commit -m "feat: style responsive Apple-like deck"
```

### Task 5: Implement Presentation Controls

**Files:**
- Create: `deck.js`

**Step 1: Add keyboard navigation**

Support Arrow keys, Page Up, Page Down, Home, End, and Space while avoiding repeated transitions.

**Step 2: Add click navigation**

Use fixed accessible previous/next hit areas without interfering with navigation dots or links.

**Step 3: Add scroll and hash synchronization**

Use IntersectionObserver to update progress, dot state, slide number, and URL hash.

**Step 4: Add reveal behavior**

Reveal the active slide’s content and keep reduced-motion behavior static.

**Step 5: Run tests**

Run: `npm test`

Expected: PASS with zero failures.

**Step 6: Commit**

```bash
git add deck.js
git commit -m "feat: add presentation navigation"
```

### Task 6: Add Static Deployment Configuration

**Files:**
- Create: `vercel.json`
- Create: `README.md`

**Step 1: Configure Vercel**

Set clean static routing, cache rules for assets, and browser security headers without storing credentials.

**Step 2: Document local use**

Explain how to run tests, preview locally, navigate slides, print to PDF, and deploy.

**Step 3: Run repository checks**

Run: `npm test`

Expected: PASS.

Run: `git grep -nE 'vcp_|ghp_|gho_|service_role|PRIVATE_KEY' -- . ':!docs/plans/*'`

Expected: no credential matches in production files.

**Step 4: Commit**

```bash
git add vercel.json README.md
git commit -m "chore: configure static deployment"
```

### Task 7: Perform Browser and Visual QA

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `deck.js`

**Step 1: Serve the site locally**

Run: `python3 -m http.server 4173`

Expected: site available at `http://127.0.0.1:4173`.

**Step 2: Verify desktop behavior**

Check every slide at 1440×900, keyboard navigation, click navigation, dot navigation, progress, hash updates, focus states, and console output.

**Step 3: Verify mobile behavior**

Check every slide at 390×844 for clipping, overflow, readability, and touch scrolling.

**Step 4: Capture screenshots**

Create desktop and mobile screenshots for final visual inspection.

**Step 5: Fix any defects and rerun tests**

Run: `npm test`

Expected: PASS after all visual fixes.

**Step 6: Commit**

```bash
git add index.html styles.css deck.js
git commit -m "fix: polish responsive deck presentation"
```

### Task 8: Push and Deploy

**Files:**
- No source changes expected

**Step 1: Verify repository state**

Run: `git status --short`

Expected: clean working tree.

**Step 2: Push main**

Run: `git push -u origin main`

Expected: branch pushed to `Gathertaiwan-Group/ai-course-deck`.

**Step 3: Deploy to Vercel**

Run Vercel production deployment with the provided token supplied only through the process environment.

Expected: successful production deployment URL.

**Step 4: Verify production**

Open the production URL and repeat navigation, responsive, and console checks.

**Step 5: Record handoff**

Report the GitHub repository, production URL, verification evidence, and remind the user to revoke and replace the exposed Vercel token.

