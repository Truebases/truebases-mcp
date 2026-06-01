#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const TRUEBASES_API_URL =
  process.env.TRUEBASES_API_URL || "https://www.truebases.com";
const TRUEBASES_API_KEY = process.env.TRUEBASES_API_KEY || "";

if (!TRUEBASES_API_KEY) {
  console.error(
    "⚠️  TRUEBASES_API_KEY environment variable is not set. All API calls will fail."
  );
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

interface ApiResponse {
  success: boolean;
  data?: Record<string, unknown>[];
  meta?: { total: number; limit: number; offset: number };
  error?: string;
}

async function callApi(
  endpoint: string,
  params: Record<string, string | undefined>
): Promise<ApiResponse> {
  const url = new URL(`/api/v1/${endpoint}`, TRUEBASES_API_URL);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${TRUEBASES_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  const json = (await response.json()) as ApiResponse;
  return json;
}

// ---------------------------------------------------------------------------
// Format helpers — turn API data into readable text for the agent
// ---------------------------------------------------------------------------

function formatInvestors(data: Record<string, unknown>[]): string {
  if (data.length === 0) return "No investors found matching your criteria.";

  return data
    .map((inv, i) => {
      const lines: string[] = [`${i + 1}. **${inv.name || "Unknown"}**`];
      if (inv.type) lines.push(`   Type: ${inv.type}`);
      if (inv.website) lines.push(`   Website: ${inv.website}`);
      if (inv.hq) lines.push(`   HQ: ${inv.hq}`);
      if (inv.thesis) lines.push(`   Thesis: ${inv.thesis}`);
      if (Array.isArray(inv.regions) && inv.regions.length > 0)
        lines.push(`   Regions: ${inv.regions.join(", ")}`);
      if (Array.isArray(inv.stage) && inv.stage.length > 0)
        lines.push(`   Stages: ${inv.stage.join(", ")}`);
      if (inv.check_size_min || inv.check_size_max) {
        const min = inv.check_size_min
          ? `$${Number(inv.check_size_min).toLocaleString()}`
          : "?";
        const max = inv.check_size_max
          ? `$${Number(inv.check_size_max).toLocaleString()}`
          : "?";
        lines.push(`   Check Size: ${min} – ${max}`);
      }
      return lines.join("\n");
    })
    .join("\n\n");
}

function formatGrants(data: Record<string, unknown>[]): string {
  if (data.length === 0) return "No grants found matching your criteria.";

  return data
    .map((grant, i) => {
      const lines: string[] = [
        `${i + 1}. **${grant.grant_name || "Unknown"}**`,
      ];
      if (grant.organization) lines.push(`   By: ${grant.organization}`);
      if (grant.amount) lines.push(`   Amount: ${grant.amount}`);
      if (grant.location) lines.push(`   Location: ${grant.location}`);
      if (grant.description)
        lines.push(`   ${String(grant.description).slice(0, 200)}`);
      if (grant.url) lines.push(`   URL: ${grant.url}`);
      if (grant.deadline) lines.push(`   Deadline: ${grant.deadline}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

function formatPrograms(data: Record<string, unknown>[]): string {
  if (data.length === 0) return "No programs found matching your criteria.";

  return data
    .map((prog, i) => {
      const lines: string[] = [
        `${i + 1}. **${prog.program_name || "Unknown"}**`,
      ];
      if (prog.organization) lines.push(`   By: ${prog.organization}`);
      if (prog.description)
        lines.push(`   ${String(prog.description).slice(0, 200)}`);
      if (Array.isArray(prog.benefits) && prog.benefits.length > 0)
        lines.push(`   Benefits: ${prog.benefits.join(", ")}`);
      if (prog.commitment) lines.push(`   Commitment: ${prog.commitment}`);
      if (prog.url) lines.push(`   URL: ${prog.url}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

function formatAccelerators(data: Record<string, unknown>[]): string {
  if (data.length === 0)
    return "No accelerators/incubators found matching your criteria.";

  return data
    .map((acc, i) => {
      const lines: string[] = [`${i + 1}. **${acc.name || "Unknown"}**`];
      if (acc.type) lines.push(`   Type: ${acc.type}`);
      if (acc.website) lines.push(`   Website: ${acc.website}`);
      if (acc.hq) lines.push(`   HQ: ${acc.hq}`);
      if (acc.thesis) lines.push(`   Thesis: ${acc.thesis}`);
      if (Array.isArray(acc.regions) && acc.regions.length > 0)
        lines.push(`   Regions: ${acc.regions.join(", ")}`);
      if (Array.isArray(acc.stage) && acc.stage.length > 0)
        lines.push(`   Stages: ${acc.stage.join(", ")}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

function formatJobs(data: Record<string, unknown>[]): string {
  if (data.length === 0) return "No jobs found matching your criteria.";

  return data
    .map((job, i) => {
      const lines: string[] = [
        `${i + 1}. **${job.role || "Unknown Role"}** at **${job.company || "Unknown"}**`,
      ];
      if (job.location) lines.push(`   Location: ${job.location}`);
      if (job.experience) lines.push(`   Experience: ${job.experience}`);
      if (job.remote) lines.push(`   🏠 Remote`);
      if (job.url) lines.push(`   URL: ${job.url}`);
      if (job.posted_at) lines.push(`   Posted: ${job.posted_at}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "truebases",
  version: "1.0.0",
});

// ---- search_investors ----
server.tool(
  "search_investors",
  "Search for investors including VCs, angel investors, family offices, PE firms, corporate VCs, and more. Use this to find funding sources for startups.",
  {
    type: z
      .enum([
        "vc",
        "angel",
        "corporate-vc",
        "family-office",
        "pe",
        "startup-studio",
        "public-fund",
        "rbf",
      ])
      .optional()
      .describe(
        "Type of investor. Options: vc (venture capital), angel (angel investors & networks), corporate-vc, family-office, pe (private equity), startup-studio, public-fund, rbf (revenue-based financing)"
      ),
    region: z
      .string()
      .optional()
      .describe(
        'Geographic region to filter by (e.g. "USA", "India", "UK", "Germany", "Singapore")'
      ),
    stage: z
      .string()
      .optional()
      .describe(
        'Investment stage to filter by (e.g. "1. Idea or Patent", "2. Working Prototype", "3. Early Revenue", "4. Scaling")'
      ),
    q: z
      .string()
      .optional()
      .describe(
        'Free-text search query to match against investor name or thesis (e.g. "climate tech", "fintech", "health")'
      ),
    check_size_min: z
      .string()
      .optional()
      .describe("Minimum check size in USD (e.g. 50000)"),
    check_size_max: z
      .string()
      .optional()
      .describe("Maximum check size in USD (e.g. 500000)"),
    limit: z
      .string()
      .optional()
      .describe("Number of results to return (default 10, max 100)"),
  },
  async (params) => {
    try {
      const result = await callApi("investors", {
        type: params.type,
        region: params.region,
        stage: params.stage,
        q: params.q,
        check_size_min: params.check_size_min,
        check_size_max: params.check_size_max,
        limit: params.limit || "10",
      });

      if (!result.success) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${result.error || "Failed to search investors"}`,
            },
          ],
        };
      }

      const total = result.meta?.total || 0;
      const header = `Found ${total} investor(s). Showing ${result.data?.length || 0}:\n\n`;

      return {
        content: [
          {
            type: "text" as const,
            text: header + formatInvestors(result.data || []),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error calling TrueBases API: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// ---- search_grants ----
server.tool(
  "search_grants",
  "Search for startup grants and non-dilutive funding opportunities. Grants don't require giving up equity.",
  {
    location: z
      .string()
      .optional()
      .describe('Filter by location (e.g. "USA", "Europe", "Global")'),
    q: z
      .string()
      .optional()
      .describe(
        'Free-text search on grant name, organization, or description (e.g. "climate", "women founders", "AI")'
      ),
    limit: z
      .string()
      .optional()
      .describe("Number of results to return (default 10, max 100)"),
  },
  async (params) => {
    try {
      const result = await callApi("grants", {
        location: params.location,
        q: params.q,
        limit: params.limit || "10",
      });

      if (!result.success) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${result.error || "Failed to search grants"}`,
            },
          ],
        };
      }

      const total = result.meta?.total || 0;
      const header = `Found ${total} grant(s). Showing ${result.data?.length || 0}:\n\n`;

      return {
        content: [
          {
            type: "text" as const,
            text: header + formatGrants(result.data || []),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error calling TrueBases API: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// ---- search_programs ----
server.tool(
  "search_programs",
  "Search for startup programs that offer mentorship, resources, cloud credits, and other benefits.",
  {
    q: z
      .string()
      .optional()
      .describe(
        'Free-text search on program name, organization, or description (e.g. "AI", "cloud credits", "Microsoft")'
      ),
    limit: z
      .string()
      .optional()
      .describe("Number of results to return (default 10, max 100)"),
  },
  async (params) => {
    try {
      const result = await callApi("programs", {
        q: params.q,
        limit: params.limit || "10",
      });

      if (!result.success) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${result.error || "Failed to search programs"}`,
            },
          ],
        };
      }

      const total = result.meta?.total || 0;
      const header = `Found ${total} program(s). Showing ${result.data?.length || 0}:\n\n`;

      return {
        content: [
          {
            type: "text" as const,
            text: header + formatPrograms(result.data || []),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error calling TrueBases API: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// ---- search_accelerators ----
server.tool(
  "search_accelerators",
  "Search for startup accelerators and incubators. These programs offer mentorship, funding, and resources in exchange for equity.",
  {
    type: z
      .enum(["accelerator", "incubator"])
      .optional()
      .describe("Filter by accelerator or incubator"),
    region: z
      .string()
      .optional()
      .describe(
        'Geographic region to filter by (e.g. "USA", "India", "Europe")'
      ),
    stage: z
      .string()
      .optional()
      .describe('Stage filter (e.g. "1. Idea or Patent", "3. Early Revenue")'),
    q: z
      .string()
      .optional()
      .describe(
        'Free-text search on name or thesis (e.g. "YC", "health", "fintech")'
      ),
    limit: z
      .string()
      .optional()
      .describe("Number of results to return (default 10, max 100)"),
  },
  async (params) => {
    try {
      const result = await callApi("accelerators", {
        type: params.type,
        region: params.region,
        stage: params.stage,
        q: params.q,
        limit: params.limit || "10",
      });

      if (!result.success) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${result.error || "Failed to search accelerators"}`,
            },
          ],
        };
      }

      const total = result.meta?.total || 0;
      const header = `Found ${total} accelerator/incubator(s). Showing ${result.data?.length || 0}:\n\n`;

      return {
        content: [
          {
            type: "text" as const,
            text: header + formatAccelerators(result.data || []),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error calling TrueBases API: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// ---- search_jobs ----
server.tool(
  "search_jobs",
  "Search for startup and tech company jobs. Find roles at fast-growing companies.",
  {
    source: z
      .enum(["startup", "tech"])
      .optional()
      .describe(
        'Job source: "startup" for startup jobs, "tech" for big tech company jobs. Default is startup.'
      ),
    company: z
      .string()
      .optional()
      .describe('Filter by company name (e.g. "Google", "Stripe")'),
    role: z
      .string()
      .optional()
      .describe(
        'Filter by role title (e.g. "Engineer", "Product Manager", "Designer")'
      ),
    remote: z
      .enum(["true", "false"])
      .optional()
      .describe("Filter for remote jobs only"),
    q: z
      .string()
      .optional()
      .describe(
        'Free-text search on company or role (e.g. "machine learning", "frontend")'
      ),
    limit: z
      .string()
      .optional()
      .describe("Number of results to return (default 10, max 100)"),
  },
  async (params) => {
    try {
      const result = await callApi("jobs", {
        source: params.source,
        company: params.company,
        role: params.role,
        remote: params.remote,
        q: params.q,
        limit: params.limit || "10",
      });

      if (!result.success) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${result.error || "Failed to search jobs"}`,
            },
          ],
        };
      }

      const total = result.meta?.total || 0;
      const header = `Found ${total} job(s). Showing ${result.data?.length || 0}:\n\n`;

      return {
        content: [
          {
            type: "text" as const,
            text: header + formatJobs(result.data || []),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error calling TrueBases API: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("TrueBases MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
