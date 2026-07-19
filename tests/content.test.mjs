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
  "讓 Claude Code 或 Codex 協助維護",
  "設定自動更新（推送即部署）",
  "網站完成後的三件事",
  "網站上線後，用 AI 處理安全設定",
  "完成一個可持續維護的網站",
];

const requiredSlideSummaries = [
  "AI 幫你把想法做成網站。",
  "做出能用、能分享、能被找到的網站。",
  "先準備帳號和 key。",
  "每個工具各做一件事。",
  "說清楚需求，AI 幫你做畫面。",
  "確認手機、分享和搜尋都正常。",
  "把第一版存到 GitHub。",
  "在電腦保留專案資料夾。",
  "讓 AI 先看懂，再幫你改。",
  "用 Vercel 把網站公開。",
  "串上資料，持續修改。",
  "一次改一件事，先測試。",
  "改好送出去，線上網站就會自己變新。",
  "接網域、GA 和 Search Console。",
  "上線後，請 AI 用瀏覽器把安全設定做完。",
  "網站完成後，持續優化。",
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

test("contains exactly 16 sections with the slide class", async () => {
  const html = await loadIndexHtml();

  assert.equal(getSlideSections(html).length, 16);
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

test("places a child-friendly summary at the bottom of every slide", async () => {
  const slides = getSlideSections(await loadIndexHtml());

  assert.equal(slides.length, requiredSlideSummaries.length);
  for (const [index, summary] of requiredSlideSummaries.entries()) {
    assert.match(
      slides[index],
      /class="slide-summary"/,
      `slide ${index + 1} must include a summary element`,
    );
    assert.ok(
      getVisibleText(slides[index]).includes(summary),
      `slide ${index + 1} must include its child-friendly summary`,
    );
  }
});

test("lists required Vercel and Supabase credentials before class", async () => {
  const visibleText = getSlideText(await loadIndexHtml(), 2);

  assert.match(visibleText, /開好 Vercel 帳號/);
  assert.match(visibleText, /取得 Vercel token/);
  assert.match(visibleText, /開好 Supabase 帳號/);
  assert.match(visibleText, /取得 Supabase (?:token|API key)/);
  assert.doesNotMatch(visibleText, /準備可收驗證信的信箱/);
});

test("introduces the five-step website production flow after the outcome", async () => {
  const visibleText = getSlideText(await loadIndexHtml(), 3);

  assert.match(visibleText, /(?:5 步|五步驟)/);
  assert.match(visibleText, /生成前端/);
  assert.match(visibleText, /存進 GitHub/);
  assert.match(visibleText, /本地開發/);
  assert.match(visibleText, /部署完成/);
  assert.match(visibleText, /持續優化/);
});

test("uses consistent Step and chapter numbers across every workflow page", async () => {
  const chapters = [
    [4, "01", "1-1"],
    [5, "01", "1-2"],
    [6, "02", "2-1"],
    [7, "03", "3-1"],
    [8, "03", "3-2"],
    [9, "04", "4-1"],
    [10, "04", "4-2"],
    [11, "04", "4-3"],
    [12, "04", "4-4"],
    [13, "05", "5-1"],
    [14, "05", "5-2"],
  ];
  const slides = getSlideSections(await loadIndexHtml());

  for (const [index, step, chapter] of chapters) {
    assert.match(
      slides[index],
      new RegExp(`class="chapter-badge">STEP ${step}<`),
      `slide ${index + 1} must show STEP ${step} in the upper-left index`,
    );
    assert.match(
      slides[index],
      new RegExp(`class="chapter-large-number"[^>]*>${chapter}<`),
      `slide ${index + 1} must show chapter ${chapter} in the lower-left index`,
    );
  }
});

test("checks Meta information, Open Graph, and RWD before storing the frontend", async () => {
  const visibleText = getSlideText(await loadIndexHtml(), 5);

  assert.match(visibleText, /Meta/);
  assert.match(visibleText, /Open Graph/);
  assert.match(visibleText, /RWD/);
});

test("teaches AI maintenance and Git-driven Vercel deployment", async () => {
  const claudeText = getSlideText(await loadIndexHtml(), 11);
  const deployText = getSlideText(await loadIndexHtml(), 12);

  assert.match(claudeText, /Claude Code/);
  assert.match(claudeText, /(?:測試|檢查)/);
  assert.match(claudeText, /commit/);
  assert.match(claudeText, /push/);
  assert.match(deployText, /本地改完/);
  assert.match(deployText, /commit \/ push/);
  assert.match(deployText, /Vercel.*自動更新|Vercel.*自動部署/);
  assert.match(deployText, /線上網址檢查/);
  assert.match(deployText, /repository.*Private|repo.*Private/i);
  assert.match(deployText, /自動部署.*成功|部署.*成功.*repository/i);
});

test("uses browser-connected AI to complete all post-launch safety tasks", async () => {
  const visibleText = getSlideText(await loadIndexHtml(), 14);

  assert.match(visibleText, /網站上線後/);
  assert.match(visibleText, /Claude on Chrome/);
  assert.match(visibleText, /Codex on Chrome/);
  assert.match(visibleText, /(?:操控|控制).*瀏覽器/);
  assert.match(visibleText, /我們只要看著/);
  assert.match(visibleText, /(?:重新產生|換新).*key/);
  assert.match(visibleText, /Vercel/);
  assert.match(visibleText, /GitHub Actions Secrets/);
  assert.match(visibleText, /repository.*Private|repo.*Private/i);
  assert.match(visibleText, /(?:不要|不可|絕不).*token/);
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
