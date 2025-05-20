// frontend/src/App.jsx

import React, { useState, useEffect, useRef } from "react";
import { BookOpen, Brain, Edit2, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

// Render into <body> so tooltip doesn't reflow the verse container
function TooltipPortal({ children }) {
  return createPortal(children, document.body);
}

const POPUP_VARIANTS = {
  hidden: { opacity: 0, scale: 0.9, y: -6 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: "spring", stiffness: 320, damping: 24 }
  },
  exit: { opacity: 0, scale: 0.9, y: -6, transition: { duration: 0.15 } }
};

const STRONGS = {
  In:        { original: "בְּרֵאשִׁית‎", number: "H7225", definition: "beginning" },
  the:       { original: "הַ",       number: "H3588", definition: "definite article" },
  beginning: { original: "רֵאשִׁית‎", number: "H7225", definition: "beginning" },
  God:       { original: "אֱלֹהִים‎", number: "H430",  definition: "God, gods" }
};
const tokenCache = Object.create(null);

export default function JWLibraryApp() {
  const [book]    = useState({ name: "Genesis" });
  const [chapter, setChapter] = useState(null);
  const [verses,  setVerses]  = useState([]);

  const [selectedVerse, setSelectedVerse] = useState(null);
  const [activeOption, setActiveOption]   = useState("");

  const [notes, setNotes]       = useState({});
  const [noteInput, setNoteInput]   = useState("");
  const [editingIndex, setEditingIndex] = useState(null);

  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer,   setAiAnswer]   = useState("");
  const [aiLoading,  setAiLoading]  = useState(false);

  const [hoveredWord, setHoveredWord] = useState(null);
  const [wordPos,      setWordPos]     = useState({ x: 0, y: 0 });

  const popupRef     = useRef(null);
  const secondaryRef = useRef(null);

  /* -- fetch real verses -- */
  useEffect(() => {
    if (!chapter) return;
    fetch(`/api/genesis`)
      .then(r => r.json())
      .then(data => {
        const versesObj = data[chapter] || {};
        const arr = Object.keys(versesObj)
          .sort((a, b) => +a - +b)
          .map(v => versesObj[v]);
        setVerses(arr.length ? arr : ["(no data)"]);
      })
      .catch(() => setVerses(["Error loading verses"]));
  }, [chapter]);

  /* -- click‑away to reset popups -- */
  useEffect(() => {
    const clickAway = e => {
      if (
        popupRef.current && !popupRef.current.contains(e.target) &&
        secondaryRef.current && !secondaryRef.current.contains(e.target)
      ) resetPopups();
    };
    document.addEventListener("mousedown", clickAway);
    return () => document.removeEventListener("mousedown", clickAway);
  }, []);

  const resetPopups = () => {
    setSelectedVerse(null);
    setActiveOption("");
    setEditingIndex(null);
    setNoteInput("");
    setAiQuestion("");
    setAiAnswer("");
    setAiLoading(false);
  };

  const handleAIResearch = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiAnswer("");
    try {
      const resp = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question:  aiQuestion,
          reference: `${book.name} ${chapter}:${selectedVerse}`
        })
      });
      const data = await resp.json();
      setAiAnswer(data.answer || "(no answer)");
    } catch {
      setAiAnswer("Error contacting AI service");
    } finally {
      setAiLoading(false);
    }
  };

  const renderTokens = text => {
    if (!tokenCache[text]) {
      tokenCache[text] = text.match(/(\b[\w']+\b)|(\s+)|(\S)/g) || [];
    }
    return tokenCache[text].map((tok, i) => {
      const key = tok.replace(/[.,]/g, "");
      const strong = STRONGS[key];
      if (!strong) return <React.Fragment key={i}>{tok}</React.Fragment>;
      return (
        <span
          key={i}
          onMouseEnter={e => {
            const r = e.currentTarget.getBoundingClientRect();
            setWordPos({ x: r.left + window.scrollX, y: r.bottom + window.scrollY });
            setHoveredWord(key);
          }}
          onMouseLeave={() => setHoveredWord(null)}
          className="cursor-pointer text-indigo-700 hover:text-indigo-900"
        >{tok}</span>
      );
    });
  };

  const handleSaveNote = () => {
    if (!selectedVerse) return;
    setNotes(prev => {
      const arr = prev[selectedVerse] ? [...prev[selectedVerse]] : [];
      editingIndex != null ? (arr[editingIndex] = noteInput) : arr.push(noteInput);
      return { ...prev, [selectedVerse]: arr };
    });
    setNoteInput("");
    setEditingIndex(null);
  };
  const handleDeleteNote = idx => {
    setNotes(prev => {
      const arr = [...(prev[selectedVerse] || [])];
      arr.splice(idx, 1);
      return { ...prev, [selectedVerse]: arr };
    });
    setEditingIndex(null);
  };

  return (
    <div className="flex h-screen bg-gray-50 text-sm">
      {/* Sidebar */}
      <aside className="w-64 p-4 border-r bg-white overflow-y-auto space-y-4">
        <h2 className="text-lg font-bold">JW Library</h2>

        {/* Genesis header / "Back to chapters" */}
        <button
          className={`flex items-center w-full p-2 rounded ${
            chapter == null ? "bg-indigo-100" : "hover:bg-gray-100"
          }`}
          onClick={() => { setChapter(null); resetPopups(); }}
        >
          <BookOpen size={16} className="mr-2"/>
          {chapter == null ? "Genesis" : "← Back to chapters"}
        </button>

        {/* chapter grid only when chapter===null */}
        {chapter == null && (
          <div className="grid grid-cols-6 gap-1 mt-2">
            {Array.from({ length: 50 }, (_, i) => i+1).map(ch => (
              <button
                key={ch}
                className={`h-6 text-xs rounded ${
                  chapter===ch ? "bg-indigo-600 text-white" : "hover:bg-gray-200"
                }`}
                onClick={() => { setChapter(ch); resetPopups(); }}
              >
                {ch}
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* Reader */}
      <main className="flex-1 p-6 overflow-auto relative">
        {!chapter && <p>Select a chapter.</p>}
        {chapter != null && verses.map((txt, idx) => {
          const vnum = idx + 1;
          const noteCount = (notes[vnum] || []).length;
          return (
            <div key={vnum} className="relative mb-4">
              <div className="flex items-start">
                <span
                  className="relative mr-2 font-semibold text-indigo-600 cursor-pointer select-none"
                  onClick={() => { setSelectedVerse(p => p===vnum?null:vnum); setActiveOption(""); setEditingIndex(null); }}
                >
                  {vnum}
                  {noteCount > 0 && (
                    <span className="absolute -top-1 -left-1 h-2 w-2 bg-emerald-500 rounded-full"/>
                  )}
                </span>
                <div className="flex-1 leading-relaxed">
                  {chapter===1 && vnum===1 ? renderTokens(txt) : txt}
                </div>
              </div>
              {/* …Put your existing popups (AI Research / Notes) AnimatePresence code here… */}
            </div>
          );
        })}

        {/* Strong’s tooltip via portal */}
        <TooltipPortal>
          <AnimatePresence>
            {hoveredWord && (
              <motion.div
                variants={POPUP_VARIANTS}
                initial="hidden" animate="visible" exit="exit"
                className="fixed bg-white border rounded shadow-lg p-3 text-xs z-50"
                style={{ left: wordPos.x, top: wordPos.y + 8 }}
              >
                <div className="font-bold mb-1 text-sm">
                  {STRONGS[hoveredWord].original}
                </div>
                <div className="mb-1">
                  Strong's #{STRONGS[hoveredWord].number}
                </div>
                <div>{STRONGS[hoveredWord].definition}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </TooltipPortal>
      </main>
    </div>
  );
}

