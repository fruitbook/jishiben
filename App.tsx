
import React, { useState, useEffect, useCallback } from 'react';
import { Note, ContextMenuState } from './types';
import { ROW_COLORS, INITIAL_NOTES_COUNT, STORAGE_KEY } from './constants';
import NoteItem from './components/NoteItem';

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [bgOpacity, setBgOpacity] = useState(0.2);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [history, setHistory] = useState<{ note: Note, index: number }[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedOpacity = localStorage.getItem('glassy_opacity');
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        initializeNotes();
      }
    } else {
      initializeNotes();
    }
    if (savedOpacity) setBgOpacity(parseFloat(savedOpacity));
  }, []);

  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('glassy_opacity', bgOpacity.toString());
  }, [bgOpacity]);

  // 监听 Ctrl+Z 撤销
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        undoDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, notes]);

  const undoDelete = useCallback(() => {
    if (history.length === 0) return;
    const lastDeleted = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    
    const newNotes = [...notes];
    newNotes.splice(lastDeleted.index, 0, lastDeleted.note);
    
    setNotes(newNotes);
    setHistory(newHistory);
  }, [history, notes]);

  const initializeNotes = () => {
    const initial: Note[] = Array.from({ length: INITIAL_NOTES_COUNT }, (_, i) => ({
      id: crypto.randomUUID(),
      text: '',
      color: ROW_COLORS[i % ROW_COLORS.length]
    }));
    setNotes(initial);
  };

  const handleUpdateNote = (id: string, text: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, text } : n));
  };

  const handleDeleteNote = (id: string) => {
    const index = notes.findIndex(n => n.id === id);
    if (index !== -1) {
      const noteToDelete = notes[index];
      setHistory(prev => [...prev, { note: noteToDelete, index }]);
      setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleAddNewNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      text: '',
      color: ROW_COLORS[notes.length % ROW_COLORS.length]
    };
    setNotes(prev => [...prev, newNote]);
  };

  const onDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (!draggingId || draggingId === id) return;
    const dragIndex = notes.findIndex(n => n.id === draggingId);
    const hoverIndex = notes.findIndex(n => n.id === id);
    const newNotes = [...notes];
    const draggedItem = newNotes.splice(dragIndex, 1)[0];
    newNotes.splice(hoverIndex, 0, draggedItem);
    setNotes(newNotes);
  };

  return (
    <div 
      className={`
        main-container glass-effect rounded-2xl shadow-2xl transition-shadow relative
        ${isLocked ? 'pointer-events-none' : 'pointer-events-auto'}
      `}
      style={{ 
        width: '400px', 
        height: '600px',
        backgroundColor: `rgba(15, 23, 42, ${bgOpacity})`,
        borderColor: `rgba(255, 255, 255, ${isLocked ? 0.05 : 0.15})`
      }}
    >
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between px-5 py-4 bg-white/5 border-b border-white/10 select-none">
        <h1 className={`text-white font-bold text-sm tracking-wider ${isLocked ? 'opacity-30' : 'opacity-80'}`}>
          果冻记事本
        </h1>
        
        <div className="flex items-center gap-4" style={{ pointerEvents: 'auto' }}>
          {!isLocked && (
            <div className="flex items-center gap-2 group">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="opacity-40">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 2v20"></path>
              </svg>
              <input 
                type="range" min="0" max="0.9" step="0.05" 
                value={bgOpacity} 
                onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
                className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>
          )}

          {!isLocked && (
            <button onClick={handleAddNewNote} className="text-white/40 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          )}
          
          <button onClick={() => setIsLocked(!isLocked)} className="transition-all transform active:scale-90">
            {isLocked ? (
              <svg className="text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            ) : (
              <svg className="text-white/40 hover:text-white" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 记录列表 */}
      <div className={`flex-grow overflow-y-auto no-scrollbar py-2 relative ${isLocked ? 'opacity-40' : 'opacity-100'}`}>
        {notes.map((note) => (
          <NoteItem
            key={note.id}
            note={note}
            isLocked={isLocked}
            onUpdate={handleUpdateNote}
            onDelete={() => handleDeleteNote(note.id)}
            onDragStart={(e, id) => { if(!isLocked) setDraggingId(id); }}
            onDragOver={onDragOver}
            onDragEnd={() => setDraggingId(null)}
            isDragging={draggingId === note.id}
          />
        ))}
      </div>

      {!isLocked && <div className="resizer-handle" />}

      <div className="px-4 py-2 bg-black/10 text-[10px] text-white/30 text-right select-none">
        {isLocked ? "已锁定 - 鼠标穿透模式" : "向右拖拽删除 • Ctrl+Z 撤销 • 垂直拖动排序"}
      </div>
    </div>
  );
};

export default App;
