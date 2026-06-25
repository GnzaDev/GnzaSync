from pypresence import Presence
import time

class DiscordRPCManager:
    def __init__(self, client_id="1118123281231230000"):
        self.client_id = client_id
        self.rpc = None
        self.is_connected = False
        self.start_time = None
        
    def connect(self):
        try:
            self.rpc = Presence(self.client_id)
            self.rpc.connect()
            self.is_connected = True
            self.start_time = int(time.time())
            print("Discord RPC connected!")
        except Exception as e:
            print(f"Failed to connect Discord RPC: {e}")
            self.is_connected = False
            
    def update(self, source_lang, target_lang, engine):
        if not self.is_connected:
            return
        try:
            engine_str = engine.capitalize()
            self.rpc.update(
                state=f"Traduciendo {source_lang.upper()} ➔ {target_lang.upper()}",
                details=f"Motor: {engine_str}",
                start=self.start_time,
                large_text="GnzaSync"
            )
        except Exception as e:
            print(f"Discord RPC Update Error: {e}")
            
    def disconnect(self):
        if self.is_connected and self.rpc:
            try:
                self.rpc.close()
            except:
                pass
            self.is_connected = False
            print("Discord RPC disconnected.")
