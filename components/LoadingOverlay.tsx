import React from 'react';

const LoadingOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white">
      <div className="relative w-20 h-20 mb-4">
        <div className="absolute inset-0 border-4 border-emerald-500/30 rounded-full animate-pulse"></div>
        <div className="absolute inset-0 border-4 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
      <h3 className="text-xl font-bold tracking-widest text-emerald-400">AI 分析中...</h3>
      <p className="text-sm text-gray-400 mt-2">正在識別物品並生成題目</p>
    </div>
  );
};

export default LoadingOverlay;
