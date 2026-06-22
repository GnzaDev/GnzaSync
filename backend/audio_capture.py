import soundcard as sc
import numpy as np

class AudioCapture:
    def record_chunks(self, samplerate=16000, silence_threshold=0.002, silence_limit=0.5, max_duration=4.0, clear_limit=5.0):
        """
        Captures system audio dynamically. Yields audio when the speaker pauses, 
        drastically reducing latency and CPU usage compared to fixed blocks.
        """
        try:
            default_speaker = sc.default_speaker()
            mics = sc.all_microphones(include_loopback=True)
            
            loopback_mic = next((m for m in mics if m.isloopback and default_speaker.name in m.name), None)
            if not loopback_mic:
                loopback_mics = [m for m in mics if m.isloopback]
                loopback_mic = loopback_mics[0] if loopback_mics else sc.default_microphone()
                    
            print(f"Using audio device: {loopback_mic.name}")
            
            frame_duration = 0.1
            frames_per_read = int(samplerate * frame_duration)
            
            accumulated_audio = []
            silence_timer = 0.0
            is_speaking = False
            total_silence = 0.0
            
            with loopback_mic.recorder(samplerate=samplerate, channels=1) as mic:
                while True:
                    data = mic.record(numframes=frames_per_read)
                    audio_data = data[:, 0].astype(np.float32)
                    
                    rms = np.sqrt(np.mean(audio_data**2))
                    
                    if rms > silence_threshold:
                        is_speaking = True
                        silence_timer = 0.0
                        total_silence = 0.0
                        accumulated_audio.append(audio_data)
                    else:
                        if is_speaking:
                            silence_timer += frame_duration
                            accumulated_audio.append(audio_data)
                            
                            current_duration = len(accumulated_audio) * frame_duration
                            
                            if silence_timer >= silence_limit or current_duration >= max_duration:
                                yield np.concatenate(accumulated_audio)
                                accumulated_audio = []
                                is_speaking = False
                                silence_timer = 0.0
                        else:
                            total_silence += frame_duration
                            if total_silence >= clear_limit and total_silence < clear_limit + frame_duration:
                                # Yield empty to clear subtitles after long silence
                                yield np.array([], dtype=np.float32)

                    
        except Exception as e:
            print(f"Failed to initialize audio capture: {e}")
