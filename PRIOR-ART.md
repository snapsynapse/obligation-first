# Prior Art

A survey of the ontologies, schemas, registries, and rules-as-code projects that Obligation-First builds on, references, or learns from. Compiled 2026-05-04.

The headline finding: **no existing ontology bridges AI laws, AI incident cases, and regulatory agreements in a single schema.** Obligation-First fills this specific gap. Everything below is what already exists, what we bind to, and what we deliberately stay out of the way of.

## Upper ontologies

### Semantic Arts gist

The upper ontology Obligation-First binds to. Small (~150 classes), CC-BY 4.0, FIBO-adjacent. Provides foundational classes used throughout the spec: `gist:Organization`, `gist:Agreement`, `gist:Specification`, `gist:ContractTerm`, `gist:Requirement`, `gist:Restriction`, `gist:Permission`, `gist:Determination`, `gist:Content`, `gist:Intention`, and `gist:Event`. Obligation-First v0.6 defines `of:Jurisdiction` separately because legal competence may be territorial, institutional, or both.

- Home: https://semanticarts.com/gist/
- Vendored at `vendor/gist/`

### UFO-L, Core Legal Ontology (CLO), Estrella, Inferno

Academic deontic ontologies with normative primitives (obligation/permission/prohibition). Mostly unmaintained. Referenced as prior art; not binding targets.

## Source-text standards

### Akoma Ntoso (OASIS LegalDocML)

XML vocabulary for parliamentary, legislative, and judicial documents. OASIS Standard since 2018. Namespace `http://docs.oasis-open.org/legaldocml/ns/akn/3.0`. Used by the Italian Senate, Brazilian Congress, Kenya parliament, and a growing list of legislatures.

Obligation-First references Akoma Ntoso element IRIs as canonical source-text identifiers. We do not duplicate the schema.

- Spec: https://docs.oasis-open.org/legaldocml/akn-core/v1.0/akn-core-v1.0-part1-vocabulary.html

### European Legislation Identifier (ELI) and European Case Law Identifier (ECLI)

EU Council recommendations defining stable URI schemes for laws (ELI) and cases (ECLI). Each EU member state implements its own URI scheme bound to the recommendation. Obligation-First treats `eli:` and `ecli:` IRIs as valid `Instrument` and `Proceeding` identifiers when they exist.

### United States Legislative Markup (USLM)

The US House XML schema for the US Code (uscode.house.gov). Equivalent role to Akoma Ntoso for US federal law.

## Deontic logic and rules-as-rules

### LegalRuleML 1.0 (OASIS)

The OASIS standard for representing legal norms with explicit deontic operators: Obligation, Permission, Prohibition, Reparation. Handles defeasibility via `DefeasibleRule` and exception hierarchies (§7.4, §7.5).

Obligation-First's deontic quartet (`of:Requirement`, `of:Restriction`, `of:Permission`, `of:Reparation`) is aligned with LegalRuleML's four operators. Crosswalk in `reference/crosswalks/legalruleml.md`. v0.2 refines the gist binding for `of:Reparation` per Semantic Arts feedback (the layered pattern `gist:Requirement` + `gist:Intention` + `gist:Event`); the of: class itself is preserved. This refined binding is still the current binding through v0.3, which changed identifier federation and crosswalks, not the deontic gist bindings.

- Spec: https://docs.oasis-open.org/legalruleml/

### Sarah Lawsky — default logic for statutes

Lawsky's "Formalizing the Code" (2017) and "A Logic for Statutes" (2018) propose default logic — a nonmonotonic logic — to model defeasible statutory reasoning. Influential in computational-law research; not standardized.

The `of:defeats` predicate in Obligation-First is informed by Lawsky's framework. Lawsky's papers also motivate the design choice to represent statutes as defeasible inferences rather than monotonic implications.

- "Formalizing the Code" (2017): https://gwern.net/doc/law/2017-lawsky.pdf
- "A Logic for Statutes" (2018): https://scholarship.law.ufl.edu/ftr/vol21/iss1/2/

## Rules-as-code projects

### Catala (INRIA / PROSECCO)

A DSL for encoding statutory rules as executable code. Uses scopes that mirror legislative structure; supports general-rule + exceptions semantics natively. Compiles to OCaml/Python. Formal semantics proven correct in F*. Real statutes encoded: French family benefits, US Section 121 (capital gains exclusion), portions of the French tax code.

Obligation-First's `of:executableEncoding` predicate can reference a Catala scope as one of several supported encoding kinds.

- Home: https://catala-lang.org/
- Repo: https://github.com/CatalaLang/catala

