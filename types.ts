
export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: number;
  type: 'initial' | 'final' | 'tone';
  questionText: string;
  options?: QuizOption[]; // Optional for tone/drawing questions
  correctOptionId: string; // For tone, this will be the symbol itself
  explanation: string;
}

export interface AnalysisResult {
  detectedObject: string; // The Chinese name of the object
  pinyin: string;
  englishMeaning: string;
  questions: QuizQuestion[];
}
