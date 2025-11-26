
import React, { useState } from 'react';

interface ApiKeyModalProps {
  onSave: (key: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave }) => {
  const [inputKey, setInputKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim().length > 0) {
      onSave(inputKey.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">需要 API Key</h2>
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">
          本應用程式需要 Google Gemini API 才能運作。請輸入您的 API Key。
          <br />
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-emerald-600 font-bold hover:underline"
          >
            👉 點擊這裡免費獲取 Key
          </a>
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="貼上 API Key (AIzaSy...)"
            className="w-full border-2 border-gray-200 rounded-xl p-3 mb-4 focus:border-emerald-500 focus:outline-none transition-colors"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            disabled={!inputKey}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            開始使用
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-4 text-center">
          您的 Key 僅會儲存在瀏覽器中，不會傳送至伺服器。
        </p>
      </div>
    </div>
  );
};

export default ApiKeyModal;
