use anyhow::{Context, Result};
use console::style;
use include_dir::{include_dir, Dir};
use indicatif::{ProgressBar, ProgressStyle};
use std::fs;
use std::path::Path;
use std::process::Command;
use std::time::Duration;

use crate::prompt::{Framework, ProjectConfig};

pub static TEMPLATES: Dir = include_dir!("$CARGO_MANIFEST_DIR/templates");

pub fn run(config: &ProjectConfig) -> Result<()> {
    let target_dir = std::env::current_dir()?.join(&config.name);
    let template_path = build_template_path(config);

    let template_dir = TEMPLATES
        .get_dir(&template_path)
        .with_context(|| format!("Template not found: {template_path}"))?;

    // --- Extract template ---
    let spinner = new_spinner("Scaffolding project...");
    extract_template(template_dir, &target_dir)?;

    if matches!(config.framework, Framework::Foundry) {
        create_foundry_lib_dirs(&target_dir)?;
    }
    spinner.finish_with_message(format!(
        "{} Project scaffolded",
        style("✓").green().bold()
    ));

    // --- Git init ---
    if config.git_init {
        let spinner = new_spinner("Initializing git repository...");
        run_cmd("git", &["init"], &target_dir)
            .context("Failed to initialize git repository. Is git installed?")?;
        spinner.finish_with_message(format!(
            "{} Git repository initialized",
            style("✓").green().bold()
        ));
    }

    // --- Install dependencies ---
    if config.install_deps {
        install_deps(config, &target_dir)?;
    }

    print_success(config);
    Ok(())
}

fn build_template_path(config: &ProjectConfig) -> String {
    let mut path = config.template.dir_name().to_string();
    path.push('/');
    path.push_str(config.framework.dir_name());

    if let Some(ref lang) = config.language {
        path.push('/');
        path.push_str(lang.dir_name());
    }

    path
}

/// Recursively extract an embedded directory to disk, stripping the
/// template prefix so files land directly in `target`.
pub fn extract_template(dir: &Dir<'_>, target: &Path) -> Result<()> {
    let prefix = dir.path();
    write_tree(dir, prefix, target)
}

pub fn write_tree(dir: &Dir<'_>, prefix: &Path, target: &Path) -> Result<()> {
    for file in dir.files() {
        let name = file
            .path()
            .file_name()
            .map(|n| n.to_string_lossy())
            .unwrap_or_default();
        if name == ".gitkeep" {
            continue;
        }

        let relative = file.path().strip_prefix(prefix).unwrap_or(file.path());
        let dest = target.join(relative);

        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(&dest, file.contents())?;
    }

    for subdir in dir.dirs() {
        write_tree(subdir, prefix, target)?;
    }

    Ok(())
}

/// Foundry templates reference git submodules whose directories are empty in
/// the embedded tree. Parse `.gitmodules` and ensure the paths exist so
/// `forge install` can populate them.
pub fn create_foundry_lib_dirs(target_dir: &Path) -> Result<()> {
    let gitmodules = target_dir.join(".gitmodules");
    if !gitmodules.exists() {
        fs::create_dir_all(target_dir.join("lib"))?;
        return Ok(());
    }

    let content = fs::read_to_string(&gitmodules)?;
    for line in content.lines() {
        let trimmed = line.trim();
        if let Some(path) = trimmed.strip_prefix("path = ") {
            fs::create_dir_all(target_dir.join(path))?;
        }
    }

    Ok(())
}

fn install_deps(config: &ProjectConfig, target_dir: &Path) -> Result<()> {
    let (cmd, args, label) = match config.framework {
        Framework::Foundry => ("forge", vec!["install"], "forge install"),
        Framework::Hardhat => ("npm", vec!["install"], "npm install"),
    };

    let spinner = new_spinner(&format!("Running {label}..."));

    match run_cmd(cmd, &args, target_dir) {
        Ok(_) => {
            spinner.finish_with_message(format!(
                "{} Dependencies installed",
                style("✓").green().bold()
            ));
        }
        Err(e) => {
            spinner.finish_with_message(format!(
                "{} Could not install dependencies: {e}",
                style("⚠").yellow().bold()
            ));
            eprintln!(
                "  Run {} in your project directory to install manually.\n",
                style(label).cyan()
            );
        }
    }

    Ok(())
}

pub fn run_cmd(cmd: &str, args: &[&str], dir: &Path) -> Result<()> {
    let output = Command::new(cmd)
        .args(args)
        .current_dir(dir)
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::piped())
        .output()
        .with_context(|| format!("`{cmd}` not found — is it installed?"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("`{cmd}` exited with {}: {}", output.status, stderr.trim());
    }

    Ok(())
}

pub fn new_spinner(msg: &str) -> ProgressBar {
    let pb = ProgressBar::new_spinner();
    pb.set_style(
        ProgressStyle::with_template("  {spinner:.cyan} {msg}")
            .unwrap()
            .tick_strings(&["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏", " "]),
    );
    pb.set_message(msg.to_string());
    pb.enable_steady_tick(Duration::from_millis(80));
    pb
}

fn print_success(config: &ProjectConfig) {
    println!();
    println!(
        "  {} Project {} is ready!",
        style("◆").cyan().bold(),
        style(&config.name).green().bold()
    );
    println!();
    println!("  {}", style("Next steps:").white().bold());
    println!(
        "    {}  {}",
        style("$").dim(),
        style(format!("cd {}", config.name)).white()
    );

    match config.framework {
        Framework::Foundry => {
            if !config.install_deps {
                println!(
                    "    {}  {}",
                    style("$").dim(),
                    style("forge install").white()
                );
            }
            println!(
                "    {}  {}  {}",
                style("$").dim(),
                style("forge build").white(),
                style("# compile contracts").dim()
            );
            println!(
                "    {}  {}  {}",
                style("$").dim(),
                style("forge test").white(),
                style("# run tests").dim()
            );
        }
        Framework::Hardhat => {
            if !config.install_deps {
                println!(
                    "    {}  {}",
                    style("$").dim(),
                    style("npm install").white()
                );
            }
            println!(
                "    {}  {}  {}",
                style("$").dim(),
                style("npx hardhat compile").white(),
                style("# compile contracts").dim()
            );
            println!(
                "    {}  {}  {}",
                style("$").dim(),
                style("npx hardhat test").white(),
                style("# run tests").dim()
            );
        }
    }

    println!();
    println!(
        "  {}",
        style("Happy building! ◆").dim()
    );
    println!();
}
