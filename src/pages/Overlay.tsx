import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useStore } from '../store/useStore';
import { api, type SubtitlesResponse } from '../services/api';

export default function Overlay() {
  const { fontSize, overlayOpacity, subtitleAlign } = useStore();
  const [subtitles, setSubtitles] = useState<SubtitlesResponse>({ original: '', translated: '' });

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await api.getSubtitles();
      if (res.original || res.translated) {
        setSubtitles(res);
      }
    }, 500);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'streamtranslate-storage') {
        useStore.persist.rehydrate();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleResize = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const appWindow = getCurrentWindow();
      await appWindow.startResizeDragging('BottomRight' as any);
    } catch (err) {
      console.error("Resize failed:", err);
    }
  };

  return (
    <div 
      className="draggable w-screen h-screen flex flex-col items-center justify-end p-4 sm:p-8 select-none overflow-hidden"
    >
      <div 
        className={`flex flex-col gap-1 sm:gap-2 w-full transition-all duration-300 ${subtitleAlign === 'left' ? 'items-start text-left' : 'items-center text-center'}`}
        style={{ 
          fontSize: `${fontSize}px`,
          textShadow: '0px 2px 6px rgba(0,0,0,1)'
        }}
      >
        {/* Original Text */}
        {subtitles.original && (
          <span 
            className="inline-block px-3 py-1 sm:py-1.5 rounded-md font-medium text-gray-300 transition-all duration-200 max-w-[90vw] break-words whitespace-pre-wrap"
            style={{ 
              backgroundColor: `rgba(0, 0, 0, ${overlayOpacity / 100})`, 
              fontSize: '0.75em' 
            }}
          >
            {subtitles.original}
          </span>
        )}
        
        {/* Translated Text */}
        <span 
          className="inline-block px-4 py-1.5 sm:py-2 rounded-lg font-bold text-white transition-all duration-200 max-w-[95vw] break-words whitespace-pre-wrap"
          style={{ 
            backgroundColor: `rgba(0, 0, 0, ${overlayOpacity / 100})` 
          }}
        >
          {subtitles.translated || "Waiting for audio..."}
        </span>
      </div>

      {/* Resize Handle (hidden unless hovered) */}
      <div 
        onMouseDown={handleResize}
        className="absolute bottom-0 right-0 w-8 h-8 cursor-se-resize flex items-end justify-end p-1.5 text-white opacity-0 hover:opacity-100 transition-opacity"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <polyline points="15 3 21 3 21 9"></polyline>
          <polyline points="9 21 3 21 3 15"></polyline>
          <line x1="21" y1="3" x2="14" y2="10"></line>
          <line x1="3" y1="21" x2="10" y2="14"></line>
        </svg>
      </div>
    </div>
  );
}
