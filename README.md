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
5. Fill required path/query/body inputs.
6. Execute the node.

Notes:

- The action selector is grouped by official AzuraCast API tags.
- Each action shows only the fields relevant to that specific endpoint.
- Legacy workflows that use `operationId` and JSON parameter blocks remain supported.
- When AzuraCast updates its API, regenerate and verify operation coverage:
  - `npm run generate:operations`
  - `npm run verify:operations`

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

### Unreleased

- Replaced the multi-node domain package layout with a single `AzuraCast` node
- Grouped actions inside the node by official AzuraCast API tags/resources
- Added operation-specific field rendering per action (path/query/body from OpenAPI metadata)
- Kept backward compatibility for legacy `operationId` and JSON parameter workflows

### 0.1.1

- Domain-based node architecture (one node per official AzuraCast API domain/tag)
- Shared execution runtime for consistent request/response behavior across all domain nodes

### 0.1.0

- Initial public version
- Full OpenAPI operation coverage for AzuraCast (`263/263`)
- Local simulation tooling for request/response verification
