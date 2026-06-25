import argostranslate.package
import argostranslate.translate

class TranslatorService:
    def __init__(self):
        print("Initializing Translator Service...")
        self.available_packages = []
        self.installed_langs = set()
        
    def _init_argos(self):
        if not self.available_packages:
            argostranslate.package.update_package_index()
            self.available_packages = argostranslate.package.get_available_packages()
            
    def _ensure_argos_installed(self, from_code, to_code):
        self._init_argos()
        if (from_code, to_code) in self.installed_langs:
            return
            
        installed = argostranslate.package.get_installed_packages()
        for pkg in installed:
            if pkg.from_code == from_code and pkg.to_code == to_code:
                self.installed_langs.add((from_code, to_code))
                return
                
        # Needs installing
        print(f"Installing Argos package {from_code} -> {to_code}...")
        package_to_install = next(
            filter(lambda x: x.from_code == from_code and x.to_code == to_code, self.available_packages),
            None
        )
        if package_to_install:
            argostranslate.package.install_from_path(package_to_install.download())
            self.installed_langs.add((from_code, to_code))
        else:
            print(f"Package {from_code} -> {to_code} not found in Argos Translate.")
            
    def translate(self, text, from_lang="en", to_lang="es", engine="argos", deepl_key="", openai_key="", openrouter_key=""):
        if not text or not text.strip():
            return ""
            
        try:
            if engine == "deepl" and deepl_key:
                import deepl
                translator = deepl.Translator(deepl_key)
                result = translator.translate_text(text, target_lang=to_lang.upper())
                return result.text
            elif engine == "openai" and openai_key:
                from openai import OpenAI
                client = OpenAI(api_key=openai_key)
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "system", "content": f"You are a fast translator. Translate from {from_lang} to {to_lang}. Output only the translation."}, {"role": "user", "content": text}]
                )
                return response.choices[0].message.content.strip()
            elif engine == "openrouter" and openrouter_key:
                from openai import OpenAI
                client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=openrouter_key)
                response = client.chat.completions.create(
                    model="meta-llama/llama-3-8b-instruct:free",
                    messages=[{"role": "system", "content": f"Translate this from {from_lang} to {to_lang}. Output only the translated text, nothing else."}, {"role": "user", "content": text}]
                )
                return response.choices[0].message.content.strip()
            else:
                self._ensure_argos_installed(from_lang, to_lang)
                return argostranslate.translate.translate(text, from_lang, to_lang)
        except Exception as e:
            print(f"Translation error ({engine}): {e}")
            # Fallback to Argos if API fails
            try:
                self._ensure_argos_installed(from_lang, to_lang)
                return argostranslate.translate.translate(text, from_lang, to_lang)
            except:
                return text
