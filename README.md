# Shopware Admin MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with direct access to Shopware's Admin API for product management tasks.

## Features

- **Product Management**: List, search, create, and update products with media support
- **Category Management**: List, create, update, and delete categories (supports bulk operations)
- **Sales Channel Management**: List sales channels for product visibility
- **Media Management**: Upload media from URLs for product images
- **Shopware Integration**: Native integration with Shopware Admin API

## Available MCP Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `product_list` | Search and paginate products | `page`, `term` (optional) |
| `product_get` | Get detailed product information | `id` |
| `product_create` | Create new products with pricing and media | `name`, `productNumber`, `description`, `taxRate`, `stock`, `netPrice`, `grossPrice`, `active` (optional), `visibilities` (optional), `categories` (optional), `media` (optional) |
| `product_update` | Update existing products | `id`, `active` (optional), `name` (optional), `description` (optional), `stock` (optional), `visibilities` (optional), `categories` (optional), `media` (optional) |
| `category_list` | List all categories | None |
| `category_create` | Create categories (supports bulk) | `categories` (array with `name`, `parentId` optional, `active` optional) |
| `category_update` | Update categories (supports bulk) | `categories` (array with `id`, `name` optional, `parentId` optional, `active` optional) |
| `category_delete` | Delete categories | `ids` (array of category IDs) |
| `sales_channel_list` | List all sales channels | None |
| `upload_media_by_url` | Upload media from URL | `url`, `fileName` |

## Prerequisites

- Shopware 6 instance with admin access
- Node.js 22+ for development

## Installation

Create a Integration in Shopware Admin with permission to create, read, update, delete products.

Set following environment variables:

- `SHOPWARE_API_URL`: URL of your Shopware instance (e.g., `https://your-shopware-instance.com`)
- `SHOPWARE_API_CLIENT_ID`: Client ID of the created integration
- `SHOPWARE_API_CLIENT_SECRET`: Client Secret of the created integration

## Usage

### With mcp.json

Add the following configuration to your mcp.json file:

```json
{
  "mcpServers": {
    "shopware-admin-mcp": {
      "command": "npx",
      "args": ["-y", "@shopware-ag/admin-mcp"],
      "env": {
        "SHOPWARE_API_URL": "https://your-shopware-instance.com",
        "SHOPWARE_API_CLIENT_ID": "your-integration-client-id",
        "SHOPWARE_API_CLIENT_SECRET": "your-integration-client-secret"
      }
    }
  }
}
```

## Development

### Local Development

```bash
# Start local development server in stdio mode
npm run dev
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

## Permissions

| Entity                  | Read | Create | Update | Delete |
|--------------------------|------|--------|--------|--------|
| **Product**              | ✅   | ✅     | ✅     | ✅     |
| Product Translation      | ✅   | ✅     | ✅     | ✅     |
| Product Visibility       | ✅   | ✅     | ✅     | ✅     |
| Product Category         | ✅   | ✅     | ✅     | ✅     |
| Product Media            | ✅   | ✅     | ✅     | ✅     |
| **Category**             | ✅   | ✅     | ✅     | ✅     |
| Category Translation     | ✅   | ✅     | ✅     | ✅     |
| **Sales Channel**        | ✅   | ✅     | ✅     | ✅     |
| **Media**                | ✅   | ✅     | ✅     | ✅     |
| Media Default Folder     | ✅   | ✅     | ✅     | ✅     |
| Media Folder             | ✅   | ✅     | ✅     | ✅     |
| **Tax**                  | ✅   | ✅     | ✅     | ✅     |
| **Theme**                | ✅   | ✅     | ✅     | ✅     |
| Theme Translation        | ✅   | ✅     | ✅     | ✅     |
| Theme Media              | ✅   | ✅     | ✅     | ✅     |
| Theme Sales Channel      | ✅   | ✅     | ✅     | ✅     |

## License

MIT License - see LICENSE file for details.

## Support

For issues and feature requests, please use the GitHub issue tracker.
