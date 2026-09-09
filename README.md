# AI 零代碼建站 × AI Agent 自動化行銷｜一日實戰營投影片

這是一份以原生 HTML、CSS 與 JavaScript 製作的單頁式線上簡報，供一日實戰營現場使用。全站不依賴前端框架，每張投影片佔滿一個畫面，適合桌機投影、平板與手機瀏覽。課程分成上午（用 AI 做出品牌官網並上線）與下午（建立 AI 內容生產線並排程發文）兩段。

## 投影片結構

全套共 48 張投影片：

1. AI 零代碼建站 × AI Agent 自動化行銷
2. 今天的時間表
3. 現在就做：五個帳號檢查
4. 前台、後台、資料庫、伺服器
5. 今天這四個角色由誰扮演
6. 今天的完整路線
7. 上午場：用 AI 做出第一版官網
8. AI Studio：從一句話開始
9. 先講清楚需求，再讓 AI 動手
10. 生成第一版網站
11. 產出後先檢查三件事
12. 改版與微調
13. 上午場：把成果存起來
14. 從 AI Studio 存到 GitHub
15. GitHub 在做的事：時光機
16. 上午場：讓 AI 幫你部署與維護
17. Claude Code 與 Codex 接手
18. 第一句話：先讀，不要改
19. 部署到 Vercel
20. Vercel 做的事：幫你開店
21. 接上 Supabase 資料庫
22. Supabase 做的事：你的倉庫
23. 推送即部署
24. 上午收尾：三個安全動作
25. 午休：下午讓網站自己說話
26. 下午的路線：兩件事分開看
27. 先說清楚：什麼免費，什麼要錢
28. Meta 的三個硬限制
29. AI Agent 跟 ChatGPT 差在哪
30. 下午場：Hermes Agent 示範
31. Hermes Agent 是什麼
32. 示範一：讓 AI 記住你的品牌
33. 建立品牌人設
34. 示範二：把你的寫法變成技能
35. 示範三：用一句話設定排程
36. 示範四：用手機遠端指揮
37. 用 Agent 之前，先知道五件事
38. 回家自己裝：安裝步驟
39. 下午場：換你動手排程發文
40. Buffer：註冊與連接帳號
41. 一次產出一週內容
42. 一則內容，三個平台版本
43. 配圖從哪裡來
44. 把內容排進 Buffer
45. 內容日曆與發文節奏
46. 踩雷清單
47. 想再往前一步，要付什麼
48. 今天你帶走了什麼

## 本機預覽

請在專案根目錄啟動靜態網站伺服器：

```bash
python3 -m http.server 4173
```

接著開啟 `http://localhost:4173`。

## 測試

```bash
npm test
```

## 操作方式

- 桌機可使用方向鍵、Page Up、Page Down、Home、End 與空白鍵翻頁。
- 手機與觸控裝置可上下滑動，投影片會自動吸附至完整頁面。
- 網址會同步目前頁數，例如 `#slide-48`；複製完整網址即可分享指定投影片。
- Prompt 卡片右上角的「複製」按鈕會把整段 prompt 複製到剪貼簿，學員可直接貼進 AI 工具；剪貼簿權限被拒時，會依序退回舊版複製指令與自動選取該段文字，並在按鈕上提示要按哪組快速鍵。
- 按下 `N` 可切換講者備忘的顯示；備忘預設隱藏，投影時不會被觀眾看到，偏好會記在瀏覽器本機儲存。
- 使用瀏覽器的「列印」功能，可直接列印或另存為 PDF；每張投影片會輸出成獨立頁面，並自動隱藏複製按鈕與講者備忘、展開 prompt 全文。

## 部署到 Vercel

1. 將此專案推送至 GitHub repository。
2. 在 Vercel 建立新專案並匯入該 repository。
3. 將 Production Branch 設定為 `main`。
4. Framework Preset 選擇 `Other`，根目錄維持 repository root。
5. 不需 Build Command、Output Directory 或環境變數，直接部署即可。

