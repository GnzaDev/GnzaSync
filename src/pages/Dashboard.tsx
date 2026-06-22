import { useEffect, useState } from 'react';
import { Play, Square, Settings, Eye, EyeOff, RefreshCw, ChevronsRight, Globe, Languages, Minus, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { api, type StatusResponse } from '../services/api';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow, Window } from '@tauri-apps/api/window';

export default function Dashboard() {
  const { sourceLang, targetLang, setSourceLang, setTargetLang, fontSize, setFontSize, overlayOpacity, setOverlayOpacity, modelSize, setModelSize, subtitleAlign, setSubtitleAlign } = useStore();
  const [status, setStatus] = useState<StatusResponse>({ running: false, latency: 0 });
  const [isEnvReady, setIsEnvReady] = useState<boolean | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState({ status: '', percent: 0 });
  const [pipLog, setPipLog] = useState('');
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);

  const overlayWindow = new Window('overlay');

  useEffect(() => {
    // Check if python environment exists
    invoke<boolean>('check_python_env').then(ready => {
      setIsEnvReady(ready);
      if (ready) {
        invoke('start_backend').catch(console.error);
      }
    }).catch(console.error);

    // Listen to setup progress
    const unlistenProgress = listen<{ status: string; percent: number }>('setup-progress', (event) => {
      setInstallProgress(event.payload);
    });

    const unlistenLog = listen<string>('pip-log', (event) => {
      setPipLog(event.payload.trim());
    });

    const interval = setInterval(async () => {
      if (!isEnvReady) return;
      try {
        const res = await api.getStatus();
        setStatus(res);
      } catch (e) {
        // Backend might be starting
      }
    }, 1000);
    
    return () => {
      clearInterval(interval);
      unlistenProgress.then(f => f());
      unlistenLog.then(f => f());
    };
  }, [isEnvReady]);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await invoke('install_python_env');
      setIsEnvReady(true);
      await invoke('start_backend');
    } catch (e) {
      console.error(e);
      alert("Error instalando el motor: " + e);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleStart = async () => {
    await api.start(sourceLang, targetLang, modelSize);
  };

  const handleStop = async () => {
    await api.stop();
  };

  const handleToggleOverlay = async () => {
    const visible = await overlayWindow.isVisible();
    if (visible) {
      await overlayWindow.hide();
      setIsOverlayVisible(false);
    } else {
      await overlayWindow.show();
      setIsOverlayVisible(true);
    }
  };

  const handleRestart = async () => {
    if (status.running) {
      await api.stop();
    }
    // Small delay to allow backend to release resources
    setTimeout(async () => {
      await api.start(sourceLang, targetLang, modelSize);
    }, 500);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-[#130d1d] to-[#0b0811] text-white overflow-hidden">
      {/* Custom Titlebar */}
      <div data-tauri-drag-region className="flex items-center justify-between px-4 py-2 bg-[#0c0812]/80 backdrop-blur-md border-b border-white/[0.03] select-none shrink-0 z-50">
        <div className="flex items-center gap-2 pointer-events-none">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
          <span className="font-semibold text-xs tracking-wide text-gray-300">GnzaSync</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => getCurrentWindow().minimize()} className="p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-colors"><Minus size={14} /></button>
          <button onClick={() => getCurrentWindow().toggleMaximize()} className="p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-colors"><Square size={12} /></button>
          <button onClick={() => getCurrentWindow().close()} className="p-1 text-gray-500 hover:text-white hover:bg-red-500/80 rounded transition-colors"><X size={14} /></button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
      {isEnvReady === false ? (
        <div className="flex flex-col items-center justify-center h-full gap-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              GnzaSync
            </h1>
            <p className="text-gray-400 max-w-md text-sm">
              Preparando motor local de Inteligencia Artificial (2GB)...
            </p>
          </div>

          {!isInstalling ? (
            <button 
              onClick={handleInstall}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
            >
              Descargar Motor
            </button>
          ) : (
            <div className="w-full max-w-md space-y-2">
              <div className="flex justify-between text-xs text-gray-400 font-medium px-1">
                <span>{installProgress.status || 'Preparando...'}</span>
                <span>{installProgress.percent}%</span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300" 
                  style={{ width: `${installProgress.percent}%` }}
                />
              </div>
              {pipLog && installProgress.percent === 50 && (
                <div className="text-[10px] text-gray-500 font-mono mt-2 truncate text-center opacity-70">
                  {pipLog}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Top Bar */}
          <div className="flex items-center justify-between bg-[#1e1728]/60 border border-white/[0.03] rounded-full p-2 pr-4 shadow-sm shadow-black/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <ChevronsRight size={16} />
              </div>
              <h1 className="text-lg font-bold text-gray-100 tracking-wide flex flex-col">
                <div>Gnza<span className="text-gray-500 font-normal">Sync</span></div>
                <span className="text-[9px] text-gray-500 font-normal -mt-1 tracking-wider uppercase">por Gnza</span>
              </h1>
            </div>
            
            <div className="flex gap-2">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${status.gpu_available ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'} text-[10px] font-bold`}>
                {status.gpu_available ? 'GPU' : 'CPU'}
              </div>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${status.running ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-white/5 border-white/5 text-gray-400'} text-xs font-medium`}>
                <div className={`w-1.5 h-1.5 rounded-full ${status.running ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-gray-500'}`} />
                {status.running ? `Capturando` : 'Detenido'}
              </div>
            </div>
          </div>

          {/* Language Selectors */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="flex flex-col bg-[#1e1728]/40 border border-white/[0.03] rounded-2xl p-3 relative hover:bg-[#1e1728]/60 transition-colors">
              <label className="text-[10px] font-bold text-gray-500 mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                <Globe size={12} className="opacity-70" /> Hablan en
              </label>
              <select 
                value={sourceLang} 
                onChange={(e) => setSourceLang(e.target.value)}
                disabled={status.running}
                className="w-full bg-transparent text-gray-100 font-semibold focus:outline-none appearance-none cursor-pointer disabled:opacity-50"
              >
                <option value="auto" className="bg-[#1e1728]">Auto-detectar</option>
                <option value="en" className="bg-[#1e1728]">Inglés</option>
                <option value="es" className="bg-[#1e1728]">Español</option>
                <option value="ja" className="bg-[#1e1728]">Japonés</option>
              </select>
              <div className="absolute right-3 bottom-3 text-gray-500 pointer-events-none">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
            
            <div className="flex flex-col bg-[#1e1728]/40 border border-white/[0.03] rounded-2xl p-3 relative hover:bg-[#1e1728]/60 transition-colors">
              <label className="text-[10px] font-bold text-gray-500 mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                <Languages size={12} className="opacity-70" /> Traducir a
              </label>
              <select 
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full bg-transparent text-gray-100 font-semibold focus:outline-none appearance-none cursor-pointer"
              >
                <option value="es" className="bg-[#1e1728]">Español</option>
                <option value="en" className="bg-[#1e1728]">Inglés</option>
              </select>
              <div className="absolute right-3 bottom-3 text-gray-500 pointer-events-none">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
            
            <div className="col-span-2 flex flex-col bg-[#1e1728]/40 border border-white/[0.03] rounded-2xl p-3 relative hover:bg-[#1e1728]/60 transition-colors">
              <label className="text-[10px] font-bold text-gray-500 mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                 Velocidad del Motor (IA)
              </label>
              <select 
                value={modelSize} 
                onChange={(e) => setModelSize(e.target.value)}
                disabled={status.running}
                className="w-full bg-transparent text-gray-100 font-semibold focus:outline-none appearance-none cursor-pointer disabled:opacity-50"
              >
                <option value="tiny" className="bg-[#1e1728]">Rápido (Baja Latencia - Tiny)</option>
                <option value="base" className="bg-[#1e1728]">Equilibrado (Recomendado - Base)</option>
                <option value="small" className="bg-[#1e1728]">Preciso (Mayor Calidad - Small)</option>
              </select>
              <div className="absolute right-3 bottom-3 text-gray-500 pointer-events-none">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex-1 bg-[#1e1728]/40 border border-white/[0.03] rounded-3xl p-5 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Settings size={14} className="text-gray-500" /> Controles y apariencia
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={handleToggleOverlay}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 transition-colors"
                >
                  {isOverlayVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button 
                  onClick={handleRestart}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 transition-colors"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-200">Tamaño de fuente</span>
                  <span className="text-xs bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-md font-medium border border-indigo-500/20">{fontSize}px</span>
                </div>
                <input 
                  type="range" 
                  min="12" max="48" 
                  value={fontSize} 
                  onChange={(e) => setFontSize(Number(e.target.value))} 
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-400" 
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-200">Opacidad del Fondo</span>
                  <span className="text-xs bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-md font-medium border border-indigo-500/20">{overlayOpacity}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={overlayOpacity} 
                  onChange={(e) => setOverlayOpacity(Number(e.target.value))} 
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-400" 
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-200">Alineación del Texto</span>
                <select 
                  value={subtitleAlign || 'center'} 
                  onChange={(e) => setSubtitleAlign(e.target.value as 'center' | 'left')}
                  className="bg-white/10 text-white text-xs font-medium px-2 py-1 rounded outline-none cursor-pointer"
                >
                  <option value="center" className="bg-[#1e1728]">Centrado</option>
                  <option value="left" className="bg-[#1e1728]">Izquierda</option>
                </select>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <div className="mt-auto pt-2">
            {!status.running ? (
              <button 
                onClick={handleStart} 
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white py-3.5 rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)]"
              >
                <Play size={16} className="fill-current" /> Iniciar captura
              </button>
            ) : (
              <button 
                onClick={handleStop} 
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500/80 to-pink-600/80 hover:from-red-500 hover:to-pink-600 border border-red-500/30 text-white py-3.5 rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
              >
                <Square size={16} className="fill-current" /> Detener captura
              </button>
            )}
            
            <p className="text-center text-[10px] text-gray-500 mt-4 font-medium flex items-center justify-center gap-1.5">
              Atajo rápido <kbd className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-gray-400 font-sans">⌘</kbd> <kbd className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-gray-400 font-sans">⇧</kbd> <kbd className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-gray-400 font-sans">S</kbd>
            </p>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
