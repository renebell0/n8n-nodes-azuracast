# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.1.8] - 2026-03-22

- Added runtime metadata overrides for AzuraCast actions missing request body schema in OpenAPI
- Added explicit body field UX for:
  - `adminSendTestEmail`
  - `postStationFilesMkdir`
  - `postStationFilesRename`
  - `putAdminDebugTelnetCommand`
  - `putStationFileBatchAction`
  - `putStationPlaylistOrder`
  - `postAdminDoBackup`
  - `postStationMediaWaveform`
  - `putAccountTwoFactor`
  - `putAccountWebAuthnRegister`
  - `putStationPlaylistApplyTo`
- Added JSON body input support in Auto mode for:
  - `putMe`
  - `putStationLiquidsoapConfig`
- Enforced masked input rendering for sensitive fields (for example `secret`)
- Expanded local simulation coverage for all new request-body overrides
- Improved real QA runner to auto-fill missing required body fields during test execution and classify known environment-limited read errors as expected

## [0.1.7] - 2026-03-22

- Added explicit `email` body field metadata for `adminSendTestEmail` (`POST /admin/send-test-message`)
- Marked `Send Test Email` email input as required in node UI
- Added local simulation coverage to verify `adminSendTestEmail` request payload handling

## [0.1.6] - 2026-03-21

- Standardized successful delete action output to `{ deleted: true }`
- Updated local simulation assertions for delete operations
- Updated README execution behavior notes for delete responses

## [0.1.5] - 2026-03-21

- Switched the project license from Apache-2.0 to MIT for n8n verification alignment
- Added CRUD-first operation naming refinements across all AzuraCast resources
- Added Resource Locator list search support for common path identifiers
- Added locator value extraction in runtime path parameter handling
- Improved output normalization for empty array and empty-body success responses
- Added item-level operation execution so each input item can resolve its own resource/action parameters
- Added structured continue-on-fail payloads with operation/resource/error metadata
- Expanded local simulation coverage for list search and locator-based execution
- Expanded local simulation with per-item mixed operations and continue-on-fail assertions

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
