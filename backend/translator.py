import argostranslate.package
import argostranslate.translate

class TranslatorService:
    def __init__(self):
        # Update package index and install basic packages if needed
        print("Initializing Argos Translate...")
        argostranslate.package.update_package_index()
        self.available_packages = argostranslate.package.get_available_packages()
        
        self.installed_langs = set()
        self._ensure_installed("en", "es")
        
    def _ensure_installed(self, from_code, to_code):
        if (from_code, to_code) in self.installed_langs:
            return
            
        installed = argostranslate.package.get_installed_packages()
        for pkg in installed:
            if pkg.from_code == from_code and pkg.to_code == to_code:
                self.installed_langs.add((from_code, to_code))
                return
                
        # Needs installing
        print(f"Installing translation package {from_code} -> {to_code}...")
        package_to_install = next(
            filter(lambda x: x.from_code == from_code and x.to_code == to_code, self.available_packages),
            None
        )
        if package_to_install:
            argostranslate.package.install_from_path(package_to_install.download())
            self.installed_langs.add((from_code, to_code))
        else:
            print(f"Package {from_code} -> {to_code} not found in Argos Translate.")
            
    def translate(self, text, from_lang="en", to_lang="es"):
        if not text or not text.strip():
            return ""
            
        self._ensure_installed(from_lang, to_lang)
        try:
            translated_text = argostranslate.translate.translate(text, from_lang, to_lang)
            return translated_text
        except Exception as e:
            print(f"Translation error: {e}")
            return text
