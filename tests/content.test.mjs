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
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countSlideSections(html) {
  const sectionTags = html.match(/<section\b[^>]*>/gi) ?? [];

  return sectionTags.filter((tag) => {
    const classAttribute = tag.match(/\bclass\s*=\s*(["'])(.*?)\1/i);
    const classNames = classAttribute?.[2].split(/\s+/) ?? [];
    return classNames.includes("slide");
  }).length;
}

test("contains exactly 16 sections with the slide class", async () => {
  const html = await loadIndexHtml();

  assert.equal(countSlideSections(html), 16);
});

test("contains every approved slide title", async () => {
  const visibleText = getVisibleText(await loadIndexHtml());

  for (const title of requiredSlideTitles) {
    assert.ok(visibleText.includes(title), `missing required slide title: ${title}`);
  }
});

test("requires every AI-shared token and API key to be regenerated after launch", async () => {
  const visibleText = getVisibleText(await loadIndexHtml());

  assert.match(
    visibleText,
    /(?:所有|每一把|全部).{0,30}token.{0,30}API key.{0,40}上線後.{0,30}(?:重新產生|重新生成|重新更換|換一把)/i,
  );
});

test("forbids private and service-role keys in frontend code", async () => {
  const visibleText = getVisibleText(await loadIndexHtml());

  assert.match(
    visibleText,
    /private key.{0,40}service-role key.{0,40}(?:不能|不可|禁止|絕不).{0,20}(?:前端|frontend)/i,
  );
});

test("omits prohibited brand names from visible content", async () => {
  const visibleText = getVisibleText(await loadIndexHtml());

  assert.doesNotMatch(visibleText, /Gather/i);
  assert.doesNotMatch(visibleText, /給樂數位/);
});
