
export interface Note {
  id: string;
  text: string;
  color: string;
}

export interface ContextMenuState {
  x: number;
  y: number;
  noteId: string | null;
}
