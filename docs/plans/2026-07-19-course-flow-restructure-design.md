# 課程流程重整設計

**目標：** 將線上課程簡報收斂為 19 張全螢幕投影片，以「從 AI 生成到可被搜尋的網站」的實際工作流帶領學員，並清楚教導憑證輪替與 Git 驅動的自動部署。

## 設計原則

- 每張只傳遞一個行動或觀念，維持 Apple 風格的留白與大標題。
- 沿用藍色、橘色與淡灰基底；保留右側圓點與鍵盤／滑動操作，不使用左右按鈕。
- 將工具視為流程中的角色，而不是獨立功能清單。
- 安全規則以「貼給 AI 就視為已曝光」為核心，加入可操作的換 key 順序。

## 投影片架構

1. 用 AI 打造全端網站
2. 今天做出上線網站
3. 前置準備
4. 5 步完成網站
5. AI Studio：快速做出前端
6. 前端完成前，先檢查 3 件事
7. 從 AI Studio 存到 GitHub
8. 本地端專案資料夾
9. Claude Code 或 Codex 連動 repo
10. Vercel 部署前端
11. Supabase 串資料，持續修改到完成
12. 貼給 AI 的 key，視為已曝光
13. 新 key：手動更新 Vercel
14. 有自動化才更新 GitHub Secrets
15. 同步本地 `.env.local`，測試後再推送
16. 讓 Claude Code 協助維護
17. 推送即部署
18. 網站完成後的三件事
19. 完成一個可持續維護的網站

## 安全與部署流程

```text
向 AI 提供憑證 → 視為已曝光 → 重新產生新 key
  → Vercel Environment Variables
  → GitHub Actions Secrets（只有自動化流程使用時）
  → 本地 .env.local
  → 重新部署並測試
```

- Supabase anon key 僅在啟用 RLS 的前提下可放在前端。
- service-role key、私人 API key 與 Vercel token 不可放入前端、Git repository 或交給 AI。
- Claude Code / Codex 僅在本地處理編輯、測試、commit 與 push；GitHub 連動 Vercel 負責 Preview / Production 部署。

## 驗收條件

- 頁面共 19 張，標題與課程流程順序一致。
- 安全段落清楚說明 Vercel、GitHub Secrets、本機 `.env.local` 的更新順序。
- 清楚區分 Preview 與 Production：任何 branch push 有 Preview；push 至 `main` 後為 Production。
- 不出現已排除的品牌字樣，亦不含實際憑證。
