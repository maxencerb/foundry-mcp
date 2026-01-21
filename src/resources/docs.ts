import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../utils/types.ts";

const FOUNDRY_DOCS_URL = "https://getfoundry.sh/llms-full.txt";
const FOUNDRY_DOCS_BASE = "https://getfoundry.sh";

// Cache for documentation to avoid repeated fetches
let docsCache: { content: string; timestamp: number } | null = null;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

async function fetchDocs(): Promise<string> {
  // Check cache
  if (docsCache && Date.now() - docsCache.timestamp < CACHE_TTL) {
    return docsCache.content;
  }

  try {
    const response = await fetch(FOUNDRY_DOCS_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch docs: ${response.status}`);
    }
    const content = await response.text();

    // Update cache
    docsCache = { content, timestamp: Date.now() };

    return content;
  } catch (error) {
    if (docsCache) {
      // Return stale cache on error
      return docsCache.content;
    }
    throw error;
  }
}

export function registerDocsResources(server: McpServer, _context: ToolContext) {
  // foundry://docs - Full official documentation
  server.registerResource(
    "foundry_docs",
    "foundry://docs",
    {
      description: `Official Foundry documentation fetched from ${FOUNDRY_DOCS_URL}. Use this for the most up-to-date information about Foundry commands and features.`,
      mimeType: "text/plain",
    },
    async () => {
      try {
        const content = await fetchDocs();
        return {
          contents: [
            {
              uri: "foundry://docs",
              text: content,
              mimeType: "text/plain" as const,
            },
          ],
        };
      } catch (error) {
        return {
          contents: [
            {
              uri: "foundry://docs",
              text: `Failed to fetch documentation: ${error instanceof Error ? error.message : String(error)}\n\nYou can access the documentation directly at:\n- Full LLM docs: ${FOUNDRY_DOCS_URL}\n- Web docs: ${FOUNDRY_DOCS_BASE}`,
              mimeType: "text/plain" as const,
            },
          ],
        };
      }
    }
  );

  // foundry://docs/links - Documentation links
  server.registerResource(
    "foundry_docs_links",
    "foundry://docs/links",
    {
      description: "Links to official Foundry documentation pages",
      mimeType: "application/json",
    },
    async () => {
      const links = {
        main: FOUNDRY_DOCS_BASE,
        llm_full: FOUNDRY_DOCS_URL,
        sections: {
          forge: `${FOUNDRY_DOCS_BASE}/forge`,
          cast: `${FOUNDRY_DOCS_BASE}/cast`,
          anvil: `${FOUNDRY_DOCS_BASE}/anvil`,
          chisel: `${FOUNDRY_DOCS_BASE}/chisel`,
          reference: {
            forge: `${FOUNDRY_DOCS_BASE}/forge/reference`,
            cast: `${FOUNDRY_DOCS_BASE}/cast/reference`,
            anvil: `${FOUNDRY_DOCS_BASE}/anvil/reference`,
            cheatcodes: `${FOUNDRY_DOCS_BASE}/cheatcodes`,
          },
        },
        note: "For the most accurate and up-to-date information, always refer to the official documentation or use the help tools (forge_help, cast_help, anvil_help, chisel_help) to get CLI documentation directly.",
      };

      return {
        contents: [
          {
            uri: "foundry://docs/links",
            text: JSON.stringify(links, null, 2),
            mimeType: "application/json" as const,
          },
        ],
      };
    }
  );
}