### Blawx (Lexpedite Legal Technology)

The most production-active rules-as-code tool. Uses s(CASP) goal-directed answer set programming with Google Blockly for visual rule encoding. Canadian government pilots (Treasury Board Secretariat, PHAC Privacy Act demo). Run by Jason Morris.

- Discussion: https://oecd-opsi.org/innovations/new-techniques-for-building-and-using-legal-encodings-in-the-drafting-room/
- Demo: https://github.com/PHACDataHub/privacy_rac_demo

### OpenFisca

French rules-as-code framework for benefits and tax simulation. Programmer-oriented. Limited 2025-2026 signal in survey.

### US Cybersecurity Executive Order (2026)

The 2026 US cybersecurity executive order mandates federal agencies pilot Rules-as-Code for Cyber GRC by June 2026, with machine-readable supplier labels by January 2027. Not AI-specific but a major tailwind for the executable-rules layer.

## AI incident databases

### AI Incident Database (AIID, Responsible AI Collaborative)

The most-cited AI incident registry. Flat schema (~25 fields per incident) — Incident ID, Title, Summary, Date, Country, Sector(s), Deployer(s), Developer(s), System Name(s), Harm(s), Issue(s), Transparency. CSV/JSON exports. No formal ontology, no proceeding/determination layer, no obligation linkage.

Obligation-First is complementary: AIID's incidents are the raw input; Obligation-First's Proceeding/Allegation/Determination model is what turns an incident into a structured record connected to the laws it implicates.

- Home: https://incidentdatabase.ai/

### OECD AI Incidents Monitor

Aggregator with basic metadata. No formal schema.

### MIT AI Risk Repository

Risk-categorized incident collection. No formal ontology.

### AIAAIC

Aggregator highlighting inconsistencies across databases. Motivates the need for unified schemas.

### "Toward a Unified Schema for AI Incident Databases" (arxiv:2501.17037)

January 2026 paper proposing a unified incident schema. Incident-only; no obligations or proceedings. Validates the gap Obligation-First fills rather than filling it.

- Paper: https://arxiv.org/pdf/2501.17037

## Visualization and tracking tools

Strong tools exist for individual dimensions of legal/regulatory tracking — none integrate the way Obligation-First's spine + proceeding strand makes possible.

| Tool | Strength | Limit |
|---|---|---|
| Bloomberg Government | Bill status by chamber, geographic maps | Stops at "enacted"; no sunset/repeal |
| BillTrack50 / Quorum / FiscalNote / Plural | Real-time bill stage updates | Timelines, not state machines |
| Practical Law Quick Compare | Cross-jurisdictional comparison | Tables, not visual diffs |
| Westlaw AI Jurisdictional Surveys | Topic-specific comparison | Limited to commercial subscribers |
| CourtListener | Docket monitoring | Timelines, not branching state graphs |
| Lex Machina | Litigation analytics | Outcome statistics, not proceeding visualization |

Confirmed gaps: obligation networks (no dedicated tool), state machines that include sunset/repeal, true Sankey or subway diagrams for legislative flow, branching court proceeding graphs. Obligation-First's data model produces all of these naturally; tools to render them are downstream.

## Adjacent registries and identifiers

### Cornell LII Legal Information Institute (LRMI)

Educational legal-resource metadata. Reference target, not binding target.

### W3ID

Operated by W3C Permanent Identifier Community Group. Provides permanent, redirect-based IRIs at `https://w3id.org/`. Obligation-First plans to file a PR to mint `https://w3id.org/of/v1/` after the pre-v1.0 public surface is stable.

### Schema.org Legislation

`schema:Legislation` and related types. General-purpose. Obligation-First references but does not bind to schema.org.

## What is genuinely new in Obligation-First

After surveying the above:

1. **The integration of three layers** — statutes (spine), proceedings (strand), and joint interpretations (spine, in PubLedge's sense) in one schema. No prior art.
2. **The alleged-vs-determined distinction modeled as separate entity types** (`of:Allegation`, `of:Determination`) rather than as a status flag on a single Event. Avoids forcing premature factual classification.
3. **The polymorphic `of:executableEncoding`** that spans Catala, Blawx, OpenFisca, and future engines without privileging any one.
4. **The evidence-bearing Authority basis**: an Authority may cite one or more Instruments that support its competence, including charters, contracts, statutes, treaties, and judicial sources. When the source does not establish a basis, the field is omitted instead of inferred.

The rest of Obligation-First is a careful composition of existing standards. That is intentional: the goal is interoperability, not novelty for its own sake.
