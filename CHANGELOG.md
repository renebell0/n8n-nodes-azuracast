# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.1.2] - 2026-03-17

- Replaced the multi-node domain layout with a single `AzuraCast` node in n8n
- Grouped actions by official AzuraCast API tags/resources inside that single node
- Added action-level endpoint fields from OpenAPI metadata (path/query/body)
- Reorganized node internals into `properties` and `execute` modules for maintainability
- Standardized operation/action labels for clean n8n UI display (no path-style artifacts)
- Added UI metadata verification for resource/action rendering integrity before publish
- Preserved backward compatibility for legacy `operationId` and JSON parameter workflows

## [0.1.1] - 2026-03-14

- Replaced the universal node with domain-based nodes aligned to official AzuraCast API tags
- Added generated domain manifest and node generation tooling
- Added shared execution runtime for consistent request/response behavior across all domain nodes
- Extended verification to validate domain coverage, generated files, and package node registration

## [0.1.0] - 2026-03-14

- Initial public release
- Full AzuraCast OpenAPI operation coverage (`263/263`)
- Public and protected endpoint credential handling
- Local simulation coverage for JSON, binary, multipart, redirect, and auth behavior
