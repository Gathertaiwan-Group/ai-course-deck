import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const requiredSlideTitles = [
  "用 AI 打造全端網站",
  "今天做出可被找到的網站",
  "前置準備",
  "5 步完成網站",
  "AI Studio：快速做出前端",
  "前端完成前，先檢查 3 件事",
  "從 AI Studio 存到 GitHub",
  "本地端專案資料夾",
  "Claude Code 或 Codex 連動 repo",
  "Vercel 部署前端",
  "Supabase 串資料，持續修改到完成",
  "貼給 AI 的 key，視為已曝光",
  "新 key：手動更新 Vercel",
  "有自動化才更新 GitHub Secrets",
  "同步本地 .env.local，測試後再推送",
  "讓 Claude Code 協助維護",
  "推送即部署",
  "網站完成後的三件事",
  "完成一個可持續維護的網站",
];

async function loadIndexHtml() {
  try {
    return await readFile(new URL("../index.html", import.meta.url), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      assert.fail("index.html must exist before deck content behavior can pass");
    }

    throw error;
  }
}

function getVisibleText(html) {
  const source = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ");
  const tokens = source.match(/<[^>]*>|[^<]+/g) ?? [];
  const elementStack = [];
  const visibleText = [];
  const voidElements = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
  ]);
  let hiddenDepth = 0;

  for (const token of tokens) {
    if (!token.startsWith("<")) {
      if (hiddenDepth === 0) {
        visibleText.push(token);
      }
      continue;
    }

    const closingTag = token.match(/^<\s*\/\s*([a-z][\w:-]*)/i);
    if (closingTag) {
      const tagName = closingTag[1].toLowerCase();
      const matchingIndex = elementStack.findLastIndex(
        (element) => element.tagName === tagName,
      );

      if (matchingIndex >= 0) {
        for (let index = elementStack.length - 1; index >= matchingIndex; index -= 1) {
          if (elementStack[index].hidden) {
            hiddenDepth -= 1;
          }
        }
        elementStack.length = matchingIndex;
      }
      continue;
    }

    const openingTag = token.match(/^<\s*([a-z][\w:-]*)/i);
    if (!openingTag) {
      continue;
    }

    const tagName = openingTag[1].toLowerCase();
    const hasHiddenAttribute =
      /\shidden(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?(?=\s|\/?>)/i.test(token);
    const isAriaHidden =
      /\saria-hidden\s*=\s*(?:"true"|'true'|true)(?=\s|\/?>)/i.test(token);
    const isHidden = hiddenDepth > 0 || hasHiddenAttribute || isAriaHidden;
    const isSelfClosing = /\/\s*>$/.test(token) || voidElements.has(tagName);

    if (!isSelfClosing) {
      elementStack.push({ tagName, hidden: isHidden });
      if (isHidden) {
        hiddenDepth += 1;
      }
    }
  }

  return visibleText.join(" ").replace(/\s+/g, " ").trim();
}

