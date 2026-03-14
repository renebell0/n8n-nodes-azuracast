# Changelog

All notable changes to this project will be documented in this file.

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