`vercel.json` 已設定靜態網站所需的乾淨網址、資產快取與保守安全標頭。根目錄的 `index.html` 會作為網站首頁；`.vercelignore` 則排除測試、規格文件、套件中繼資料與本機工具檔，部署內容只保留執行簡報需要的 HTML、CSS、JavaScript（`deck.js`、`deck-state.js`、`prompt-card.js`）、設定與 `assets/`。

### 快取策略

目前圖片與 SVG 的檔名未使用內容雜湊，因此不能設定一年期 `immutable` 快取。`assets/` 採用 `public, max-age=3600, must-revalidate`：

- 瀏覽器最多直接使用快取一小時。
- 快取到期後必須向 Vercel 重新驗證；檔案未變時可沿用，檔案更新時會取得新版。
- 更換資產檔名並同步更新 HTML 引用時，瀏覽器會立即請求新的 URL。
- Vercel CDN purge（清除）不會讓仍在 fresh 狀態的瀏覽器快取失效；若檔名不變，使用者仍可能看到舊檔，最久到 `max-age` 一小時屆滿。

## 安全注意事項

- 不應將任何 token commit 到 repository。
- API key、部署憑證與其他秘密資料不得寫入 HTML、CSS、JavaScript、README 或 Vercel 設定。
- 曾貼給 AI 的 token 與 API key 應視為已暴露，正式上線前重新產生，並撤銷舊憑證。
- 上線後可由 Claude on Chrome 或 Codex on Chrome 帶領瀏覽器操作：重新產生 key、更新 Vercel Environment Variables、更新 GitHub Actions Secrets（僅在 workflow 有使用時）、將 repository 設為 Private，最後重新部署與測試。
- `service-role key`、private API key、密碼與 Vercel token 不可放在前端、commit 進 GitHub 或交給 AI；真正輸入私密值時由老師手動處理。
- 建議讓 Claude Code / Codex 在本地端執行修改、測試、commit 與 push；以 GitHub 連動 Vercel 自動建立 Preview，`main` 的 push 則發布 Production。
- 確認自動部署成功後，將 GitHub repository 設為 Private，避免原始碼意外公開。

## 素材來源

- `assets/hero.jpg`：由使用者提供的原始投影片素材，SHA-256 為 `fb4f36a58af2dcb6412cdfe2ba20a3cb05644ffbd2a23831bc8cfc327ff07b18`。本 repository 不獨立主張該圖片的授權或使用權；素材提供者需自行確認其使用依據。
- `assets/logos/claude.svg`：Simple Icons 的 Anthropic 圖示；SHA-256 為 `1c10881e4729127e1a86e569613d786240acae13eacfa01860be065b66260e36`。
- `assets/logos/gemini.svg` 與 `assets/logos/google-ai-studio.svg`：Simple Icons 的 Google Gemini 圖示；SHA-256 均為 `404eba6940a54e63d40edcce2d2e7cb2b3dbfec765e7a1d523662b6f4e0d6747`。
- `assets/logos/github.svg`：Simple Icons 的 GitHub 圖示；SHA-256 為 `476ba7aa67b86da7d6e7567b08a4bf0eb1a2fd28da5fc243f8ee39a2f1ea6773`。
- `assets/logos/supabase.svg`：Simple Icons 的 Supabase 圖示；SHA-256 為 `75f9566421d97d4f1d8d7f34526189fd6e727ca83987432fc2477c2fc8388086`。
- `assets/logos/vercel.svg`：Simple Icons 的 Vercel 圖示；SHA-256 為 `075b9d221ef5a7ea63d85f140bd2d63007f31d3ed8ceec011abc3ffd529827e3`。
- `assets/logos/codex.svg`：依官方產品標誌整理的課程用向量圖；SHA-256 為 `d506bd59770e2daed3cd039b04686f8818884c0cd8c00686f44a3889eb09c8c2`。
- 可用 `shasum -a 256 assets/hero.jpg assets/logos/*.svg` 重現並核對以上雜湊；Simple Icons 圖示可由 `https://cdn.simpleicons.org/<slug>` 重新取得。
- 所有產品名稱與商標仍屬各自所有權人所有，本專案僅用於課程識別與教學說明。
- 來源註記只存在專案文件，不會在可見投影片加入網站或公司品牌。
