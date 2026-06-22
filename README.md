# GnzaSync

**GnzaSync** es una herramienta profesional, rápida y optimizada de traducción universal en tiempo real para PC, diseñada específicamente para traducir transmisiones en vivo (Twitch, Kick, videos) de forma automática.

## Características Principales

### ⚙️ El Motor (Backend de Inteligencia Artificial)
- **Captura de Sistema (Loopback):** Captura directamente el audio interno de tu PC. Es decir, "escucha" lo mismo que tú estás escuchando en tus audífonos.
- **Detección Inteligente de Silencios (VAD):** La Inteligencia Artificial analiza el audio solo cuando detecta que alguien está hablando. Ahorra recursos de GPU y CPU.
- **IA Local (Offline):** Transcripción instantánea con **Faster-Whisper** usando tu Tarjeta Gráfica (GPU) o Procesador (CPU), y traducción al español (o inglés) con **Argos Translate**, todo de manera local y privada.

### 🎨 La Interfaz (Frontend)
- **Diseño Premium:** Interfaz moderna tipo "Glassmorphism", con fondos oscuros, colores neón y bordes personalizados.
- **Overlay Dinámico:** Ventana flotante transparente donde se proyectan los subtítulos por encima de cualquier video o stream que estés viendo.
- **Panel de Control Avanzado (Dashboard):**
  - **Selector de Motor IA:** Cambia la velocidad y peso de la IA en tiempo real (Tiny, Base, Small).
  - **Personalización del Overlay:** Controles para cambiar el tamaño de letra, opacidad de la caja negra, y alineación.
  - **Monitor de Hardware:** Indicador en tiempo real del uso de GPU y CPU.

## Tecnologías Utilizadas
- React, TypeScript, Vite
- Tauri (Backend y empaquetado de aplicación de escritorio)
- Faster-Whisper, Argos Translate (Modelos de IA)

## Licencia
Este proyecto está bajo la Licencia MIT.
Copyright (c) Gnza.
