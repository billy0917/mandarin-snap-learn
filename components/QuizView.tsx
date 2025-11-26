import React, { useState, useRef, useEffect } from 'react';
import { AnalysisResult, QuizQuestion } from '../types';
import { validateToneDrawing } from '../services/geminiService';

interface QuizViewProps {
  data: AnalysisResult;
  imageSrc: string;
  onReset: () => void;
}

const QuizView: React.FC<QuizViewProps> = ({ data, imageSrc, onReset }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [validationState, setValidationState] = useState<Record<number, 'idle' | 'checking' | 'correct' | 'incorrect'>>({});
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);

  // Initialize Voices
  useEffect(() => {
    const synth = window.speechSynthesis;
    
    const updateVoices = () => {
        const voices = synth.getVoices();
        if (voices.length > 0) {
            setAvailableVoices(voices);
            // Debug: Log all Chinese voices
            console.log('📱 所有可用的中文語音:');
            voices.filter(v => v.lang.toLowerCase().includes('zh')).forEach(v => {
                console.log(`  - ${v.name} (${v.lang}) ${v.default ? '[系統默認]' : ''}`);
            });
        }
    };

    // iOS Safari 需要延遲加載語音列表
    updateVoices();
    
    // 延遲再次嘗試（iOS 修復）
    setTimeout(updateVoices, 100);
    setTimeout(updateVoices, 500);
    
    // Chrome/Android loads voices asynchronously
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = updateVoices;
    }
    
    // Cleanup timer on unmount
    return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        synth.cancel(); // Stop speaking when component unmounts
    };
  }, []);

  // Text to Speech Helper with STRICT Mandarin Priority
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
        console.warn("Browser does not support text-to-speech");
        return;
    }

    const synth = window.speechSynthesis;
    synth.cancel(); // Cancel any current speaking

    const utterance = new SpeechSynthesisUtterance(text);
    
    console.log('📱 所有中文語音選項：');
    availableVoices.filter(v => v.lang.toLowerCase().includes('zh')).forEach(v => {
        console.log(`  ${v.name} (${v.lang}) ${v.default ? '[默認]' : ''} URI: ${v.voiceURI}`);
    });
    
    let targetVoice: SpeechSynthesisVoice | undefined;

    // Priority 0: 用戶手動選擇的語音（最高優先級）
    if (selectedVoiceURI) {
        targetVoice = availableVoices.find(v => v.voiceURI === selectedVoiceURI);
        if (targetVoice) {
            console.log('👤 使用用戶選擇的語音:', targetVoice.name);
        }
    }

    // 如果沒有用戶選擇，則使用自動選擇
    if (!targetVoice) {
        // STRICT Filter: 排除所有粵語相關的語音
        const mandarinVoices = availableVoices.filter(v => {
            const lang = v.lang.toLowerCase();
            const name = v.name.toLowerCase();
            
            // 排除條件：包含粵語相關關鍵詞
            const isCantonese = 
                lang.includes('hk') || 
                lang.includes('yue') || 
                lang.includes('cantonese') ||
                name.includes('hong kong') ||
                name.includes('cantonese') ||
                name.includes('sin-ji') ||  // iOS 台灣語音，聽起來像粵語
                name.includes('sinji');
                
            return !isCantonese && lang.includes('zh');
        });

        console.log('✅ 過濾後的普通話語音：');
        mandarinVoices.forEach(v => {
            console.log(`  ${v.name} (${v.lang})`);
        });

        // iOS Safari/Chrome: 強制使用 Ting-Ting (zh-CN)
        targetVoice = mandarinVoices.find(v => 
            (v.name.toLowerCase().includes('ting-ting') || 
             v.name.toLowerCase().includes('tingting')) &&
            (v.lang === 'zh-CN' || v.lang === 'zh_CN' || v.lang.startsWith('zh-CN'))
        );

        // Priority 1: 任何 zh-CN 語音（中國普通話）
        if (!targetVoice) {
            targetVoice = mandarinVoices.find(v => 
                v.lang === 'zh-CN' || 
                v.lang === 'zh_CN' || 
                v.lang.startsWith('zh-CN')
            );
        }
        
        // Priority 2: Google/Android 普通話
        if (!targetVoice) {
            targetVoice = mandarinVoices.find(v => 
                v.name.toLowerCase().includes('mandarin') ||
                v.name.toLowerCase().includes('putonghua') ||
                (v.name.toLowerCase().includes('chinese') && v.lang.includes('CN'))
            );
        }

        // Priority 3: 台灣國語 zh-TW（但已排除 Sin-Ji）
        if (!targetVoice) {
            targetVoice = mandarinVoices.find(v => 
                v.lang === 'zh-TW' || 
                v.lang === 'zh_TW' || 
                v.lang.startsWith('zh-TW')
            );
        }

        // Priority 4: 任何剩餘的中文語音（已過濾粵語）
        if (!targetVoice && mandarinVoices.length > 0) {
            targetVoice = mandarinVoices[0];
        }
    }

    // 設置語音和語言
    if (targetVoice) {
        utterance.voice = targetVoice;
        utterance.lang = targetVoice.lang;
        console.log('🔊 最終選擇語音:', targetVoice.name, '|', targetVoice.lang);
    } else {
        // 強制使用 zh-CN 語言代碼
        utterance.lang = 'zh-CN';
        console.warn('⚠️ 未找到合適語音，強制使用 zh-CN');
    }

    utterance.rate = 0.8; // Slower for clarity
    utterance.volume = 1.0; 

    synth.speak(utterance);
  };

  const handleSelect = (questionId: number, optionId: string, correctOptionId: string) => {
    if (selectedAnswers[questionId]) return;
    
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));
    setShowExplanation(prev => ({ ...prev, [questionId]: true }));
    setValidationState(prev => ({ 
        ...prev, 
        [questionId]: optionId === correctOptionId ? 'correct' : 'incorrect' 
    }));
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        
        // Reset state for the tone question
        const toneQ = data.questions.find(q => q.type === 'tone');
        if (toneQ) {
            setValidationState(prev => ({ ...prev, [toneQ.id]: 'idle' }));
        }
    }
  };

  const checkDrawing = async (question: QuizQuestion) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (validationState[question.id] === 'checking' || validationState[question.id] === 'correct') return;

    setValidationState(prev => ({ ...prev, [question.id]: 'checking' }));

    const base64 = canvas.toDataURL('image/png').split(',')[1];
    
    // AI Validation
    const isCorrect = await validateToneDrawing(base64, question.correctOptionId);

    if (isCorrect) {
      setValidationState(prev => ({ ...prev, [question.id]: 'correct' }));
      setShowExplanation(prev => ({ ...prev, [question.id]: true }));
      setSelectedAnswers(prev => ({ ...prev, [question.id]: question.correctOptionId }));
      
      // Auto-play audio on success
      speakText(data.detectedObject);

    } else {
      setValidationState(prev => ({ ...prev, [question.id]: 'incorrect' }));
      // Auto-reset after 1.5s
      setTimeout(() => {
         // Only reset if we haven't unmounted or changed state
         setValidationState(prev => {
             if (prev[question.id] === 'incorrect') {
                clearCanvas();
                return { ...prev, [question.id]: 'idle' };
             }
             return prev;
         });
      }, 1500);
    }
  };

  // Canvas Drawing Logic
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const toneQ = data.questions.find(q => q.type === 'tone');
    if (toneQ) {
        const state = validationState[toneQ.id];
        if (state === 'checking' || state === 'correct') return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = ('touches' in e) ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = ('touches' in e) ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = '#10b981'; // emerald-500
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = ('touches' in e) ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = ('touches' in e) ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);

    // AUTO DETECT LOGIC
    const toneQ = data.questions.find(q => q.type === 'tone');
    if (toneQ) {
        if (validationState[toneQ.id] !== 'correct') {
            timerRef.current = setTimeout(() => {
                checkDrawing(toneQ);
            }, 1200);
        }
    }
  };

  // ------------------------------------
  // RENDER: Main Quiz View
  // ------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="relative h-64 w-full bg-gray-900">
        <img src={imageSrc} alt="Captured" className="w-full h-full object-contain mx-auto" />
        <button 
          onClick={onReset}
          className="absolute top-4 left-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 backdrop-blur-md transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
      </div>

      <div className="px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 text-center border-b-4 border-emerald-500">
          <h1 className="text-5xl font-bold text-gray-800 mb-2">{data.detectedObject}</h1>
          <p className="text-2xl text-emerald-600 font-medium mb-1 font-serif">{data.pinyin}</p>
          <p className="text-gray-500 uppercase tracking-wider text-sm font-semibold mb-3">{data.englishMeaning}</p>
          
          <div className="flex items-center justify-center gap-3">
            <button 
              onClick={() => speakText(data.detectedObject)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 rounded-full text-base font-bold hover:bg-emerald-100 transition-colors border-2 border-emerald-200 active:scale-95 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
              </svg>
              朗讀詞語
            </button>

            {/* 語音選擇按鈕 */}
            <button
              onClick={() => setShowVoiceSelector(!showVoiceSelector)}
              className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors border-2 border-gray-300 active:scale-95"
              title="選擇語音"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>

          {/* 語音選擇器下拉面板 */}
          {showVoiceSelector && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200 text-left">
              <h3 className="text-sm font-bold text-gray-700 mb-2">選擇語音（如果自動選擇錯誤）:</h3>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {availableVoices
                  .filter(v => v.lang.toLowerCase().includes('zh'))
                  .map(voice => (
                    <label 
                      key={voice.voiceURI}
                      className="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name="voice"
                        value={voice.voiceURI}
                        checked={selectedVoiceURI === voice.voiceURI}
                        onChange={(e) => setSelectedVoiceURI(e.target.value)}
                        className="w-4 h-4 text-emerald-600"
                      />
                      <span className="text-sm text-gray-800">
                        {voice.name} 
                        <span className="text-gray-500 ml-1">({voice.lang})</span>
                        {voice.lang.includes('CN') && <span className="ml-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">推薦</span>}
                      </span>
                    </label>
                  ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">提示: 選擇包含 "zh-CN" 或 "Ting-Ting" 的語音獲得標準普通話發音</p>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {data.questions.map((q: QuizQuestion) => {
            const isToneQuestion = q.type === 'tone';
            const state = validationState[q.id] || 'idle';
            const isCorrect = state === 'correct';

            return (
              <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 overflow-hidden">
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded-full">
                        {q.type === 'initial' ? '聲母 (Initial)' : q.type === 'final' ? '韻母 (Final)' : '聲調 (Tone)'}
                    </span>
                  </div>
                  <h3 className="text-gray-800 font-bold text-xl">{q.questionText}</h3>
                </div>

                {isToneQuestion ? (
                    <div className="mb-4">
                        <div className={`bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-1 relative touch-none select-none ${state === 'checking' ? 'pointer-events-none opacity-80' : ''}`}>
                            <canvas 
                                ref={canvasRef}
                                width={320}
                                height={200}
                                className="w-full h-48 bg-white rounded-lg cursor-crosshair"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                            />
                            
                            {/* Overlay States */}
                            {state === 'checking' && (
                                <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center rounded-lg animate-fade-in">
                                    <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-2"></div>
                                    <span className="text-emerald-600 font-bold text-sm">AI 正在檢測...</span>
                                </div>
                            )}
                            
                            {state === 'incorrect' && (
                                <div className="absolute inset-0 bg-red-50/90 flex flex-col items-center justify-center rounded-lg text-red-600 animate-pulse">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12 mb-2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    <span className="font-bold">形狀不對，請重畫！</span>
                                </div>
                            )}

                             <button 
                                onClick={clearCanvas} 
                                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 p-2 bg-white rounded-full shadow-sm"
                                title="清除"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                        {state === 'idle' && (
                            <p className="text-center text-gray-400 text-sm mt-2">請在上方畫出聲調，畫完自動檢測</p>
                        )}
                    </div>
                ) : (
                    // Multiple Choice for Q1 & Q2
                    <div className="grid grid-cols-1 gap-3">
                      {q.options?.map((opt) => {
                         const isSelected = selectedAnswers[q.id] === opt.id;
                         const isAnswerCorrect = opt.id === q.correctOptionId;
                         let btnClass = "w-full text-left p-4 rounded-xl border-2 text-lg transition-all font-bold ";

                         if (state !== 'idle') {
                            if (isAnswerCorrect) {
                                btnClass += "border-emerald-500 bg-emerald-500 text-white";
                            } else if (isSelected) {
                                btnClass += "border-red-500 bg-red-100 text-red-700";
                            } else {
                                btnClass += "border-gray-100 text-gray-300";
                            }
                         } else {
                            btnClass += "border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50 text-gray-700 active:scale-95 shadow-sm";
                         }

                        return (
                          <button
                            key={opt.id}
                            onClick={() => handleSelect(q.id, opt.id, q.correctOptionId)}
                            disabled={state !== 'idle'}
                            className={btnClass}
                          >
                            {opt.text}
                          </button>
                        );
                      })}
                    </div>
                )}

                {showExplanation[q.id] && (
                  <div className={`mt-4 p-4 rounded-xl text-sm border-l-4 animate-fade-in ${isCorrect ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-red-50 border-red-500 text-red-800'}`}>
                    <div className="flex items-center gap-2 mb-1">
                         <span className="font-bold text-lg">{isCorrect ? '正確！' : '錯誤'}</span>
                    </div>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button 
          onClick={onReset}
          className="w-full mt-10 mb-8 bg-gray-900 text-white py-5 rounded-2xl font-bold shadow-xl hover:bg-gray-800 transition-transform active:scale-95 flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
          拍下一張
        </button>
      </div>
    </div>
  );
};

export default QuizView;