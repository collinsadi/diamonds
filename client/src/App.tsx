import { useState } from "react";

const INSTALL_METHODS = [
  { label: "npm", command: "npm install -g diamondscaffold" },
  { label: "cargo", command: "cargo install diamondscaffold" },
  { label: "binary", command: "curl -fsSL github.com/collinsadi/diamonds/releases" },
] as const;

const FEATURES = [
  {
    icon: "⚡",
    title: "diamonds init",
    description:
      "Scaffold a full Diamond project in seconds. Interactive prompts or one-liner — your choice.",
    tags: ["Foundry", "Hardhat", "JS / TS"],
  },
  {
    icon: "🔄",
    title: "diamonds convert",
    description:
      "Feed any .sol file, get a complete Diamond project back. Storage extraction, facet rewriting, deploy tests — all generated.",
    tags: ["Solidity Parser", "Code Generation"],
  },
  {
    icon: "📦",
    title: "Three templates",
    description:
      "Default, ERC20, ERC721 — production-ready out of the box. Full test suites, deploy scripts, and CI workflows included.",
    tags: ["ERC20", "ERC721", "Diamond Proxy"],
  },
] as const;

const GENERATED_FILES = [
  { file: "LibAppStorage.sol", desc: "Storage library from your state variables" },
  { file: "{Name}Facet.sol", desc: "Logic rewritten as an external facet" },
  { file: "I{Name}Facet.sol", desc: "Interface for the facet" },
  { file: "DiamondInit.sol", desc: "Initializer derived from your constructor" },
  { file: "deployDiamond.t.sol", desc: "Deployment test with selector generation" },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="text-zinc-500 hover:text-diamond-light transition-colors shrink-0 cursor-pointer"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

function InstallTabs() {
  const [active, setActive] = useState(0);

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex gap-1 mb-3 justify-center">
        {INSTALL_METHODS.map((m, i) => (
          <button
            key={m.label}
            onClick={() => setActive(i)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
              i === active
                ? "bg-diamond-dim text-diamond-light border border-diamond-border"
                : "text-zinc-500 hover:text-zinc-300 border border-transparent"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
        <code className="font-mono text-sm text-zinc-200 overflow-x-auto">
          <span className="text-diamond select-none">$ </span>
          {INSTALL_METHODS[active].command}
        </code>
        <CopyButton text={INSTALL_METHODS[active].command} />
      </div>
    </div>
  );
}

function TerminalBlock() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl shadow-purple-500/5">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
          <div className="w-3 h-3 rounded-full bg-zinc-700" />
          <div className="w-3 h-3 rounded-full bg-zinc-700" />
          <div className="w-3 h-3 rounded-full bg-zinc-700" />
          <span className="ml-2 text-xs text-zinc-500 font-mono">terminal</span>
        </div>
        <div className="p-5 font-mono text-sm leading-relaxed">
          <div className="text-zinc-400">
            <span className="text-diamond">$</span> diamonds init
          </div>
          <div className="mt-3 space-y-1.5">
            <div>
              <span className="text-green-400">◆</span>
              <span className="text-zinc-300"> Project name</span>
              <span className="text-zinc-600"> ··········· </span>
              <span className="text-zinc-200">my-diamond</span>
            </div>
            <div>
              <span className="text-green-400">◆</span>
              <span className="text-zinc-300"> Template</span>
              <span className="text-zinc-600"> ·············· </span>
              <span className="text-diamond-light">ERC20</span>
            </div>
            <div>
              <span className="text-green-400">◆</span>
              <span className="text-zinc-300"> Framework</span>
              <span className="text-zinc-600"> ············· </span>
              <span className="text-diamond-light">Foundry</span>
            </div>
            <div>
              <span className="text-green-400">◆</span>
              <span className="text-zinc-300"> Install dependencies</span>
              <span className="text-zinc-600"> · </span>
              <span className="text-diamond-light">yes</span>
            </div>
            <div>
              <span className="text-green-400">◆</span>
              <span className="text-zinc-300"> Initialize git</span>
              <span className="text-zinc-600"> ········ </span>
              <span className="text-diamond-light">yes</span>
            </div>
          </div>
          <div className="mt-4 text-green-400">
            ✔ Project scaffolded at ./my-diamond
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-zinc-925/80 border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2.5 text-zinc-100 font-semibold tracking-tight">
            <span className="text-xl">◆</span>
            <span>diamondscaffold</span>
          </a>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors hidden sm:block">
              Features
            </a>
            <a href="#convert" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors hidden sm:block">
              Convert
            </a>
            <a href="#install" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors hidden sm:block">
              Install
            </a>
            <a
              href="https://github.com/collinsadi/diamonds"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-zinc-200 transition-colors"
              aria-label="GitHub"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(168,85,247,0.12),transparent)]" />
        <div className="relative max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-diamond-border bg-diamond-dim text-diamond-light text-xs font-medium mb-8">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-diamond animate-pulse" />
            v2.0 — Rewritten in Rust
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-zinc-100 tracking-tight leading-[1.1] mb-6">
            The fastest way to build{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-diamond to-diamond-light">
              upgradeable
            </span>{" "}
            smart contracts
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Scaffold and convert{" "}
            <a
              href="https://eips.ethereum.org/EIPS/eip-2535"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-300 underline decoration-zinc-600 underline-offset-4 hover:decoration-diamond transition-colors"
            >
              EIP-2535 Diamond Standard
            </a>{" "}
            projects in seconds. Single binary. Zero runtime dependencies.
          </p>

          <InstallTabs />

          <div className="flex flex-wrap items-center justify-center gap-3 mt-8 text-xs text-zinc-500">
            <a
              href="https://crates.io/crates/diamondscaffold"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors"
            >
              <img src="https://img.shields.io/crates/v/diamondscaffold?style=flat-square&logo=rust&logoColor=white&label=crates.io&color=e6522c" alt="crates.io version" className="h-5" />
            </a>
            <a
              href="https://www.npmjs.com/package/diamondscaffold"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors"
            >
              <img src="https://img.shields.io/npm/v/diamondscaffold?style=flat-square&logo=npm&logoColor=white&label=npm&color=cb3837" alt="npm version" className="h-5" />
            </a>
            <a
              href="https://github.com/collinsadi/diamonds/blob/main/LICENSE.md"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors"
            >
              <img src="https://img.shields.io/github/license/collinsadi/diamonds?style=flat-square&color=blue" alt="MIT license" className="h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Terminal Demo */}
      <section className="py-16 px-6">
        <TerminalBlock />
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight mb-4">
              Built for speed
            </h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
              One binary. Three commands. Every Diamond project template you need.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-diamond-border transition-colors"
              >
                <span className="text-2xl mb-4 block">{f.icon}</span>
                <h3 className="text-lg font-semibold text-zinc-100 font-mono mb-2">
                  {f.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                  {f.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {f.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Convert */}
      <section id="convert" className="py-20 px-6 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight mb-4">
              Convert any contract
            </h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
              Pass any flat Solidity contract. Get a complete Diamond project back.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8 items-start">
            {/* Input */}
            <div>
              <div className="text-xs font-mono text-zinc-500 mb-3 uppercase tracking-wider">Input</div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-zinc-800 text-xs font-mono text-zinc-500 flex items-center justify-between">
                  <span>MyToken.sol</span>
                </div>
                <pre className="p-4 text-sm font-mono text-zinc-300 leading-relaxed overflow-x-auto">
                  <code>{`contract MyToken {
  string public name;
  uint256 public totalSupply;
  mapping(address => uint256)
    public balanceOf;

  constructor(string memory _n) {
    name = _n;
  }

  function mint(
    address to, uint256 amount
  ) public {
    totalSupply += amount;
    balanceOf[to] += amount;
  }
}`}</code>
                </pre>
              </div>
            </div>

            {/* Output */}
            <div>
              <div className="text-xs font-mono text-zinc-500 mb-3 uppercase tracking-wider">Output</div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-zinc-800 text-xs font-mono text-zinc-500">
                  Generated project
                </div>
                <div className="p-4 space-y-2.5">
                  {GENERATED_FILES.map((g) => (
                    <div key={g.file} className="flex items-start gap-3">
                      <span className="text-diamond font-mono text-sm shrink-0 w-44">
                        {g.file}
                      </span>
                      <span className="text-zinc-500 text-sm">{g.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-center justify-between gap-3 max-w-md mx-auto">
            <code className="font-mono text-sm text-zinc-200">
              <span className="text-diamond select-none">$ </span>
              diamonds convert MyToken.sol
            </code>
            <CopyButton text="diamonds convert MyToken.sol" />
          </div>
        </div>
      </section>

      {/* Templates */}
      <section className="py-20 px-6 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight text-center mb-12">
            Production-ready templates
          </h2>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                name: "Default",
                desc: "Clean Diamond proxy — DiamondCut, DiamondLoupe, Ownership facets, deploy tests",
                cmd: "diamonds init",
              },
              {
                name: "ERC20",
                desc: "Full token facet — mint, burn, transfer, interfaces, test suite, deploy scripts",
                cmd: "diamonds init --template erc20",
              },
              {
                name: "ERC721",
                desc: "Full NFT facet — mint, transfer, approve, safe transfers, complete tests",
                cmd: "diamonds init --template erc721",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-diamond-border transition-colors"
              >
                <h3 className="text-base font-semibold text-zinc-100 mb-2">{t.name}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-4">{t.desc}</p>
                <code className="text-xs font-mono text-zinc-500 bg-zinc-800/50 rounded px-2 py-1">
                  {t.cmd}
                </code>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-zinc-500 mt-8">
            All templates include Diamond.sol, LibDiamond.sol, DiamondInit.sol, complete test suites, deploy scripts, and CI workflows.
          </p>
        </div>
      </section>

      {/* CTA / Install */}
      <section id="install" className="py-24 px-6 border-t border-zinc-800/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight mb-4">
            Get started in seconds
          </h2>
          <p className="text-zinc-400 text-lg mb-10">
            Install globally, then scaffold your first Diamond.
          </p>

          <div className="space-y-3 max-w-lg mx-auto text-left">
            {[
              { step: "1", cmd: "npm install -g diamondscaffold" },
              { step: "2", cmd: "diamonds init my-project" },
              { step: "3", cmd: "cd my-project && forge build" },
            ].map((s) => (
              <div
                key={s.step}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-center gap-4"
              >
                <span className="text-xs font-mono text-diamond shrink-0 w-5 text-center">{s.step}</span>
                <code className="font-mono text-sm text-zinc-200 flex-1 overflow-x-auto">
                  {s.cmd}
                </code>
                <CopyButton text={s.cmd} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <span className="text-base">◆</span>
            <span>diamondscaffold</span>
            <span className="text-zinc-700">·</span>
            <span>MIT License</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a
              href="https://github.com/collinsadi/diamonds"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/diamondscaffold"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              npm
            </a>
            <a
              href="https://crates.io/crates/diamondscaffold"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Crates.io
            </a>
            <a
              href="https://eips.ethereum.org/EIPS/eip-2535"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              EIP-2535
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
