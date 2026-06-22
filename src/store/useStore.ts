import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  sourceLang: string;
  targetLang: string;
  overlayOpacity: number;
  modelSize: string;
  fontSize: number;
  subtitleBackground: boolean;
  subtitleAlign: 'center' | 'left';
  setSourceLang: (lang: string) => void;
  setTargetLang: (lang: string) => void;
  setModelSize: (size: string) => void;
  setOverlayOpacity: (opacity: number) => void;
  setFontSize: (size: number) => void;
  setSubtitleBackground: (bg: boolean) => void;
  setSubtitleAlign: (align: 'center' | 'left') => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      sourceLang: 'en',
      targetLang: 'es',
      overlayOpacity: 80,
      fontSize: 24,
      subtitleBackground: true,
      subtitleAlign: 'center',
      modelSize: 'small',
      setSourceLang: (lang) => set({ sourceLang: lang }),
      setTargetLang: (lang) => set({ targetLang: lang }),
      setModelSize: (size) => set({ modelSize: size }),
      setOverlayOpacity: (opacity) => set({ overlayOpacity: opacity }),
      setFontSize: (size) => set({ fontSize: size }),
      setSubtitleBackground: (bg) => set({ subtitleBackground: bg }),
      setSubtitleAlign: (align) => set({ subtitleAlign: align }),
    }),
    {
      name: 'streamtranslate-storage',
    }
  )
);
