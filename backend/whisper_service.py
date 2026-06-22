from faster_whisper import WhisperModel
import torch

class WhisperService:
    def __init__(self, model_size="small"):
        self.model_size = model_size
        # Prioritize CUDA when available
        if torch.cuda.is_available():
            device = "cuda"
            compute_type = "float16"
        else:
            device = "cpu"
            compute_type = "int8"
            
        print(f"Initializing Whisper model '{model_size}' on {device} ({compute_type})")
        self.model = WhisperModel(model_size, device=device, compute_type=compute_type)
        
    def transcribe(self, audio_chunk, language="en"):
        """
        Transcribes a float32 numpy array audio chunk.
        Returns a tuple of (text, detected_language).
        """
        whisper_lang = None if language == "auto" else language
        
        # faster-whisper expects float32 array
        segments, info = self.model.transcribe(
            audio_chunk, 
            beam_size=5, 
            language=whisper_lang,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500)
        )
        text = " ".join([segment.text for segment in segments])
        return text, info.language
