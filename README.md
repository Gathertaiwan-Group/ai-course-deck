# AI 全端網站實戰課｜線上投影片

這是一份以原生 HTML、CSS 與 JavaScript 製作的單頁式線上簡報。全站不依賴前端框架，每張投影片佔滿一個畫面，適合桌機投影、平板與手機瀏覽。

## 投影片結構

全套共 16 張投影片：

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
- 可使用右側圓點直接前往指定頁面。
- 手機與觸控裝置可上下滑動，投影片會自動吸附至完整頁面。
- 網址會同步目前頁數，例如 `#slide-13`；複製完整網址即可分享指定投影片。
- 使用瀏覽器的「列印」功能，可直接列印或另存為 PDF；每張投影片會輸出成獨立頁面。

## 部署到 Vercel

1. 將此專案推送至 GitHub repository。
2. 在 Vercel 建立新專案並匯入該 repository。
3. 將 Production Branch 設定為 `main`。
4. Framework Preset 選擇 `Other`，根目錄維持 repository root。
5. 不需 Build Command、Output Directory 或環境變數，直接部署即可。

`vercel.json` 已設定靜態網站所需的乾淨網址、資產快取與保守安全標頭。根目錄的 `index.html` 會作為網站首頁；`.vercelignore` 則排除測試、規格文件、套件中繼資料與本機工具檔，部署內容只保留執行簡報需要的 HTML、CSS、JavaScript、設定與 `assets/`。

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
