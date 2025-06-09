import llmsFileScanner from '../services/llms-file-scanner.js';
import llmsTxtParser from '../parsers/llms-txt-parser.js';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Resource handler for llms.txt files and their referenced content
 */
class LlmsTxtResources {
  /**
   * Get a list of available llms.txt resources and their referenced files/URLs
   * @param {string} projectPath
   * @returns {Promise<Array>} List of available resources
   */
  async listResources(projectPath) {
    try {
      const llmsTxtFilePath = await llmsFileScanner.scanForLlmsTxt(projectPath);
      
      if (!llmsTxtFilePath) {
        return [];
      }

      const resources = [];
      
      // Add the main llms.txt file as a resource
      const metadata = llmsTxtParser.getMetadata(llmsTxtFilePath);
      resources.push({
        uri: `file:///${llmsTxtFilePath.replace(/\\/g, '/')}`,
        name: metadata.name,
        description: metadata.description,
        mimeType: 'text/plain'
      });
      
      try {
        const content = await fs.readFile(llmsTxtFilePath, 'utf8');
        const parsedContent = await llmsTxtParser.parseContent(content, projectPath);
        const referencedResources = llmsTxtParser.processResources(parsedContent, projectPath);

        const filteredResources = referencedResources.filter(resource => 
          resource.uri !== `file:///${llmsTxtFilePath.replace(/\\/g, '/')}`
        );
        
        resources.push(...filteredResources);
      } catch (parseError) {
        console.warn(`Warning: Failed to parse llms.txt content: ${parseError.message}`);
      }
      
      return resources;
    } catch (error) {
      throw new Error(`Failed to list llms.txt resources: ${error.message}`);
    }
  }

  /**
   * Read the content of a specific resource
   * @param {string} uri
   * @returns {Promise<Object>} Resource content
   */
  async readResource(uri) {
    try {
      if (uri.startsWith('file:///')) {
        return await this.readFileResource(uri);
      } else if (uri.startsWith('http://') || uri.startsWith('https://')) {
        return await this.readUrlResource(uri);
      } else {
        throw new Error(`Unsupported resource URI scheme: ${uri}`);
      }
    } catch (error) {
      throw new Error(`Failed to read resource: ${error.message}`);
    }
  }

  /**
   * Read a local file resource
   * @param {string} uri
   * @returns {Promise<Object>} File resource content
   */
  async readFileResource(uri) {
    if (!uri.startsWith('file:///')) {
      throw new Error('Invalid file resource URI');
    }

    const filepath = uri.replace('file:///', '').replace(/\//g, path.sep);
    
    try {
      const content = await fs.readFile(filepath, 'utf8');
      const ext = path.extname(filepath);
      const mimeType = llmsTxtParser.getMimeType(ext);
      
      return {
        uri,
        mimeType,
        text: content
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`File not found: ${filepath}`);
      } else if (error.code === 'EACCES') {
        throw new Error(`Access denied: ${filepath}`);
      } else {
        throw new Error(`Failed to read file: ${error.message}`);
      }
    }
  }

  /**
   * Read an external URL resource
   * @param {string} uri
   * @returns {Promise<Object>} URL resource content
   */
  async readUrlResource(uri) {
    try {
      // Use built-in fetch API (Node.js 18+)
      const response = await fetch(uri, {
        method: 'GET',
        headers: {
          'User-Agent': 'llms-mcp/1.0.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || 'text/plain';
      const text = await response.text();

      return {
        uri,
        mimeType: contentType.split(';')[0], // Remove charset info
        text
      };
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {

        return {
          uri,
          mimeType: 'text/plain',
          text: `URL content not available: ${uri}\n\nReason: Fetch API not available. This requires Node.js 18+ or a fetch polyfill.`
        };
      } else {
        throw new Error(`Failed to fetch URL: ${error.message}`);
      }
    }
  }
}

export default new LlmsTxtResources();