function getSlideSections(html) {
  const sections = [];
  const sectionPattern = /<section\b([^>]*)>[\s\S]*?<\/section\s*>/gi;

  for (const match of html.matchAll(sectionPattern)) {
    const classAttribute = match[1].match(/\bclass\s*=\s*(["'])([^"']*)\1/i);
    const classNames = classAttribute?.[2].split(/\s+/) ?? [];

    if (classNames.includes("slide")) {
      sections.push(match[0]);
    }
  }

  return sections;
}

function getSlideText(html, slideIndex) {
  const slide = getSlideSections(html)[slideIndex];

  assert.ok(slide, `slide ${slideIndex + 1} must exist`);
  return getVisibleText(slide);
}

test("contains exactly 19 sections with the slide class", async () => {
  const html = await loadIndexHtml();

  assert.equal(getSlideSections(html).length, 19);
});

test("places every approved title in its corresponding slide section", async () => {
  const slides = getSlideSections(await loadIndexHtml());

  assert.equal(slides.length, requiredSlideTitles.length);
  for (const [index, title] of requiredSlideTitles.entries()) {
    const slideText = getVisibleText(slides[index]);
    assert.ok(
      slideText.includes(title),
      `slide ${index + 1} must contain its required title: ${title}`,
    );
  }
});

test("requires every AI-shared token and API key to be regenerated after launch", async () => {
  const visibleText = getSlideText(await loadIndexHtml(), 11);

  assert.match(visibleText, /(?:所有|每一把|全部)/);
  assert.match(visibleText, /(?:貼給|提供給|分享給|交給)/);
  assert.match(visibleText, /\bAI\b/i);
  assert.match(visibleText, /\btoken\b/i);
  assert.match(visibleText, /\bAPI key\b/i);
  assert.match(visibleText, /(?:上線前|正式上線)/);
  assert.match(visibleText, /(?:重新產生|重新生成|重新更換|換一把)/);
});

test("forbids private and service-role keys in frontend code", async () => {
  const visibleText = getSlideText(await loadIndexHtml(), 11);

  assert.match(visibleText, /\bprivate key\b/i);
  assert.match(visibleText, /\bservice-role key\b/i);
  assert.match(visibleText, /(?:不能|不可|禁止|絕不)/);
  assert.match(visibleText, /(?:前端|frontend)/i);
});

test("checks Meta information, Open Graph, and RWD before storing the frontend", async () => {
  const visibleText = getSlideText(await loadIndexHtml(), 5);

  assert.match(visibleText, /Meta/);
  assert.match(visibleText, /Open Graph/);
  assert.match(visibleText, /RWD/);
});

test("teaches the ordered rotation of Vercel, GitHub, and local secrets", async () => {
  const vercelText = getSlideText(await loadIndexHtml(), 12);
  const githubText = getSlideText(await loadIndexHtml(), 13);
  const localText = getSlideText(await loadIndexHtml(), 14);

  assert.match(vercelText, /Vercel/);
  assert.match(vercelText, /Environment Variables/);
  assert.match(vercelText, /重新部署/);
  assert.match(githubText, /GitHub Actions Secrets/);
  assert.match(githubText, /(?:有自動化|只有.*自動化)/);
  assert.match(localText, /\.env\.local/);
  assert.match(localText, /(?:不要|不可|絕不).*commit/);
});

test("teaches Claude Code maintenance and Git-driven Vercel deployment", async () => {
  const claudeText = getSlideText(await loadIndexHtml(), 15);
  const deployText = getSlideText(await loadIndexHtml(), 16);

  assert.match(claudeText, /Claude Code/);
  assert.match(claudeText, /(?:測試|檢查)/);
  assert.match(claudeText, /commit/);
  assert.match(claudeText, /push/);
  assert.match(deployText, /Preview/);
  assert.match(deployText, /main/);
  assert.match(deployText, /Production/);
});

test("omits prohibited brand names from visible content", async () => {
  const visibleText = getVisibleText(await loadIndexHtml());

  assert.doesNotMatch(visibleText, /Gather/i);
  assert.doesNotMatch(visibleText, /給樂數位/);
});

test("uses keyboard, swipe, and dot navigation without fixed previous or next buttons", async () => {
  const html = await loadIndexHtml();

  assert.match(html, /data-dot-nav/);
  assert.doesNotMatch(html, /data-deck-previous/);
  assert.doesNotMatch(html, /data-deck-next/);
  assert.doesNotMatch(html, /class="[^"]*click-zone/);
});

test("excludes non-visible containers and hidden elements from visible text", () => {
  const html = `
    <main>
      顯示內容
      <script>Gather</script>
      <style>.給樂數位 { display: block; }</style>
      <template>Gather 給樂數位</template>
      <p hidden>Gather</p>
      <div aria-hidden="true"><span>給樂數位</span></div>
    </main>
  `;

  assert.equal(getVisibleText(html), "顯示內容");
});
