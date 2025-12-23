
import React, { useState, useRef, useEffect } from 'react';
import { Note } from '../types';

interface NoteItemProps {
  note: Note;
  isLocked: boolean;
  onUpdate: (id: string, text: string) => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

const NoteItem: React.FC<NoteItemProps> = ({
  note,
  isLocked,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempText, setTempText] = useState(note.text);
  const [dragOffset, setDragOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    onUpdate(note.id, tempText);
  };

  // 处理拖拽删除逻辑
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isLocked || isEditing) return;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    setIsSwiping(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isSwiping) return;
    
    const deltaX = e.clientX - startXRef.current;
    const deltaY = Math.abs(e.clientY - startYRef.current);

    // 如果垂直位移过大，通常是想进行列表排序，取消水平滑动
    if (deltaY > 20 && Math.abs(deltaX) < 10) {
      setIsSwiping(false);
      setDragOffset(0);
      return;
    }

    if (deltaX > 0) {
      setDragOffset(deltaX);
    } else {
      setDragOffset(0);
    }
  };

  const handleMouseUp = () => {
    if (!isSwiping) return;
    
    const containerWidth = containerRef.current?.offsetWidth || 0;
    if (dragOffset > containerWidth / 2) {
      onDelete();
    }
    
    setDragOffset(0);
    setIsSwiping(false);
  };

  useEffect(() => {
    if (isSwiping) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isSwiping, dragOffset]);

  return (
    <div className="relative overflow-hidden">
      {/* 背景提示层（显示删除图标或提示色） */}
      <div 
        className="absolute inset-0 bg-red-500/20 flex items-center pl-4 transition-opacity"
        style={{ opacity: dragOffset > 50 ? 1 : 0 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
        </svg>
      </div>

      <div
        ref={containerRef}
        draggable={!isLocked && !isEditing && !isSwiping}
        onDragStart={(e) => onDragStart(e, note.id)}
        onDragOver={(e) => onDragOver(e, note.id)}
        onDragEnd={onDragEnd}
        onMouseDown={handleMouseDown}
        style={{ 
          transform: `translateX(${dragOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)'
        }}
        className={`
          note-row group flex items-center px-5 py-4 transition-all duration-200 relative z-10
          ${isDragging ? 'opacity-20 scale-95' : 'opacity-100'}
          ${isLocked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing hover:bg-white/10'}
          bg-transparent
        `}
      >
        <div className="flex-shrink-0 mr-4 pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,1)]" />
        </div>
        
        <div className="flex-grow min-w-0" onDoubleClick={() => !isLocked && setIsEditing(true)}>
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={tempText}
              onChange={(e) => setTempText(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.blur()}
              className="w-full bg-transparent border-none outline-none p-0 m-0 font-bold text-base"
              style={{ color: note.color, textShadow: '0 0 1px rgba(0,0,0,0.5)' }}
            />
          ) : (
            <div 
              className={`truncate select-none font-bold text-base h-6 leading-6 transition-colors`}
              style={{ color: note.color, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
            >
              {note.text || (isLocked ? "" : "...")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteItem;
