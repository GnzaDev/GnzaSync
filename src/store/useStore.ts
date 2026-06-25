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
  translationEngine: string;
  deeplKey: string;
  openaiKey: string;
  openRouterKey: string;
  discordRpcEnabled: boolean;
  setSourceLang: (lang: string) => void;
  setTargetLang: (lang: string) => void;
  setModelSize: (size: string) => void;
  setOverlayOpacity: (opacity: number) => void;
  setFontSize: (size: number) => void;
  setSubtitleBackground: (bg: boolean) => void;
  setSubtitleAlign: (align: 'center' | 'left') => void;
  setTranslationEngine: (engine: string) => void;
  setDeeplKey: (key: string) => void;
  setOpenaiKey: (key: string) => void;
  setOpenRouterKey: (key: string) => void;
  setDiscordRpcEnabled: (enabled: boolean) => void;
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
      translationEngine: 'argos',
      deeplKey: '',
      openaiKey: '',
      openRouterKey: '',
      discordRpcEnabled: true,
      setSourceLang: (lang) => set({ sourceLang: lang }),
      setTargetLang: (lang) => set({ targetLang: lang }),
      setModelSize: (size) => set({ modelSize: size }),
      setOverlayOpacity: (opacity) => set({ overlayOpacity: opacity }),
      setFontSize: (size) => set({ fontSize: size }),
      setSubtitleBackground: (bg) => set({ subtitleBackground: bg }),
      setSubtitleAlign: (align) => set({ subtitleAlign: align }),
      setTranslationEngine: (engine) => set({ translationEngine: engine }),
      setDeeplKey: (key) => set({ deeplKey: key }),
      setOpenaiKey: (key) => set({ openaiKey: key }),
      setOpenRouterKey: (key) => set({ openRouterKey: key }),
      setDiscordRpcEnabled: (enabled) => set({ discordRpcEnabled: enabled }),
    }),
    {
      name: 'streamtranslate-storage',
    }
  )
);
