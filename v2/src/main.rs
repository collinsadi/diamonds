use anyhow::Result;
use clap::{Parser, Subcommand};
use console::style;

mod banner;
mod convert;
mod prompt;
mod scaffold;

#[derive(Parser)]
#[command(
    name = "diamonds",
    version,
    about = "Scaffold EIP-2535 Diamond Standard projects",
    long_about = "A CLI tool for scaffolding EIP-2535 Diamond Standard smart contract projects\nwith Foundry or Hardhat, including ERC20 and ERC721 facet templates."
)]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {
    /// Initialize a new Diamond project interactively
    Init {
        /// Project name (skip the name prompt)
        name: Option<String>,
    },
    /// Convert a Solidity contract into a Diamond Standard project
    Convert {
        /// Path to the .sol file to convert
        file: String,

        /// Output directory name
        #[arg(short, long)]
        output: Option<String>,

        /// Framework: foundry (default) or hardhat
        #[arg(short, long, default_value = "foundry")]
        framework: String,
    },
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Some(Commands::Init { name }) => {
            banner::render();
            let config = prompt::run(name)?;
            scaffold::run(&config)?;
        }
        Some(Commands::Convert {
            file,
            output,
            framework,
        }) => {
            banner::render();
            convert::run(&file, output.as_deref(), &framework)?;
        }
        None => {
            banner::render();
            eprintln!(
                "  Run {} to scaffold a new Diamond project.\n  Run {} to convert an existing contract.\n  Run {} for more options.\n",
                style("diamonds init").cyan().bold(),
                style("diamonds convert <file.sol>").cyan().bold(),
                style("diamonds --help").cyan().bold(),
            );
        }
    }

    Ok(())
}
