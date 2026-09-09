import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const requiredSlideTitles = [
  "AI 零代碼建站 × AI Agent 自動化行銷",
  "今天的時間表",
  "現在就做：五個帳號檢查",
  "前台、後台、資料庫、伺服器",
  "今天這四個角色由誰扮演",
  "今天的完整路線",
  "上午場：用 AI 做出第一版官網",
  "AI Studio：從一句話開始",
  "講清楚需求，一次做出第一版",
  "產出後先檢查三件事",
  "改版與微調",
  "上午場：把成果存起來",
  "從 AI Studio 存到 GitHub",
  "GitHub 在做的事：時光機",
  "上午場：讓 AI 幫你部署與維護",
  "Claude Code 與 Codex 接手",
  "先接上 repo，再讓 AI 讀專案",
  "部署到 Vercel",
  "Vercel 做的事：幫你開店",
  "接上 Supabase 資料庫",
  "Supabase 做的事：你的倉庫",
  "推送即部署",
  "上午收尾：三個安全動作",
  "午休：下午讓網站自己說話",
  "下午的路線：兩件事分開看",
  "先說清楚：什麼免費，什麼要錢",
  "Meta 的三個硬限制",
  "AI Agent 跟 ChatGPT 差在哪",
  "下午場：Hermes Agent 示範",
  "Hermes Agent 是什麼",
  "示範一：讓 AI 記住你的品牌",
  "建立品牌人設",
  "示範二：把你的寫法變成技能",
  "示範三：用一句話設定排程",
  "示範四：用手機遠端指揮",
  "用 Agent 之前，先知道五件事",
  "回家自己裝：安裝步驟",
  "下午場：換你動手排程發文",
  "Buffer：註冊與連接帳號",
  "一次產出一週內容",
  "一則內容，三個平台版本",
  "配圖從哪裡來",
  "把內容排進 Buffer",
  "內容日曆與發文節奏",
  "踩雷清單",
  "想再往前一步，要付什麼",
  "今天你帶走了什麼",
];

