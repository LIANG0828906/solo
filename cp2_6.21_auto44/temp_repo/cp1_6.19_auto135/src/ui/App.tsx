import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Answer, Profile, MatchResult, PageType, PersonalityDimension } from '../engine/types';
import { questions, totalQuestions } from '../data/questions';
import { calculateProfile, getTopMatches, saveProfileToStorage, generateProfileHash, getSavedProfiles } from '../engine/calculator';
import { eventBus, EVENTS } from '../eventBus';
import QuestionCard from './QuestionCard';
import ResultDashboard from './ResultDashboard';
interface AppContextType {
 currentPage: PageType;
 currentQuestionIndex: number;
 answers: Answer[];
 userProfile: Profile | null;
 matches: MatchResult[];
 progress: number;
 savedProfiles: Profile[];
 handleAnswer: (optionId: string) => void;
 resetTest: () => void;
 goToTest: () => void;
 saveProfile: (nickname: string) => string | null;
}
const AppContext = createContext<AppContextType | null>(null);
export function useAppContext() {
 const context = useContext(AppContext);
 if (!context) {
 throw new Error('useAppContext must be used within AppProvider');
 }
 return context;
}
function AppProvider({ children }: {
 children: ReactNode;
}) {
 const [currentPage, setCurrentPage] = useState<PageType>('test');
 const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
 const [answers, setAnswers] = useState<Answer[]>([]);
 const [userProfile, setUserProfile] = useState<Profile | null>(null);
 const [matches, setMatches] = useState<MatchResult[]>([]);
 const [savedProfiles, setSavedProfiles] = useState<Profile[]>([]);
 const progress = (answers.length / totalQuestions) * 100;
 useEffect(() => {
 setSavedProfiles(getSavedProfiles());
 }, []);
 useEffect(() => {
 const unsubscribeComplete = eventBus.on(EVENTS.TEST_COMPLETE, (data) => {
 const profile = data as Profile;
 setUserProfile(profile);
 const topMatches = getTopMatches(profile, 3);
 setMatches(topMatches);
 setCurrentPage('result');
 });
 return () => {
 unsubscribeComplete();
 };
 }, []);
 const handleAnswer = useCallback((optionId: string) => {
 const currentQuestion = questions[currentQuestionIndex];
 const newAnswer: Answer = {
 questionId: currentQuestion.id,
 optionId,
 };
 const newAnswers = [...answers, newAnswer];
 setAnswers(newAnswers);
 eventBus.emit(EVENTS.TEST_ANSWER, {
 questionId: currentQuestion.id,
 optionId,
 });
 if (newAnswers.length >= totalQuestions) {
 const profile = calculateProfile(newAnswers);
 eventBus.emit(EVENTS.TEST_COMPLETE, profile);
 }
 else {
 setTimeout(() => {
 setCurrentQuestionIndex((prev) => prev + 1);
 }, 200);
 }
 }, [answers, currentQuestionIndex]);
 const resetTest = useCallback(() => {
 setCurrentQuestionIndex(0);
 setAnswers([]);
 setUserProfile(null);
 setMatches([]);
 eventBus.emit(EVENTS.TEST_RESET);
 }, []);
 const goToTest = useCallback(() => {
 resetTest();
 setCurrentPage('test');
 }, [resetTest]);
 const saveProfile = useCallback((nickname: string): string | null => {
 if (!userProfile)
 return null;
 const hash = generateProfileHash(userProfile);
 const profileWithMeta: Profile = {
 ...userProfile,
 id: hash,
 nickname,
 };
 saveProfileToStorage(profileWithMeta);
 setSavedProfiles(getSavedProfiles());
 eventBus.emit(EVENTS.PROFILE_SAVE, profileWithMeta);
 return hash;
 }, [userProfile]);
 const value: AppContextType = {
 currentPage,
 currentQuestionIndex,
 answers,
 userProfile,
 matches,
 progress,
 savedProfiles,
 handleAnswer,
 resetTest,
 goToTest,
 saveProfile,
 };
 return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
function ProgressBar() {
 const { progress } = useAppContext();
 return (<div style={{
 position: 'fixed',
 top: 0,
 left: 0,
 right: 0,
 height: 4,
 background: 'rgba(255, 255, 255, 0.1)',
 zIndex: 100,
 }}>
 <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3, ease: 'easeOut' }} style={{
 height: '100%',
 background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
 }}/>
 </div>);
}
function TestPage() {
 const { currentQuestionIndex, answers, handleAnswer } = useAppContext();
 const currentQuestion = questions[currentQuestionIndex];
 return (<div style={{
 minHeight: '100vh',
 display: 'flex',
 flexDirection: 'column',
 alignItems: 'center',
 justifyContent: 'center',
 padding: '60px 20px 40px',
 }}>
 <div style={{
 marginBottom: 32,
 textAlign: 'center',
 }}>
 <span style={{
 fontSize: 14,
 color: 'rgba(255, 255, 255, 0.6)',
 }}>
 第 {currentQuestionIndex + 1} / {totalQuestions} 题
 </span>
 </div>
 <AnimatePresence mode="wait">
 <QuestionCard key={currentQuestion.id} question={currentQuestion} onAnswer={handleAnswer} selected={answers.some((a) => a.questionId === currentQuestion.id)}/>
 </AnimatePresence>
 </div>);
}
function ResultPage() {
 return (<div style={{
 minHeight: '100vh',
 padding: '60px 20px 40px',
 }}>
 <ResultDashboard />
 </div>);
}
function MainContent() {
 const { currentPage } = useAppContext();
 return (<div style={{
 maxWidth: 920,
 margin: '0 auto',
 width: '100%',
 }}>
 <AnimatePresence mode="wait">
 <motion.div key={currentPage} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
 {currentPage === 'test' && <TestPage />}
 {currentPage === 'result' && <ResultPage />}
 </motion.div>
 </AnimatePresence>
 </div>);
}
export default function App() {
 return (<AppProvider>
 <ProgressBar />
 <MainContent />
 </AppProvider>);
}
export type { PersonalityDimension };

