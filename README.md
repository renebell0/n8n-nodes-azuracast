# n8n-nodes-azuracast

![OpenAPI Coverage](https://img.shields.io/badge/OpenAPI%20coverage-263%2F263-2ea44f)
![n8n Community Node](https://img.shields.io/badge/n8n-community%20node-ff6d5a)
![Node API Version](https://img.shields.io/badge/n8n%20Nodes%20API-v1-0a7cff)
![License](https://img.shields.io/badge/license-MIT-6f42c1)

![n8n-nodes-azuracast](https://raw.githubusercontent.com/renebell0/assets/e1d64715e74d5a5dd3e694aca3cf019c761f7742/readme-images/n8n-nodes-azuracast.jpg)

`@renebello/n8n-nodes-azuracast` is an n8n community node that connects AzuraCast with n8n workflows through the official AzuraCast Web API.

[AzuraCast](https://www.azuracast.com/) is a self-hosted web radio platform for stations, media, playlists, requests, webhooks, reports, and admin operations. [n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Table of contents

- [Installation](#installation)
- [Operations](#operations)
- [Credentials](#credentials)
- [Compatibility](#compatibility)
- [Usage](#usage)
- [Workflow Examples](#workflow-examples)
- [Publish to npm](#publish-to-npm)
- [Resources](#resources)
- [Version history](#version-history)

## Installation

Follow the official [n8n community node installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

Package name:

```bash
@renebello/n8n-nodes-azuracast
```

## Operations

This package provides **one AzuraCast node** with operations organized by official API tag.

Inside the node, actions are grouped by resource/tag, for example:

- `Administration General`
- `Administration Users`
- `Public Now Playing`
- `Public Stations`
- `Stations Media`
- `Stations Playlists`
- `Stations Web Hooks`

Resources and actions are generated from the official AzuraCast OpenAPI source.

Current operation coverage in this repository:

- **263 / 263 operation IDs**

Request and response support:

- CRUD-first action labels per resource, plus advanced actions where applicable
- Resource Locator selectors for common IDs (stations, playlists, media, podcasts, webhooks, and more)
- Path parameters
- Query parameters
- JSON body
- Raw body
- Binary body
- Multipart form-data upload
- JSON response
- Text response
- Binary response

## Credentials

Create an **AzuraCast API** credential in n8n.

Credential fields:

- **Base URL**: for example `https://radio.example.com`
- **API Key**: your AzuraCast API key (optional for public endpoints)

The node resolves API base paths automatically. When an API key is set, requests include both `X-API-Key` and `Authorization: Bearer ...` headers. Public operations can run without a key, while protected operations require one.

Credential test behavior in n8n:

- Without API key: tests connectivity using a public endpoint.
- With API key: tests authentication using an authenticated account endpoint.

For advanced API authentication and endpoint behavior, see the official AzuraCast API documentation:

- [AzuraCast API docs](https://www.azuracast.com/docs/developers/apis/)

## Compatibility

- n8n community nodes API: `v1`
- Node package format: n8n community node package
- This node is intended for n8n v1-based installations

## Usage

Basic flow:

1. Add the **AzuraCast** node.
2. Select or create **AzuraCast API** credentials.
3. Choose a **Resource** (API domain/tag).
4. Choose an **Action**.
5. Select IDs from list pickers (or enter IDs manually) and fill required query/body inputs.
6. Execute the node.

Notes:

- The action selector is grouped by official AzuraCast API tags.
- Each action shows only the fields relevant to that specific endpoint.
- ID-heavy actions include Resource Locator pickers with list search to improve UX in n8n.
- Legacy workflows that use `operationId` and JSON parameter blocks remain supported.
- When AzuraCast updates its API, regenerate and verify operation coverage:
  - `npm run generate:operations`
  - `npm run verify:operations`

## Workflow Examples

### 1. Public now playing (no API key)

Use this when you only need current public playback data.

1. Add **AzuraCast** node.
2. Select **Resource**: `Public Now Playing`.
3. Select **Action**: `Get All Now Playing`.
4. Use credentials with only **Base URL**.
5. Execute and consume `{{$json.data}}`.

### 2. Create station webhook (authenticated)

Use this to register outbound events from AzuraCast.

1. Add **AzuraCast** node.
2. Select **Resource**: `Stations Web Hooks`.
3. Select **Action**: `Create Webhook`.
4. Set **Station** from the Resource Locator.
5. Fill webhook payload fields and execute.
6. Use `{{$json.data}}` as created webhook response.

### 3. Upload media file to a station

Use this to automate media ingestion from binary input.

1. Add a node that outputs binary audio in property `data`.
2. Add **AzuraCast** node.
3. Select **Resource**: `Stations Media`.
4. Select **Action**: `Upload File`.
5. Set **Station** with Resource Locator.
6. Keep binary property as `data` or set your custom property name.
7. Execute and check `{{$json.data}}` for upload result.

Execution behavior:

- Response wrapping is enabled by default and returns `{ success, data, operation }`.
- Delete actions return `{ deleted: true }` when successful.
- If **Continue On Fail** is enabled, failed items return structured error payloads with operation and resource context.

## Publish to npm

Pre-publish checklist:

1. Run `npm run validate:publish`
2. Confirm package contents with `npm run pack:check`
3. Confirm npm publish metadata with `npm run publish:dry-run`
4. Confirm action metadata rendering with `npm run verify:ui`

Package naming and discovery requirements for n8n:

- Package name starts with `n8n-nodes-` (or `@scope/n8n-nodes-...`)
- `keywords` includes `n8n-community-node-package`
- `package.json` includes an `n8n` block with built node and credential paths

Publishing options:

- Recommended release flow: `npm run release`
- Automated publish with provenance:
  - Create the repository secret `NPM_TOKEN` with publish permissions on npm
  - Push a tag like `v0.1.0` and let GitHub Actions run `.github/workflows/publish.yml`
- Direct publish flow: `npm run release:publish`
- If you use a scoped package name, publish with public access enabled

Versioning:

- Patch: `npm version patch`
- Minor: `npm version minor`
- Major: `npm version major`

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [n8n node development documentation](https://docs.n8n.io/integrations/creating-nodes/)
- [AzuraCast API documentation](https://www.azuracast.com/docs/developers/apis/)
- [AzuraCast official OpenAPI source](https://raw.githubusercontent.com/AzuraCast/AzuraCast/main/web/static/openapi.yml)

## Version history

### 0.1.9

- Wrapped runtime API failures in `NodeApiError` for clearer n8n error details in the UI
- Updated grouped resource labels to singular display names aligned with n8n UX guidance
- Expanded local verification to cover resource labels and thrown API error behavior

### 0.1.8

- Added explicit body-field UX for AzuraCast actions with missing request schema in OpenAPI, including file management, backups, waveform cache, account security, and playlist apply actions
- Added Auto-mode JSON request body support for actions that require free-form JSON payloads (`putMe`, `putStationLiquidsoapConfig`)
- Added masked input rendering for sensitive fields such as `secret`
- Expanded local simulation and real QA tooling to validate these payload mappings and classify environment-limited read-only errors correctly

### 0.1.7

- Fixed **Administration General → Send Test Email** by exposing required `Email` input
- Added runtime metadata override for AzuraCast `adminSendTestEmail` to send `email` in request body
- Expanded local simulation to validate `Send Test Email` payload handling

### 0.1.6

- Standardized successful delete action output to `{ deleted: true }`
- Updated local simulation coverage for delete operation output assertions

### 0.1.5

- Replaced the multi-node domain package layout with a single `AzuraCast` node
- Grouped actions inside the node by official AzuraCast API tags/resources
- Refined action naming to a CRUD-first UX style with concise operation labels
- Added Resource Locator list search for common path IDs across station and admin resources
- Added runtime handling for locator values and empty-success responses in execute output
- Added structured continue-on-fail payloads with operation/resource/error metadata
- Kept backward compatibility for legacy `operationId` and JSON parameter workflows

### 0.1.1

- Domain-based node architecture (one node per official AzuraCast API domain/tag)
- Shared execution runtime for consistent request/response behavior across all domain nodes

### 0.1.0

- Initial public version
- Full OpenAPI operation coverage for AzuraCast (`263/263`)
- Local simulation tooling for request/response verification