const requiredSlideSummaries = [
  "今天做出網站，也做出會自己發文的系統。",
  "上午做網站，下午做自動化。",
  "現在不檢查，下午一定卡住。",
  "四個名詞，就是一間餐廳。",
  "每個工具負責一個角色。",
  "一條線走完，網站就上線。",
  "先把畫面做出來。",
  "用說的，就能做出網站。",
  "風格和需求一次給齊，AI 才做得準。",
  "讓 AI 自己檢查，再自己修。",
  "一次只改一個地方。",
  "存起來，才不會弄丟。",
  "把第一版存到 GitHub。",
  "改壞了，隨時回到昨天。",
  "接下來換 Claude 或 Codex 上場。",
  "它們能直接動你的專案檔案。",
  "先接上 repo，再讓 AI 看懂專案。",
  "一步一步來，每步都確認。",
  "伺服器就是讓網站一直開著的地方。",
  "有了資料庫，網站才記得住東西。",
  "表單、名單、訂單，都放在這裡。",
  "改好送出去，線上網站就自己更新。",
  "密碼和金鑰，永遠自己輸入。",
  "下午換內容上場。",
  "產內容是一件事，發出去是另一件事。",
  "免費做得到很多，但不是全部。",
  "這三件事，換什麼工具都一樣。",
  "它會記得、會排程、會自己動手。",
  "這一段看我操作就好。",
  "開源、免費、有桌面版。",
  "記得住品牌調性，才不用每次重講。",
  "一次設定，之後每篇都照這個寫。",
  "用說的就能教會它，不用寫程式。",
  "跟它說時間，它就會準時做。",
  "人在外面，也能叫它做事。",
  "方便和風險是同一件事。",
  "照著這五步，回家就能裝好。",
  "這一段大家一起做。",
  "三個免費名額，想清楚再接。",
  "一次規劃七天，不用天天想。",
  "同一個訊息，三種說法。",
  "用網頁版生圖，免費而且夠用。",
  "排好之後，它會自己發。",
  "穩定比爆紅重要。",
  "這些坑，先知道就不會踩。",
  "免費夠用，要更多再加錢。",
  "網站會上線，內容會持續。",
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

test("contains exactly 47 sections with the slide class", async () => {
  const html = await loadIndexHtml();

  assert.equal(getSlideSections(html).length, 47);
  assert.match(html, /data-total-slides>47</);
});

test("numbers every slide id and heading id sequentially", async () => {
  const html = await loadIndexHtml();
  const ids = [...html.matchAll(/<section class="[^"]*slide[^"]*" id="slide-(\d+)"/g)].map(
    (match) => Number(match[1]),
  );

  assert.deepEqual(
    ids,
    Array.from({ length: 47 }, (_, index) => index + 1),
  );

  for (const id of ids) {
    assert.match(
      html,
      new RegExp(`aria-labelledby="slide-${id}-title"`),
      `slide ${id} must point at its own heading`,
    );
    assert.match(
      html,
      new RegExp(`id="slide-${id}-title"`),
      `slide ${id} must define its own heading id`,
    );
  }
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

test("places a plain-language summary at the bottom of every slide", async () => {
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
      `slide ${index + 1} must include its plain-language summary`,
    );
  }
});

test("asks students to prepare every account before the workshop starts", async () => {
  const visibleText = getSlideText(await loadIndexHtml(), 2);

  assert.match(visibleText, /Google 帳號/);
  assert.match(visibleText, /GitHub 帳號/);
  assert.match(visibleText, /Facebook 粉絲專頁/);
  assert.match(visibleText, /Instagram 轉成專業帳號/);
  assert.match(visibleText, /Threads 設為公開/);
});

test("explains the four core concepts with a restaurant analogy", async () => {
  const visibleText = getSlideText(await loadIndexHtml(), 3);

  assert.match(visibleText, /前台/);
  assert.match(visibleText, /後台/);
  assert.match(visibleText, /資料庫/);
  assert.match(visibleText, /伺服器/);
  assert.match(visibleText, /餐廳/);
});

test("uses consistent Step and chapter numbers across every workflow page", async () => {
  const chapters = [
    [7, "01", "1-1"],
    [8, "01", "1-2"],
    [9, "01", "1-3"],
    [10, "01", "1-4"],
    [12, "02", "2-1"],
    [13, "02", "2-2"],
    [15, "03", "3-1"],
    [16, "03", "3-2"],
    [17, "03", "3-3"],
    [18, "03", "3-4"],
    [19, "04", "4-1"],
    [20, "04", "4-2"],
    [21, "04", "4-3"],
    [22, "05", "5-1"],
    [25, "06", "6-1"],
    [26, "06", "6-2"],
    [27, "06", "6-3"],
    [29, "07", "7-1"],
    [30, "07", "7-2"],
    [31, "07", "7-3"],
    [32, "07", "7-4"],
    [33, "07", "7-5"],
    [34, "07", "7-6"],
    [35, "07", "7-7"],
    [36, "07", "7-8"],
    [38, "08", "8-1"],
    [39, "08", "8-2"],
    [40, "08", "8-3"],
    [41, "08", "8-4"],
    [42, "08", "8-5"],
    [43, "08", "8-6"],
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

test("checks page information, share preview, and mobile layout before storing the frontend", async () => {
  const visibleText = getSlideText(await loadIndexHtml(), 9);

  assert.match(visibleText, /頁面資訊/);
  assert.match(visibleText, /分享預覽/);
  assert.match(visibleText, /手機版/);
});

test("explains first-time GitHub authorization from AI Studio", async () => {
  const slides = getSlideSections(await loadIndexHtml());
  const slideMarkup = slides[12];
  const visibleText = getVisibleText(slideMarkup);

  assert.match(visibleText, /第一次/);
  assert.match(visibleText, /授權/);
  assert.match(slideMarkup, /assets\/screenshots\/ai-studio-github-authorize\.png/);
});

test("keeps the morning safety steps about rotating keys and private repositories", async () => {
  const visibleText = getSlideText(await loadIndexHtml(), 22);

  assert.match(visibleText, /金鑰/);
  assert.match(visibleText, /重新產生/);
  assert.match(visibleText, /Private/);
  assert.match(visibleText, /(?:不要|不可|絕不).*(?:密碼|金鑰)/);
});

test("states what is free and what costs money before the automation section", async () => {
  const visibleText = getSlideText(await loadIndexHtml(), 25);

  assert.match(visibleText, /免費做得到/);
  assert.match(visibleText, /要錢/);
  assert.match(visibleText, /不需要信用卡/);
  assert.match(visibleText, /關機/);
});

test("warns about the three Meta publishing restrictions", async () => {
  const visibleText = getSlideText(await loadIndexHtml(), 26);

  assert.match(visibleText, /Instagram 個人帳號不能/);
  assert.match(visibleText, /Facebook 個人動態不能/);
  assert.match(visibleText, /25 篇/);
});

test("points readers at the official Hermes Agent domain only", async () => {
  const html = await loadIndexHtml();
  const visibleText = getSlideText(html, 29);

  assert.match(visibleText, /hermes-agent\.nousresearch\.com/);
  assert.doesNotMatch(html, /hermes-agent\.org/);
  assert.doesNotMatch(html, /hermes-agent\.ai/);
  assert.doesNotMatch(html, /hermesagent\.org/);
});

test("tells students not to install the agent during class", async () => {
  const visibleText = getSlideText(await loadIndexHtml(), 36);

  assert.match(visibleText, /回家/);
  assert.match(visibleText, /hermes-agent\.nousresearch\.com/);
  assert.match(visibleText, /不用信用卡/);
});

test("warns about the lifetime channel limit before connecting accounts", async () => {
  const visibleText = getSlideText(await loadIndexHtml(), 38);

  assert.match(visibleText, /八個/);
  assert.match(visibleText, /Threads 必須設為公開/);
});

test("provides ten copyable prompt cards wired to existing prompt bodies", async () => {
  const html = await loadIndexHtml();
  const targets = [...html.matchAll(/data-copy-target="([^"]+)"/g)].map(
    (match) => match[1],
  );

  assert.equal(targets.length, 10);
  assert.equal(new Set(targets).size, 10);

  for (const targetId of targets) {
    assert.match(
      html,
      new RegExp(`class="prompt-card__body" id="${targetId}"`),
      `prompt body ${targetId} must exist for its copy button`,
    );
  }

  assert.match(html, /<script type="module" src="prompt-card\.js"><\/script>/);
});

test("hides speaker notes from the projected slide by default", async () => {
  const html = await loadIndexHtml();
  const notes = [...html.matchAll(/<aside class="speaker-note"([^>]*)>/g)];

  assert.ok(notes.length > 0, "deck must carry at least one speaker note");
  for (const [, attributes] of notes) {
    assert.match(attributes, /\bhidden\b/, "every speaker note must start hidden");
  }
});

test("omits prohibited brand names from visible content", async () => {
  const visibleText = getVisibleText(await loadIndexHtml());

  assert.doesNotMatch(visibleText, /Gather/i);
  assert.doesNotMatch(visibleText, /給樂數位/);
});

test("navigates by keyboard and swipe without any on-screen navigation chrome", async () => {
  const html = await loadIndexHtml();

  assert.doesNotMatch(html, /data-dot-nav/);
  assert.doesNotMatch(html, /class="[^"]*dot-nav/);
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
