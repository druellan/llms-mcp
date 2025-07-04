#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import llmsTxtResources from './resources/llms-txt-resources.js';

const PROJECT_PATH = process.env.ProjectPath;
if (!PROJECT_PATH) {
  console.warn('Warning: Could not determine project path.');
}

let cachedResources = [];

// Scan resources at startup
async function scanResources() {
  try {
    const resources = await llmsTxtResources.listResources(PROJECT_PATH);
    cachedResources = resources;
  } catch (error) { }
}

const server = new Server(
  {
    name: "llms-mcp",
    version: "1.0.0",
    description: "MCP server for exposing llms.txt files as resources",
    usage: "This server provides access to llms.txt files that help LLMs understand project context and documentation."
  },
  {
    capabilities: {
      resources: {}
    }
  }
);

// Handle resource listing - return cached resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: cachedResources
  };
});

// Handle resource reading
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  try {
    // Handle all resource types (file://, http://, https://)
    const content = await llmsTxtResources.readResource(uri);
    
    return {
      contents: [content]
    };
  } catch (error) {
    throw new Error(`Failed to read resource: ${error.message}`);
  }
});

// Start the server
async function runServer() {
  const isTestMode = process.argv.includes('--test');
  console.log(`Starting llms-mcp server in ${isTestMode ? 'test' : 'normal'} mode...`);
  // Scan resources first
  await scanResources();
  if (isTestMode) {
    console.log('llms-mcp Server Test Mode');
    console.log(`Project directory: ${PROJECT_PATH || 'Not set'}`);
    if (cachedResources.length === 0) {
      console.log('No resources found. Please check your project structure.');
    } else {
      console.log('Scanned resources:');
      cachedResources.forEach(resource => {
        console.log(`- ${resource.name} (${resource.uri}): ${resource.description}`);
      });
    }
    console.log('Server test completed.');
    process.exit(0);
  }
  
  // Start the MCP server
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
