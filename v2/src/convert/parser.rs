use anyhow::{Context, Result};
use solang_parser::pt::*;

#[derive(Debug)]
pub struct ContractInfo {
    pub name: String,
    pub pragma: String,
    pub license: String,
    pub state_vars: Vec<StateVar>,
    pub functions: Vec<FunctionInfo>,
    pub events: Vec<String>,
    pub errors: Vec<String>,
    pub constructor: Option<ConstructorInfo>,
    pub structs: Vec<String>,
    pub enums: Vec<String>,
}

#[derive(Debug)]
pub struct StateVar {
    pub name: String,
    pub type_str: String,
    pub is_constant: bool,
    pub is_immutable: bool,
}

#[derive(Debug)]
pub struct FunctionInfo {
    pub name: String,
    pub visibility: String,
    pub mutability: Option<String>,
    pub params_source: String,
    pub returns_source: String,
    pub body_source: String,
    pub has_owner_guard: bool,
}

#[derive(Debug)]
pub struct ConstructorInfo {
    pub params_source: String,
    pub body_source: String,
}

fn loc_text<'a>(source: &'a str, loc: &Loc) -> &'a str {
    match loc {
        Loc::File(_, start, end) => &source[*start..*end],
        _ => "",
    }
}

pub fn parse_contract(source: &str) -> Result<ContractInfo> {
    let (unit, _diagnostics) = solang_parser::parse(source, 0)
        .map_err(|diags| {
            let msgs: Vec<String> = diags.iter().map(|d| d.message.clone()).collect();
            anyhow::anyhow!("Solidity parse errors:\n  {}", msgs.join("\n  "))
        })?;

    let pragma = unit
        .0
        .iter()
        .find_map(|part| {
            if let SourceUnitPart::PragmaDirective(directive) = part {
                let loc = match directive.as_ref() {
                    PragmaDirective::Identifier(loc, _, _) => loc,
                    PragmaDirective::StringLiteral(loc, _, _) => loc,
                    PragmaDirective::Version(loc, _, _) => loc,
                };
                Some(loc_text(source, loc).to_string())
            } else {
                None
            }
        })
        .unwrap_or_else(|| "pragma solidity ^0.8.0;".to_string());

    let license = source
        .lines()
        .find(|line| line.contains("SPDX-License-Identifier"))
        .map(|l| l.to_string())
        .unwrap_or_else(|| "// SPDX-License-Identifier: MIT".to_string());

    let contract = unit
        .0
        .iter()
        .find_map(|part| {
            if let SourceUnitPart::ContractDefinition(def) = part {
                Some(def.as_ref())
            } else {
                None
            }
        })
        .context("No contract definition found in the input file")?;

    let name = contract
        .name
        .as_ref()
        .context("Contract has no name")?
        .name
        .clone();

    let mut state_vars = Vec::new();
    let mut functions = Vec::new();
    let mut events = Vec::new();
    let mut errors = Vec::new();
    let mut constructor = None;
    let mut structs = Vec::new();
    let mut enums = Vec::new();

    for part in &contract.parts {
        match part {
            ContractPart::VariableDefinition(var) => {
                let var_name = var
                    .name
                    .as_ref()
                    .map(|id| id.name.clone())
                    .unwrap_or_default();
                let type_str = loc_text(source, &var.ty.loc()).to_string();

                let is_constant = var
                    .attrs
                    .iter()
                    .any(|a| matches!(a, VariableAttribute::Constant(_)));
                let is_immutable = var
                    .attrs
                    .iter()
                    .any(|a| matches!(a, VariableAttribute::Immutable(_)));

                state_vars.push(StateVar {
                    name: var_name,
                    type_str,
                    is_constant,
                    is_immutable,
                });
            }
            ContractPart::FunctionDefinition(func) => match func.ty {
                FunctionTy::Constructor => {
                    let params_source = extract_params(source, &func.params);
                    let body_source = func
                        .body
                        .as_ref()
                        .map(|s| block_inner(source, &s.loc()))
                        .unwrap_or_default();

                    constructor = Some(ConstructorInfo {
                        params_source,
                        body_source,
                    });
                }
                FunctionTy::Function => {
                    let func_name = func
                        .name
                        .as_ref()
                        .map(|id| id.name.clone())
                        .unwrap_or_default();

                    let visibility = extract_visibility(&func.attributes);
                    let mutability = extract_mutability(&func.attributes);
                    let has_owner_guard = detect_owner_modifier(&func.attributes);

                    let params_source = extract_params(source, &func.params);
                    let returns_source = extract_returns(source, &func.returns);
                    let body_source = func
                        .body
                        .as_ref()
                        .map(|s| block_inner(source, &s.loc()))
                        .unwrap_or_default();

                    functions.push(FunctionInfo {
                        name: func_name,
                        visibility,
                        mutability,
                        params_source,
                        returns_source,
                        body_source,
                        has_owner_guard,
                    });
                }
                _ => {}
            },
            ContractPart::EventDefinition(evt) => {
                events.push(loc_text(source, &evt.loc).to_string());
            }
            ContractPart::ErrorDefinition(err) => {
                errors.push(loc_text(source, &err.loc).to_string());
            }
            ContractPart::StructDefinition(s) => {
                structs.push(loc_text(source, &s.loc).to_string());
            }
            ContractPart::EnumDefinition(e) => {
                enums.push(loc_text(source, &e.loc).to_string());
            }
            _ => {}
        }
    }

    Ok(ContractInfo {
        name,
        pragma,
        license,
        state_vars,
        functions,
        events,
        errors,
        constructor,
        structs,
        enums,
    })
}

fn extract_visibility(attrs: &[FunctionAttribute]) -> String {
    for attr in attrs {
        if let FunctionAttribute::Visibility(vis) = attr {
            return match vis {
                Visibility::External(_) => "external",
                Visibility::Public(_) => "public",
                Visibility::Internal(_) => "internal",
                Visibility::Private(_) => "private",
            }
            .to_string();
        }
    }
    "public".to_string()
}

fn extract_mutability(attrs: &[FunctionAttribute]) -> Option<String> {
    for attr in attrs {
        if let FunctionAttribute::Mutability(m) = attr {
            return Some(
                match m {
                    Mutability::Pure(_) => "pure",
                    Mutability::View(_) => "view",
                    Mutability::Payable(_) => "payable",
                    Mutability::Constant(_) => "view",
                }
                .to_string(),
            );
        }
    }
    None
}

fn detect_owner_modifier(attrs: &[FunctionAttribute]) -> bool {
    attrs.iter().any(|attr| {
        if let FunctionAttribute::BaseOrModifier(_, base) = attr {
            base.name
                .identifiers
                .iter()
                .any(|id| id.name.to_lowercase().contains("owner"))
        } else {
            false
        }
    })
}

fn extract_params(source: &str, params: &ParameterList) -> String {
    params
        .iter()
        .filter_map(|(_, param)| param.as_ref().map(|p| loc_text(source, &p.loc).to_string()))
        .collect::<Vec<_>>()
        .join(", ")
}

fn extract_returns(source: &str, returns: &ParameterList) -> String {
    if returns.is_empty() {
        return String::new();
    }
    returns
        .iter()
        .filter_map(|(_, param)| param.as_ref().map(|p| loc_text(source, &p.loc).to_string()))
        .collect::<Vec<_>>()
        .join(", ")
}

fn block_inner(source: &str, loc: &Loc) -> String {
    let text = loc_text(source, loc).trim();
    if text.starts_with('{') && text.ends_with('}') {
        text[1..text.len() - 1].to_string()
    } else {
        text.to_string()
    }
}
