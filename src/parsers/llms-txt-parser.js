import { promises as fs } from 'fs';
import path from 'path';

/**
 * Parser for llms.txt files to extract referenced files and URLs
 */
class LlmsTxtParser {
  /**
   * Get metadata for an llms.txt file
   * @param {string} filePath
   * @returns {Object} Metadata object
   */
  getMetadata(filePath) {
    return {
      name: path.basename(filePath),
      description: 'Project context file for AI assistance'
    };
  }

  /**
   * Parse llms.txt content to extract referenced files and URLs
   * @param {string} content
   * @param {string} projectPath
   * @returns {Promise<Object>} Parsed content with references
   */
  async parseContent(content, projectPath) {
    const fileReferences = [];
    const urlReferences = [];

    // Match markdown links: [text](file://path) or [text](http://url)
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = markdownLinkRegex.exec(content)) !== null) {
      const linkText = match[1];
      const linkUrl = match[2];

      if (linkUrl.startsWith('file://')) {
        const filePath = linkUrl.replace('file://', '');
        fileReferences.push({
          text: linkText,
          path: filePath,
          originalUrl: linkUrl
        });
      } else if (linkUrl.startsWith('http://') || linkUrl.startsWith('https://')) {
        urlReferences.push({
          text: linkText,
          url: linkUrl
        });
      }
    }

    // Also match plain file:// URLs not in markdown format
    const fileUrlRegex = /file:\/\/([^\s)]+)/g;
    while ((match = fileUrlRegex.exec(content)) !== null) {
      const filePath = match[1];
      const fullMatch = match[0];

      // Skip if already found in markdown links
      // const alreadyFound = fileReferences.some(ref => ref.originalUrl === fullMatch);
      // if (!alreadyFound) {
      //   fileReferences.push({
      //     text: path.basename(filePath),
      //     path: filePath,
      //     originalUrl: fullMatch
      //   });
      // }
    }

    return {
      fileReferences,
      urlReferences
    };
  }

  /**
   * Process parsed references into MCP resources
   * @param {Object} parsedContent
   * @param {string} projectPath
   * @returns {Array} Array of MCP resource objects
   */
  processResources(parsedContent, projectPath) {
    const resources = [];
    const seenUris = new Set(); // Track URIs to prevent duplicates

    // Process file references
    for (const fileRef of parsedContent.fileReferences) {
      let resolvedPath;
      
      // Handle relative paths starting with ./
      if (fileRef.path.startsWith('./')) {
        resolvedPath = path.resolve(projectPath, fileRef.path.substring(2));
      } else if (fileRef.path.startsWith('/')) {
        // Absolute path
        resolvedPath = fileRef.path;
      } else {
        // Relative to project root
        resolvedPath = path.resolve(projectPath, fileRef.path);
      }

      const uri = `file:///${resolvedPath.replace(/\\/g, '/')}`;
      
      // Skip if we've already seen this URI
      if (seenUris.has(uri)) {
        continue;
      }
      seenUris.add(uri);

      resources.push({
        uri,
        name: fileRef.text,
        description: `Referenced file: ${fileRef.path}`,
        mimeType: this.getMimeType(path.extname(resolvedPath))
      });
    }

    // Process URL references
    for (const urlRef of parsedContent.urlReferences) {
      // Skip if we've already seen this URI
      if (seenUris.has(urlRef.url)) {
        continue;
      }
      seenUris.add(urlRef.url);

      resources.push({
        uri: urlRef.url,
        name: urlRef.text,
        description: `External URL: ${urlRef.url}`,
        mimeType: 'text/html'
      });
    }

    return resources;
  }

  /**
   * Get MIME type based on file extension
   * @param {string} ext - File extension (with dot)
   * @returns {string} MIME type
   */
  getMimeType(ext) {
    const mimeTypes = {
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.js': 'text/javascript',
      '.ts': 'text/typescript',
      '.json': 'application/json',
      '.html': 'text/html',
      '.css': 'text/css',
      '.py': 'text/x-python',
      '.yml': 'text/yaml',
      '.yaml': 'text/yaml',
      '.xml': 'text/xml'
    };

    return mimeTypes[ext.toLowerCase()] || 'text/plain';
  }
}

export default new LlmsTxtParser();