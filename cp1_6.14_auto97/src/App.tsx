import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import CourseManage from "@/pages/CourseManage";
import QuestionBank from "@/pages/QuestionBank";
import PaperGenerate from "@/pages/PaperGenerate";
import StudentPaper from "@/pages/StudentPaper";
import Grading from "@/pages/Grading";
import Analysis from "@/pages/Analysis";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<CourseManage />} />
        <Route path="/question-bank" element={<QuestionBank />} />
        <Route path="/paper-generate" element={<PaperGenerate />} />
        <Route path="/paper/:paperId" element={<StudentPaper />} />
        <Route path="/grading" element={<Grading />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
      </Routes>
    </Router>
  );
}
