# TrueBases MCP Server

An open-source [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that gives AI agents access to TrueBases data intelligence.

> **What is TrueBases?** [TrueBases](https://www.truebases.com) is the data intelligence platform. We help teams to find opportunities, track market activity, and make better decisions using real-time data from across the internet.

## What can agents do with this?

Ask your AI assistant things like:
- *"Find me seed investors in climate tech"*
- *"What grants are available for AI startups?"*
- *"Show me accelerator programs in Europe"*
- *"Find remote startup jobs for engineers"*
- *"Which VCs invest in health tech at Series A?"*

The agent calls TrueBases MCP tools under the hood and returns real data.

---

## Available Tools

| Tool | Description |
|---|---|
| `search_investors` | Search VCs, angels, family offices, PE firms, corporate VCs, startup studios |
| `search_grants` | Find startup grants and non-dilutive funding |
| `search_programs` | Find startup programs (cloud credits, mentorship, etc.) |
| `search_accelerators` | Find accelerators & incubators |
| `search_jobs` | Find startup and tech company jobs |

---

## ⚡ Quick Setup

### 1. Get an API Key

Request an API key at [truebases.com](https://www.truebases.com) (or email the team).

### 2. Install / Run

You can run the server directly via `npx` (recommended) or install it globally.

#### Run with `npx` (No installation required)

**Claude Desktop Configuration:**
Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "truebases": {
      "command": "npx",
      "args": ["-y", "truebases-mcp"],
      "env": {
        "TRUEBASES_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**Cursor Configuration:**
Add a new MCP server in Cursor settings:
* **Name**: truebases
* **Type**: command
* **Command**: `npx -y truebases-mcp`
* **Environment Variables**: `TRUEBASES_API_KEY=your-api-key-here`

---

#### Install globally (Alternative)

```bash
npm install -g truebases-mcp
```

**Claude Desktop Configuration:**
```json
{
  "mcpServers": {
    "truebases": {
      "command": "truebases-mcp",
      "env": {
        "TRUEBASES_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

---

## 🔧 Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `TRUEBASES_API_KEY` | ✅ | — | Your TrueBases API key |
| `TRUEBASES_API_URL` | ❌ | `https://www.truebases.com` | API base URL (for self-hosting or dev) |

---

## Development

```bash
# Clone
git clone https://github.com/Truebases/truebases-mcp.git
cd truebases-mcp

# Install
npm install

# Run in dev mode
TRUEBASES_API_KEY=your-key npm run dev

# Build
npm run build

# Run built version
TRUEBASES_API_KEY=your-key npm start
```

---

## Tool Reference

### `search_investors`

Search for investors by type, region, stage, thesis, or check size.

**Parameters:**
| Param | Type | Description |
|---|---|---|
| `type` | string | `vc`, `angel`, `corporate-vc`, `family-office`, `pe`, `startup-studio`, `public-fund`, `rbf` |
| `region` | string | e.g. `"USA"`, `"India"`, `"Germany"` |
| `stage` | string | e.g. `"1. Idea or Patent"`, `"3. Early Revenue"` |
| `q` | string | Free-text search (e.g. `"climate tech"`, `"fintech"`) |
| `check_size_min` | string | Min check size in USD |
| `check_size_max` | string | Max check size in USD |
| `limit` | string | Results count (default 10, max 100) |

### `search_grants`

Find non-dilutive funding opportunities.

**Parameters:**
| Param | Type | Description |
|---|---|---|
| `location` | string | e.g. `"USA"`, `"Global"` |
| `q` | string | Free-text search |
| `limit` | string | Results count |

### `search_programs`

Find startup programs with cloud credits, mentorship, etc.

**Parameters:**
| Param | Type | Description |
|---|---|---|
| `q` | string | Free-text search |
| `limit` | string | Results count |

### `search_accelerators`

Find accelerator and incubator programs.

**Parameters:**
| Param | Type | Description |
|---|---|---|
| `type` | string | `accelerator` or `incubator` |
| `region` | string | Geographic region |
| `stage` | string | Startup stage |
| `q` | string | Free-text search |
| `limit` | string | Results count |

### `search_jobs`

Find startup and tech company jobs.

**Parameters:**
| Param | Type | Description |
|---|---|---|
| `source` | string | `startup` or `tech` |
| `company` | string | Company name filter |
| `role` | string | Role title filter |
| `remote` | string | `"true"` for remote only |
| `q` | string | Free-text search |
| `limit` | string | Results count |

---

## Contributing

PRs welcome! Please open an issue first for major changes.

## License

[MIT](LICENSE) — Built with ❤️ by [TrueBases](https://www.truebases.com)
