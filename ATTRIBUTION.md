# Attribution

Obligation-First builds on a substantial body of prior work. This file credits the standards, projects, and individuals whose work makes this schema possible.

## Upper ontology

- **Semantic Arts gist** (CC-BY 4.0) — the upper ontology Obligation-First binds to. Maintained by Dave McComb and the Semantic Arts team. https://semanticarts.com/gist/

## Source-text standards

- **Akoma Ntoso** (OASIS LegalDocML) — XML standard for parliamentary, legislative, and judicial documents. https://docs.oasis-open.org/legaldocml/
- **European Legislation Identifier (ELI)** — EU Council recommendation for stable URI schemes for legislation
- **European Case Law Identifier (ECLI)** — EU Council recommendation for stable URI schemes for case law
- **United States Legislative Markup (USLM)** — US House schema for the US Code

## Deontic logic and rules

- **LegalRuleML 1.0** (OASIS) — deontic operator standard. https://docs.oasis-open.org/legalruleml/
- **Sarah Lawsky** — "Formalizing the Code" (2017), "A Logic for Statutes" (2018). Default-logic foundations for defeasible statutory reasoning.

## Rules-as-code

- **Catala** (INRIA / PROSECCO, Denis Merigoux et al.) — DSL for executable statutory rules. https://catala-lang.org/
- **Blawx** (Lexpedite Legal Technology, Jason Morris) — s(CASP)-based legal reasoning with Blockly UI.
- **OpenFisca** — French rules-as-code framework for benefits and tax simulation.

## Adjacent projects

- **AI Incident Database (AIID)** by Responsible AI Collaborative — the most-cited AI incident registry. https://incidentdatabase.ai/
- **OECD AI Policy Observatory** — international AI policy data. https://oecd.ai/
- **MIT AI Risk Repository** — risk-categorized incident collection.

## Pattern lineage

The four-role spine (Authority / Container / Secondary / Primary) was first introduced in **PubLedge** (PAICE.work PBC, 2026). Obligation-First lifts and generalizes the spine and adds the proceeding strand.

The integrity pattern (SHA-256 manifest, validate-hashes.sh) is adapted from **skill-provenance** (https://skillprovenance.dev/).

## Acknowledgments

This schema would not exist without decades of work by legal informatics researchers, parliamentary IT teams, and standards bodies — most of whom we have never met. Errors and oversimplifications in this spec are ours alone.
