mod setup;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .manage(setup::BackendState { child: std::sync::Mutex::new(None) })
    .invoke_handler(tauri::generate_handler![
        setup::check_python_env,
        setup::install_python_env,
        setup::start_backend
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .on_window_event(|window, event| {
        if let tauri::WindowEvent::CloseRequested { .. } = event {
            if window.label() == "main" {
                use tauri::Manager;
                let child_opt = window.app_handle().state::<setup::BackendState>().child.lock().unwrap().take();
                if let Some(child) = child_opt {
                    let _ = child.kill();
                }
            }
        }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
