# Shopware Admin MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with direct access to Shopware's Admin API for product management tasks. Built on Cloudflare Workers with OAuth authentication.

## Features

- **Product Management**: List, search, create, and update products
- **Secure Authentication**: OAuth-based authentication with token management
- **Shopware Integration**: Native integration with Shopware Admin API
- **Claude Desktop Support**: Direct integration with Claude Desktop and other MCP clients
- **Serverless Deployment**: Runs on Cloudflare Workers for global scalability

## Available MCP Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `product_list` | Search and paginate products | `page`, `term` (optional) |
| `product_get` | Get detailed product information | `id` |
| `product_create` | Create new products with pricing | `name`, `productNumber`, `description`, `taxRate`, `stock`, `netPrice`, `grossPrice` |
| `product_update` | Update existing products | `id`, `active`, `name`, `description` |

## Prerequisites

- Shopware 6 instance with admin access
- Cloudflare account with Workers enabled
- Node.js 24+ for development

## Installation

- Download the latest release from the [releases page](https://github.com/shopware/SwagAdminMCP/releases).
- Upload the zip to your Shopware Shop (**Shop needs to be externally accessible**)
- Go to Extensions -> Admin MCP Configuration
- Configure your desired Chat to use the MCP


## Usage

### With Claude Desktop

Add the following configuration to your Claude Desktop config file:

```json
{
  "mcpServers": {
    "shopware": {
      "transport": {
        "type": "http",
        "url": "https://shopware-admin-mcp.shopware-db5.workers.dev/sse"
      }
    }
  }
}
```

### With Other MCP Clients

Use the HTTP transport with:
- **URL**: `https://shopware-admin-mcp.shopware-db5.workers.dev/sse`
- **Authentication**: OAuth flow via `/authorize` endpoint

## Development

### Local Development

```bash
# Start local development server
npm run dev

# The server will be available at http://localhost:8787/sse
```

### Code Quality

```bash
# Format code
npm run format

# Fix linting issues
npm run lint:fix

# Run type checking
npm run type-check
```

### Testing

The MCP server can be tested locally using:

```bash
# Start development server
npm run dev

# In another terminal, test with an MCP client
# The local server will be at http://localhost:8787/sse
```

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   MCP Client    │────│  Cloudflare      │────│   Shopware      │
│  (Claude, etc.) │    │   Workers        │    │   Admin API     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                       ┌──────────────┐
                       │ Cloudflare   │
                       │      KV      │
                       │  (Auth & Shop│
                       │    Storage)  │
                       └──────────────┘
```

### Key Components

- **OAuth Provider**: Handles authentication flow between MCP clients and Shopware
- **MCP Server**: Implements Model Context Protocol with Shopware-specific tools
- **App Server**: Manages Shopware app lifecycle (installation, activation, etc.)
- **Shop Repository**: Manages shop credentials and connection information

## Permissions

The Shopware app requires the following permissions:
- Product: read, create, update, delete
- Product Translation: read, create, update, delete  
- Sales Channel: read, create, update, delete
- Tax: read, create, update, delete

## Configuration

### Shopware App Manifest

The app manifest (`SwagAdminMCP/manifest.xml`) defines:
- Webhook endpoints for app lifecycle events
- Required permissions for Admin API access
- Admin panel integration for configuration

### Cloudflare Workers

Configuration in `wrangler.jsonc` includes:
- KV namespace bindings for data storage
- Durable Objects for MCP server instances
- Environment variable bindings

## License

MIT License - see LICENSE file for details.

## Support

For issues and feature requests, please use the GitHub issue tracker.
