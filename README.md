# 📸 Mandarin Snap Learn

一個使用 AI 視覺辨識的互動式中文學習應用程式。拍攝物品照片，AI 會自動生成注音符號測驗！

## ✨ 功能特色

- 📷 **拍照辨識**：使用相機拍攝物品，AI 自動辨識並生成中文名稱
- 🎯 **互動測驗**：自動生成聲母、韻母和聲調測驗
- ✍️ **手寫辨識**：在畫布上手寫聲調符號，AI 自動驗證
- 🎨 **現代化 UI**：使用 React + TypeScript + Vite 構建

## 🚀 快速開始

### 前置需求

- Node.js 16+
- Gemini API Key（從 [ai.juguang.chat](https://ai.juguang.chat) 獲取）

### 安裝步驟

1. **克隆專案**
   ```bash
   git clone <your-repo-url>
   cd mandarin-snap-learn
   ```

2. **安裝依賴**
   ```bash
   npm install
   ```

3. **配置環境變數**
   
   複製 `.env.example` 為 `.env.local`：
   ```bash
   cp .env.example .env.local
   ```
   
   編輯 `.env.local` 並填入你的 API Key：
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   VITE_GEMINI_API_URL=https://ai.juguang.chat/v1beta/models/gemini-2.0-flash:generateContent
   ```

4. **啟動開發伺服器**
   ```bash
   npm run dev
   ```

5. **開啟瀏覽器**
   
   訪問 `http://localhost:5173`

## 📦 部署

### Vercel 部署

1. 推送代碼到 GitHub
2. 在 [Vercel](https://vercel.com) 導入專案
3. 在 Vercel 專案設置中添加環境變數：
   - `VITE_GEMINI_API_KEY`
   - `VITE_GEMINI_API_URL`
4. 部署完成！

### Netlify 部署

1. 推送代碼到 GitHub
2. 在 [Netlify](https://netlify.com) 導入專案
3. 構建設置：
   - Build command: `npm run build`
   - Publish directory: `dist`
4. 在環境變數中添加：
   - `VITE_GEMINI_API_KEY`
   - `VITE_GEMINI_API_URL`
5. 部署完成！

## 🛠️ 技術棧

- **前端框架**：React 19 + TypeScript
- **構建工具**：Vite 5
- **AI 模型**：Google Gemini 2.0 Flash
- **樣式**：Tailwind CSS (inline styles)

## 📝 使用說明

1. 點擊「拍照」按鈕或允許相機權限
2. 對準想要學習的物品拍照
3. AI 會辨識物品並顯示中文名稱、拼音和英文翻譯
4. 完成三個測驗：
   - 選擇正確的聲母
   - 選擇正確的韻母
   - 手寫正確的聲調符號
5. 查看結果並重新開始！

## 🔒 安全性

- ⚠️ **重要**：請勿將 `.env.local` 提交到 Git
- API Key 僅在客戶端使用
- 建議使用有限制的 API Key

## 📄 授權

MIT License

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

---

Made with ❤️ for Mandarin learners
