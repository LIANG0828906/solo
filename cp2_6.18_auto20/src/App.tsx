import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import BookList from "@/pages/BookList";
import BookDetail from "@/pages/BookDetail";
import { useStore } from "@/store";

export default function App() {
  const hydrate = useStore((state) => state.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<BookList />} />
        <Route path="/book/:id" element={<BookDetail />} />
      </Routes>
    </Router>
  );
}
