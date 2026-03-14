# n8n-nodes-azuracast

![OpenAPI Coverage](https://img.shields.io/badge/OpenAPI%20coverage-263%2F263-2ea44f)
![n8n Community Node](https://img.shields.io/badge/n8n-community%20node-ff6d5a)
![Node API Version](https://img.shields.io/badge/n8n%20Nodes%20API-v1-0a7cff)
![License](https://img.shields.io/badge/license-Apache%202.0-6f42c1)

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

This package provides one node: **AzuraCast**.

Operations are generated from the official AzuraCast OpenAPI source and exposed as selectable operation IDs inside the node.

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

1. Add the **AzuraCast** node to your workflow.
2. Select or create **AzuraCast API** credentials.
3. Choose an **Operation**.
4. Fill required path/query/body inputs.
5. Execute the node.

Notes:

- Operation details and required payloads come from the OpenAPI-derived operation list.
- When AzuraCast updates its API, regenerate and verify operation coverage:
  - `npm run generate:operations`
  - `npm run verify:operations`

## Publish to npm

Pre-publish checklist:

1. Run `npm run validate:publish`
2. Confirm package contents with `npm run pack:check`
3. Confirm npm publish metadata with `npm run publish:dry-run`

Package naming and discovery requirements for n8n:

- Package name starts with `n8n-nodes-` (or `@scope/n8n-nodes-...`)
- `keywords` includes `n8n-community-node-package`
- `package.json` includes an `n8n` block with built node and credential paths

Publishing options:

- Recommended release flow: `npm run release`
- Automated publish with provenance: push a tag like `v0.1.0` and let GitHub Actions run `.github/workflows/publish.yml`
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

### 0.1.0

- Initial public version
- Full OpenAPI operation coverage for AzuraCast (`263/263`)
- Local simulation tooling for request/response verification
