use anyhow::{bail, Result};
use console::style;
use dialoguer::{theme::ColorfulTheme, Confirm, Input, Select};

#[derive(Debug, Clone)]
pub enum Template {
    Default,
    Erc20,
    Erc721,
}

#[derive(Debug, Clone)]
pub enum Framework {
    Foundry,
    Hardhat,
}

#[derive(Debug, Clone)]
pub enum Language {
    JavaScript,
    TypeScript,
}

#[derive(Debug, Clone)]
pub struct ProjectConfig {
    pub name: String,
    pub template: Template,
    pub framework: Framework,
    pub language: Option<Language>,
    pub install_deps: bool,
    pub git_init: bool,
}

impl std::fmt::Display for Template {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Template::Default => write!(f, "Default"),
            Template::Erc20 => write!(f, "ERC20"),
            Template::Erc721 => write!(f, "ERC721"),
        }
    }
}

impl std::fmt::Display for Framework {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Framework::Foundry => write!(f, "Foundry"),
            Framework::Hardhat => write!(f, "Hardhat"),
        }
    }
}

impl Template {
    pub fn dir_name(&self) -> &str {
        match self {
            Template::Default => "default",
            Template::Erc20 => "ERC20",
            Template::Erc721 => "ERC721",
        }
    }
}

impl Framework {
    pub fn dir_name(&self) -> &str {
        match self {
            Framework::Foundry => "foundry",
            Framework::Hardhat => "hardhat",
        }
    }
}

impl Language {
    pub fn dir_name(&self) -> &str {
        match self {
            Language::JavaScript => "javascript",
            Language::TypeScript => "typescript",
        }
    }
}

pub fn run(name: Option<String>) -> Result<ProjectConfig> {
    let theme = ColorfulTheme::default();

    let name = match name {
        Some(n) => n,
        None => Input::with_theme(&theme)
            .with_prompt("Project name")
            .default("my-diamond-project".to_string())
            .validate_with(|input: &String| -> Result<(), &str> {
                if input.is_empty() {
                    Err("Project name cannot be empty")
                } else if input.contains(' ') {
                    Err("Project name cannot contain spaces")
                } else {
                    Ok(())
                }
            })
            .interact_text()?,
    };

    let target = std::env::current_dir()?.join(&name);
    if target.exists() {
        bail!(
            "Directory {} already exists. Choose a different project name.",
            style(&name).red().bold()
        );
    }

    let template_items = &[
        "Default  — Diamond proxy with core facets",
        "ERC20    — Diamond with ERC20 token facet",
        "ERC721   — Diamond with ERC721 NFT facet",
    ];
    let template_idx = Select::with_theme(&theme)
        .with_prompt("Template")
        .items(template_items)
        .default(0)
        .interact()?;
    let template = match template_idx {
        0 => Template::Default,
        1 => Template::Erc20,
        2 => Template::Erc721,
        _ => unreachable!(),
    };

    let framework_items = &[
        "Foundry  — Blazing-fast Solidity framework (Rust toolchain)",
        "Hardhat  — Flexible Ethereum dev environment (Node.js)",
    ];
    let framework_idx = Select::with_theme(&theme)
        .with_prompt("Framework")
        .items(framework_items)
        .default(0)
        .interact()?;
    let framework = match framework_idx {
        0 => Framework::Foundry,
        1 => Framework::Hardhat,
        _ => unreachable!(),
    };

    let language = if matches!(framework, Framework::Hardhat) {
        let lang_items = &[
            "TypeScript  — Recommended",
            "JavaScript",
        ];
        let lang_idx = Select::with_theme(&theme)
            .with_prompt("Language")
            .items(lang_items)
            .default(0)
            .interact()?;
        Some(match lang_idx {
            0 => Language::TypeScript,
            1 => Language::JavaScript,
            _ => unreachable!(),
        })
    } else {
        None
    };

    let install_deps = Confirm::with_theme(&theme)
        .with_prompt("Install dependencies?")
        .default(true)
        .interact()?;

    let git_init = if install_deps && matches!(framework, Framework::Foundry) {
        // Foundry's `forge install` requires a git repo, so auto-enable
        println!(
            "  {} Git init required for Foundry dependency installation.",
            style("ℹ").cyan()
        );
        true
    } else {
        Confirm::with_theme(&theme)
            .with_prompt("Initialize a git repository?")
            .default(true)
            .interact()?
    };

    println!();

    Ok(ProjectConfig {
        name,
        template,
        framework,
        language,
        install_deps,
        git_init,
    })
}
