import React, { useState } from 'react';
import CameraView from './components/CameraView';
import QuizView from './components/QuizView';
import LoadingOverlay from './components/LoadingOverlay';
import { generateMandarinQuiz } from './services/geminiService';
import { AnalysisResult } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'camera' | 'analyzing' | 'result'>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = async (base64Image: string) => {
    setCapturedImage(`data:image/jpeg;base64,${base64Image}`);
    setAppState('analyzing');
    setError(null);

    try {
      const result = await generateMandarinQuiz(base64Image);
      setQuizData(result);
      setAppState('result');
    } catch (err) {
      console.error(err);
      setError("AI 分析失敗，請重試或更換照片。");
      setAppState('camera');
      alert("分析失敗，請檢查網路連線。");
    }
  };

  const handleReset = () => {
    setAppState('camera');
    setCapturedImage(null);
    setQuizData(null);
    setError(null);
  };

  return (
    <div className="font-sans text-gray-900 bg-gray-50 h-screen w-full overflow-hidden">
      {appState === 'camera' && (
        <CameraView onCapture={handleCapture} />
      )}

      {appState === 'analyzing' && (
        <LoadingOverlay />
      )}

      {appState === 'result' && quizData && capturedImage && (
        <div className="h-full overflow-y-auto">
             <QuizView 
                data={quizData} 
                imageSrc={capturedImage} 
                onReset={handleReset} 
            />
        </div>
       
      )}
    </div>
  );
};

export default App;