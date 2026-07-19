import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const requiredSlideTitles = [
  "用 AI 打造全端網站",
  "今天做出上線網站",
  "前置準備",
  "第一堂：做出網站雛形",
  "5 大工具，各有位置",
  "AI Studio 生成前端",
  "預覽，再微調",
  "資料庫像一張表",
  "前端讀寫資料",
  "GitHub 保留每次修改",
  "第二堂：上線與維護",
  "Vercel 一鍵上線",
  "上線後，先換 key",
  "Claude Code 修改網站",
  "Codex 新增功能",
  "以後做網站，先走這 5 步",
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

test("requires every AI-shared token and API key to be regenerated after launch", async () => {
  const visibleText = getSlideText(await loadIndexHtml(), 12);

  assert.match(visibleText, /(?:所有|每一把|全部)/);
  assert.match(visibleText, /(?:貼給|提供給|分享給|交給)/);
  assert.match(visibleText, /\bAI\b/i);
  assert.match(visibleText, /\btoken\b/i);
  assert.match(visibleText, /\bAPI key\b/i);
  assert.match(visibleText, /上線後/);
  assert.match(visibleText, /(?:重新產生|重新生成|重新更換|換一把)/);
});

test("forbids private and service-role keys in frontend code", async () => {
  const visibleText = getSlideText(await loadIndexHtml(), 12);

  assert.match(visibleText, /\bprivate key\b/i);
  assert.match(visibleText, /\bservice-role key\b/i);
  assert.match(visibleText, /(?:不能|不可|禁止|絕不)/);
  assert.match(visibleText, /(?:前端|frontend)/i);
});

test("omits prohibited brand names from visible content", async () => {
  const visibleText = getVisibleText(await loadIndexHtml());

  assert.doesNotMatch(visibleText, /Gather/i);
  assert.doesNotMatch(visibleText, /給樂數位/);
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
