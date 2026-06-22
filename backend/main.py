from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import threading
import time
import uvicorn
import torch
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from whisper_service import WhisperService
from translator import TranslatorService
from audio_capture import AudioCapture

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

whisper_service = WhisperService(model_size="small")
translator_service = TranslatorService()
audio_capture = AudioCapture()

class AppState:
    def __init__(self):
        self.is_running = False
        self.latency = 0.0
        self.last_original = ""
        self.last_translated = ""
        self.capture_thread = None
        
    def start(self, source_lang, target_lang, model_size):
        if self.is_running:
            return
            
        global whisper_service
        if whisper_service.model_size != model_size:
            print(f"Switching model to {model_size}")
            whisper_service = WhisperService(model_size=model_size)
            
        self.is_running = True
        self.capture_thread = threading.Thread(target=self.run_loop, args=(source_lang, target_lang))
        self.capture_thread.daemon = True
        self.capture_thread.start()
        
    def stop(self):
        self.is_running = False
        
    def run_loop(self, source_lang, target_lang):
        try:
            for chunk in audio_capture.record_chunks():
                if not self.is_running:
                    break
                
                if len(chunk) == 0:
                    self.last_original = ""
                    self.last_translated = ""
                    continue
                
                start_time = time.time()
                text, detected_lang = whisper_service.transcribe(chunk, language=source_lang)
                if text and text.strip():
                    actual_source = detected_lang if source_lang == "auto" else source_lang
                    translated = translator_service.translate(text, actual_source, target_lang)
                    self.last_original = text.strip()
                    self.last_translated = translated.strip()
                
                self.latency = round(time.time() - start_time, 2)
        except Exception as e:
            print(f"Error in capture loop: {e}")
            self.is_running = False

state = AppState()

@app.get("/status")
def get_status():
    gpu = torch.cuda.is_available()
    return {
        "running": state.is_running,
        "latency": state.latency,
        "gpu_available": gpu,
        "device_name": torch.cuda.get_device_name(0) if gpu else "CPU"
    }

class StartRequest(BaseModel):
    source_lang: str = "en"
    target_lang: str = "es"
    model_size: str = "small"

@app.post("/start")
def start(req: StartRequest):
    state.start(req.source_lang, req.target_lang, req.model_size)
    return {"status": "started"}

@app.post("/stop")
def stop():
    state.stop()
    return {"status": "stopped"}

@app.get("/subtitles")
def get_subtitles():
    return {
        "original": state.last_original,
        "translated": state.last_translated
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
