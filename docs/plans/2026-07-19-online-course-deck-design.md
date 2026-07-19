# AI Course Deck Online Presentation Design

## Goal

Convert the approved 16-slide AI full-stack website course deck into a responsive online presentation. Each slide occupies one viewport, preserves the current minimal Apple-like visual direction, and supports presentation-friendly navigation on desktop and mobile.

## Audience

The deck is for beginners attending a two-hour live course on building and deploying a full-stack website with AI tools. Visible copy must remain concise, readable from a projected screen, and understandable without technical background.

## Visual Direction

- Use the existing deck as the content and composition reference.
- Keep a light Apple-like palette: warm white, soft gray, blue `#1668c2`, and orange `#ef7d22`.
- Use large headlines, generous spacing, restrained shadows, and one dominant visual per slide.
- Preserve chapter markers such as `CH.1-1` and large section numbers such as `1-1`.
- Do not display the Gather logo, the word “Gather,” or “給樂數位.”
- Use tool marks only where they explain the course workflow.
- Animate with short opacity, vertical translation, and subtle image scale effects. Avoid decorative or distracting motion.

## Content Structure

The site contains 16 full-screen slides:

1. 用 AI 打造全端網站
2. 今天做出上線網站
3. 前置準備
4. 第一堂：做出網站雛形
5. 5 大工具，各有位置
6. AI Studio 生成前端
7. 預覽，再微調
8. 資料庫像一張表
9. 前端讀寫資料
10. GitHub 保留每次修改
11. 第二堂：上線與維護
12. Vercel 一鍵上線
13. 上線後，先換 key
14. Claude Code 修改網站
15. Codex 新增功能
16. 以後做網站，先走這 5 步

The security slide must explicitly state that every token or API key shared with an AI tool must be regenerated after launch. Private keys and Supabase service-role keys must never be placed in frontend code.

## Interaction Design

- Vertical scrolling uses mandatory scroll snapping, one slide per viewport.
- Arrow keys, Page Up, Page Down, Home, End, and Space navigate slides.
- Touch users swipe vertically and retain native scrolling behavior.
- A fixed progress line indicates overall progress.
- Desktop users get a right-side dot navigation with accessible labels.
- The URL hash tracks the current slide, allowing links such as `#slide-13`.
- Reduced-motion preferences disable nonessential transitions.
- Print styles render each slide as a separate page for browser PDF export.

## Architecture

Use a framework-free static site:

- `index.html` contains semantic slide sections and accessible navigation.
- `styles.css` owns the design system, responsive layouts, motion, and print rules.
- `deck-state.js` contains pure navigation and progress helpers.
- `deck.js` connects keyboard, click, scroll, hash, and IntersectionObserver behavior.
- `assets/` contains optimized local images and tool marks.
- `vercel.json` configures static deployment and security headers.

This architecture matches the reference repository while avoiding unnecessary dependencies and build steps.

## Accessibility and Responsive Behavior

- Use semantic headings and ordered slide structure.
- Keep navigation controls at least 44×44 pixels.
- Provide visible keyboard focus and descriptive ARIA labels.
- Keep normal text at least 16 px on mobile.
- Maintain at least WCAG AA contrast for instructional copy.
- Prevent horizontal scrolling at all supported viewport sizes.
- Adapt dense two-column slides to a single-column mobile composition without reducing important copy below readable size.

## Security

- Never write deployment credentials into source files, Git history, or documentation.
- Use the Vercel token only through the deployment command environment.
- Add `.env*` and `.vercel` to `.gitignore`.
- Configure basic browser security headers for the static deployment.
- Rotate the deployment token after this work because it was shared in the conversation.

## Verification

- Unit-test slide index, hash, and progress calculations.
- Test that the document contains exactly 16 slides and all required course/security copy.
- Verify prohibited brand text is absent from visible page content.
- Run browser checks for keyboard navigation, click navigation, hash updates, responsive layout, and console errors.
- Inspect desktop and mobile screenshots.
- Validate deployment status and production URL after pushing `main`.
