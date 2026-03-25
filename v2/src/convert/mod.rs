mod codegen;
mod parser;

use anyhow::{bail, Context, Result};
use console::style;
use std::fs;
use std::path::Path;

use crate::scaffold;

pub fn run(file: &str, output: Option<&str>, framework: &str) -> Result<()> {
    let source = fs::read_to_string(file)
        .with_context(|| format!("Could not read {file}"))?;

    let spinner = scaffold::new_spinner("Parsing contract...");
    let info = parser::parse_contract(&source)?;
    spinner.finish_with_message(format!(
        "{} Parsed {} ({} functions, {} state variables)",
        style("✓").green().bold(),
        style(&info.name).cyan(),
        info.functions.len(),
        info.state_vars.len(),
    ));

    let output_name = output
        .map(|s| s.to_string())
        .unwrap_or_else(|| format!("{}-diamond", to_kebab(&info.name)));

    let target = std::env::current_dir()?.join(&output_name);
    if target.exists() {
        bail!(
            "Directory {} already exists",
            style(target.display()).red().bold()
        );
    }

    // Copy the base Diamond template (default/foundry or default/hardhat/typescript)
    let spinner = scaffold::new_spinner("Extracting Diamond template...");
    let template_subdir = match framework {
        "hardhat" => "default/hardhat/typescript",
        _ => "default/foundry",
    };
    let base_dir = scaffold::TEMPLATES
        .get_dir(template_subdir)
        .with_context(|| format!("Base template not found: {template_subdir}"))?;
    scaffold::extract_template(base_dir, &target)?;

    if framework != "hardhat" {
        scaffold::create_foundry_lib_dirs(&target)?;
    }
    spinner.finish_with_message(format!(
        "{} Base Diamond template extracted",
        style("✓").green().bold()
    ));

    // Generate the custom files
    let spinner = scaffold::new_spinner("Generating facets and storage...");
    let files = codegen::generate(&info);

    for f in &files {
        let dest = target.join(&f.path);
        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(&dest, &f.content)?;
    }
    spinner.finish_with_message(format!(
        "{} Generated {}Facet, LibAppStorage, DiamondInit, interface, test, README",
        style("✓").green().bold(),
        info.name,
    ));

    // Git init (required for forge install)
    let spinner = scaffold::new_spinner("Initializing git repository...");
    if scaffold::run_cmd("git", &["init"], &target).is_ok() {
        spinner.finish_with_message(format!(
            "{} Git repository initialized",
            style("✓").green().bold()
        ));
    } else {
        spinner.finish_with_message(format!(
            "{} Could not initialize git (is git installed?)",
            style("⚠").yellow().bold()
        ));
    }

    // Install deps for Foundry
    if framework != "hardhat" {
        let spinner = scaffold::new_spinner("Running forge install...");
        match scaffold::run_cmd("forge", &["install"], &target) {
            Ok(_) => spinner.finish_with_message(format!(
                "{} Dependencies installed",
                style("✓").green().bold()
            )),
            Err(_) => {
                spinner.finish_with_message(format!(
                    "{} Could not run forge install",
                    style("⚠").yellow().bold()
                ));
                eprintln!(
                    "  Run {} in the project directory to install manually.\n",
                    style("forge install").cyan()
                );
            }
        }
    }

    print_success(&info.name, &output_name, framework, &target);
    Ok(())
}

fn to_kebab(name: &str) -> String {
    let mut result = String::new();
    for (i, ch) in name.chars().enumerate() {
        if ch.is_uppercase() && i > 0 {
            result.push('-');
        }
        result.push(ch.to_ascii_lowercase());
    }
    result
}

fn print_success(contract_name: &str, dir_name: &str, framework: &str, target: &Path) {
    let facet_name = format!("{}Facet", contract_name);

    println!();
    println!(
        "  {} Converted {} into a Diamond Standard project!",
        style("◆").cyan().bold(),
        style(contract_name).green().bold()
    );
    println!();

    println!("  {}", style("Generated files:").white().bold());
    let generated = [
        format!("contracts/facets/{facet_name}.sol"),
        format!("contracts/interfaces/I{facet_name}.sol"),
        "contracts/libraries/LibAppStorage.sol".to_string(),
        "contracts/upgradeInitializers/DiamondInit.sol".to_string(),
        format!("test/deploy{contract_name}.t.sol"),
        "README.md".to_string(),
    ];
    for f in &generated {
        if target.join(f).exists() {
            println!("    {} {}", style("+").green(), style(f).white());
        }
    }

    println!();
    println!("  {}", style("Next steps:").white().bold());
    println!(
        "    {}  {}",
        style("$").dim(),
        style(format!("cd {dir_name}")).white()
    );

    if framework == "hardhat" {
        println!(
            "    {}  {}",
            style("$").dim(),
            style("npm install").white()
        );
        println!(
            "    {}  {}  {}",
            style("$").dim(),
            style("npx hardhat compile").white(),
            style("# compile").dim()
        );
        println!(
            "    {}  {}  {}",
            style("$").dim(),
            style("npx hardhat test").white(),
            style("# test").dim()
        );
    } else {
        println!(
            "    {}  {}  {}",
            style("$").dim(),
            style("forge build").white(),
            style("# compile").dim()
        );
        println!(
            "    {}  {}  {}",
            style("$").dim(),
            style("forge test").white(),
            style("# test").dim()
        );
    }

    println!();
    println!("  {}", style("Happy building! ◆").dim());
    println!();
}
