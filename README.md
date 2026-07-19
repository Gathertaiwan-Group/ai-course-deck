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
- 可點擊畫面左右側控制按鈕，或使用右側圓點直接前往指定頁面。
- 手機與觸控裝置可上下滑動，投影片會自動吸附至完整頁面。
- 網址會同步目前頁數，例如 `#slide-13`；複製完整網址即可分享指定投影片。
- 使用瀏覽器的「列印」功能，可直接列印或另存為 PDF；每張投影片會輸出成獨立頁面。

## 部署到 Vercel

1. 將此專案推送至 GitHub repository。
2. 在 Vercel 建立新專案並匯入該 repository。
3. 將 Production Branch 設定為 `main`。
4. Framework Preset 選擇 `Other`，根目錄維持 repository root。
5. 不需 Build Command、Output Directory 或環境變數，直接部署即可。

`vercel.json` 已設定靜態網站所需的乾淨網址、資產快取與保守安全標頭。根目錄的 `index.html` 會作為網站首頁。

## 安全注意事項

- 不應將任何 token commit 到 repository。
- API key、部署憑證與其他秘密資料不得寫入 HTML、CSS、JavaScript、README 或 Vercel 設定。
- 曾貼給 AI 的 token 與 API key 應視為已暴露，正式上線前重新產生，並撤銷舊憑證。

## 素材來源

- `assets/hero.jpg`：由原始投影片素材提供的 hero artwork。
- 工具圖示：取自 Simple Icons 或各工具官方提供的標誌。
- 所有產品名稱與商標仍屬各自所有權人所有，本專案僅用於課程識別與教學說明。
