# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Shopware Admin MCP (Model Context Protocol) server that runs on Cloudflare Workers. It provides MCP tools for managing Shopware products through Claude Desktop and other MCP clients. The server uses OAuth for authentication and integrates with Shopware's Admin API.

## Development Commands

- `npm run dev` / `npm start` - Start local development server with Wrangler
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run format` - Format code with Biome
- `npm run lint:fix` - Fix linting issues with Biome
- `npm run type-check` - Run TypeScript type checking
- `npm run cf-typegen` - Generate Cloudflare Workers types

## Architecture

### Core Components

- **src/index.ts** - Main entry point with OAuth provider setup
- **src/mcp/index.ts** - MCP server implementation with Shopware tools
- **src/app-server.ts** - Hono web server with Shopware app lifecycle hooks
- **src/shopware.ts** - Shopware client management and HTTP connection handling

### Key Features

The MCP server provides these tools:
- `product_list` - Search and paginate products
- `product_get` - Get detailed product information
- `product_create` - Create new products with pricing and tax
- `product_update` - Update existing product properties

### Data Flow

1. Shopware app installation triggers OAuth token generation
2. Tokens stored in Cloudflare KV for authentication
3. MCP client connects using generated auth token
4. Tools access Shopware Admin API via app credentials

### Dependencies

- Uses Shopware App Server SDK for admin API integration
- Cloudflare Workers OAuth Provider for authentication
- MCP SDK for protocol implementation
- Hono for web framework
- Biome for linting and formatting

## Configuration

- **wrangler.jsonc** - Cloudflare Workers configuration with KV bindings
- **biome.json** - Code formatting (4 spaces, 100 line width) and linting rules
- Environment variables: APP_SECRET, APP_URL required for Shopware integration
- KV namespaces: shopStorage (shop data), OAUTH_KV (auth tokens)

## Local Development

The server runs on `http://localhost:8787/sse` in development mode. For Claude Desktop integration, use the mcp-remote proxy or configure HTTP transport directly.