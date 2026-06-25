use std::path::{Path, PathBuf};
use std::fs;
use std::io::Write;
use reqwest::Client;
use tauri::{AppHandle, Manager, Emitter};
use zip::ZipArchive;
use tauri_plugin_shell::ShellExt;

#[derive(Clone, serde::Serialize)]
struct ProgressPayload {
    status: String,
    percent: f32,
}

#[tauri::command]
pub async fn check_python_env(app: AppHandle) -> Result<bool, String> {
    let tauri_app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let app_dir = tauri_app_dir.parent().unwrap_or(&tauri_app_dir).join("GnzaSync");
    let python_exe = app_dir.join("python").join("python.exe");
    Ok(python_exe.exists())
}

#[tauri::command]
pub async fn install_python_env(app: AppHandle) -> Result<(), String> {
    let tauri_app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let app_dir = tauri_app_dir.parent().unwrap_or(&tauri_app_dir).join("GnzaSync");
    if !app_dir.exists() {
        fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
    }

    let python_dir = app_dir.join("python");
    if !python_dir.exists() {
        fs::create_dir_all(&python_dir).map_err(|e| e.to_string())?;
    }

    let client = Client::new();
    
    // 1. Download Embedded Python
    let py_zip_url = "https://www.python.org/ftp/python/3.11.8/python-3.11.8-embed-amd64.zip";
    let zip_path = app_dir.join("python.zip");
    
    emit_progress(&app, "Descargando motor base (Python)...", 10.0);
    download_file(&client, py_zip_url, &zip_path).await?;

    emit_progress(&app, "Extrayendo motor base...", 20.0);
    extract_zip(&zip_path, &python_dir)?;
    let _ = fs::remove_file(&zip_path);

    // 2. Download get-pip.py
    emit_progress(&app, "Configurando instalador de librerías...", 30.0);
    let get_pip_url = "https://bootstrap.pypa.io/get-pip.py";
    let get_pip_path = python_dir.join("get-pip.py");
    download_file(&client, get_pip_url, &get_pip_path).await?;

    // 3. Modify python311._pth to uncomment import site
    let pth_file = python_dir.join("python311._pth");
    if pth_file.exists() {
        let content = fs::read_to_string(&pth_file).map_err(|e| e.to_string())?;
        let new_content = content.replace("#import site", "import site");
        fs::write(&pth_file, new_content).map_err(|e| e.to_string())?;
    }

    // 4. Run get-pip.py
    emit_progress(&app, "Instalando gestor de librerías...", 40.0);
    let python_exe = python_dir.join("python.exe");
    
    let pip_output = app.shell().command(python_exe.to_string_lossy().to_string())
        .args(vec![get_pip_path.to_string_lossy().to_string()])
        .output()
        .await
        .map_err(|e| format!("Failed to install pip: {}", e))?;
        
    if !pip_output.status.success() {
        return Err("Pip installation failed".to_string());
    }

    // 5. Install dependencies
    emit_progress(&app, "Descargando Inteligencia Artificial (2GB+)...", 50.0);
    
    let reqs = vec!["faster-whisper", "argostranslate", "fastapi", "uvicorn", "soundcard", "pydantic", "openai", "deepl", "pypresence"];
    
    // Install Torch with CUDA first
    emit_progress(&app, "Descargando IA y PyTorch CUDA (2.5GB+)...", 45.0);
    let torch_args = vec!["-m".to_string(), "pip".to_string(), "install".to_string(), "torch".to_string(), "torchaudio".to_string(), "--index-url".to_string(), "https://download.pytorch.org/whl/cu118".to_string()];
    let _ = app.shell().command(python_exe.to_string_lossy().to_string()).args(torch_args).output().await;

    emit_progress(&app, "Instalando módulos de Inteligencia Artificial...", 70.0);
    
    let mut pip_args = vec!["-m".to_string(), "pip".to_string(), "install".to_string()];
    pip_args.extend(reqs.iter().map(|s| s.to_string()));
    
    let (mut rx, _child) = app.shell().command(python_exe.to_string_lossy().to_string())
        .args(pip_args)
        .spawn()
        .map_err(|e| format!("Failed to install dependencies: {}", e))?;

    while let Some(event) = rx.recv().await {
        match event {
            tauri_plugin_shell::process::CommandEvent::Stdout(data) => {
                let text = String::from_utf8_lossy(&data);
                let _ = app.emit("pip-log", text.to_string());
            }
            tauri_plugin_shell::process::CommandEvent::Stderr(data) => {
                let text = String::from_utf8_lossy(&data);
                let _ = app.emit("pip-log", text.to_string());
            }
            tauri_plugin_shell::process::CommandEvent::Error(err) => {
                return Err(err);
            }
            tauri_plugin_shell::process::CommandEvent::Terminated(payload) => {
                if payload.code != Some(0) {
                    return Err("Dependency installation failed".to_string());
                }
            }
            _ => {}
        }
    }

    emit_progress(&app, "¡Instalación completada!", 100.0);
    Ok(())
}

async fn download_file(client: &Client, url: &str, path: &PathBuf) -> Result<(), String> {
    let mut response = client.get(url).send().await.map_err(|e| e.to_string())?;
    let mut file = fs::File::create(path).map_err(|e| e.to_string())?;
    
    while let Some(chunk) = response.chunk().await.map_err(|e| e.to_string())? {
        file.write_all(&chunk).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn extract_zip(zip_path: &PathBuf, extract_to: &PathBuf) -> Result<(), String> {
    let file = fs::File::open(zip_path).map_err(|e| e.to_string())?;
    let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;
    
    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        let outpath = match file.enclosed_name() {
            Some(path) => extract_to.join(path),
            None => continue,
        };
        
        if (*file.name()).ends_with('/') {
            fs::create_dir_all(&outpath).map_err(|e| e.to_string())?;
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(&p).map_err(|e| e.to_string())?;
                }
            }
            let mut outfile = fs::File::create(&outpath).map_err(|e| e.to_string())?;
            std::io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

use std::sync::Mutex;
use tauri_plugin_shell::process::CommandChild;

pub struct BackendState {
    pub child: Mutex<Option<CommandChild>>,
}

#[tauri::command]
pub async fn start_backend(app: AppHandle, state: tauri::State<'_, BackendState>) -> Result<(), String> {
    let tauri_app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let app_dir = tauri_app_dir.parent().unwrap_or(&tauri_app_dir).join("GnzaSync");
    let python_exe = app_dir.join("python").join("python.exe");
    
    let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;
    
    let possible_paths = vec![
        resource_dir.join("_up_").join("backend").join("main.py"),
        resource_dir.join("backend").join("main.py"),
        PathBuf::from("backend/main.py"),
    ];

    let main_py = possible_paths.into_iter().find(|p| p.exists()).unwrap_or(PathBuf::from("backend/main.py"));

    let (_, child) = app.shell().command(python_exe.to_string_lossy().to_string())
        .args(vec![main_py.to_string_lossy().to_string()])
        .spawn()
        .map_err(|e| e.to_string())?;
        
    *state.child.lock().unwrap() = Some(child);
    Ok(())
}

fn emit_progress(app: &AppHandle, status: &str, percent: f32) {
    let _ = app.emit("setup-progress", ProgressPayload {
        status: status.to_string(),
        percent,
    });
}
