# Sonics Scouting Report

北市美國 2026 安坑盃五年級男生賽前指南。以手機閱讀為主的 React 網頁，包含 11/22 10:10 對北市天母的備戰重點、預賽數據比較、球員辨識、教練與家長版本、比賽路線與本機勾選清單。

## 本機執行

使用 Node.js 22.12 以上版本。

```sh
npm ci
npm run dev
```

終端機會顯示本機預覽網址。

```sh
npm run build
npm run preview
```

正式建置輸出在 `dist/`。

## 發布到 GitHub Pages

1. 開啟 repository 的 **Settings → Pages**。
2. 將 **Build and deployment → Source** 設為 **GitHub Actions**。
3. 將專案推送到 `main`，或從 Actions 手動執行 **Publish scouting report**。
4. 部署完成後，使用 GitHub Pages 顯示的網址分享。

本專案已提供 `.github/workflows/pages.yml`。Vite 使用相對資源路徑，支援 `https://pcmac77.github.io/sonics-scouting-report/` 這類 repository 網址，也支援根目錄部署。

部署方式參考 [Vite 官方 GitHub Pages 文件](https://vite.dev/guide/static-deploy.html#github-pages)。不需要 API key 或後端服務。

## 更新比賽資料

- `src/data.js`：日期、主要對手、球員數據、清單與來源連結。
- `src/main.jsx`：對戰路線、比較數據、比賽計畫與說明文字。更新場次時也要同步檢查這裡。
- `src/styles.css`：電腦、手機與列印版樣式。

頁面為 **2026 年 11 月 21 日晚間的資料快照**，不會自動更新比分。大會賽程圖與 U19 的淘汰賽編號有差異，對戰連線以 [大會 PDF 第三頁](https://gameday.tw/wp-content/uploads/akcup2026-bracket3.pdf) 為準。晚場比分仍需確認終場，頁面已有標註。

球員數據取自 U19 兩場預賽紀錄。比較未校正對手強度，不是勝率預測。資料來源都列在網頁下方。

## 分享與列印

「分享指南」使用瀏覽器原生分享或複製連結。「列印／儲存 PDF」開啟瀏覽器列印功能。出發清單只記在使用者裝置的 localStorage，不會傳送至伺服器。

字型使用 Google Fonts，無法載入時會使用裝置的繁體中文字型與 sans-serif。網頁沒有分析追蹤碼、登入或外部資料庫。
