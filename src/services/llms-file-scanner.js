import { promises as fs } from 'fs';
import path from 'path';

/**
 * Detecting llms.txt files in project root
 */
class LlmsFileScanner {
  /**
   * Scan for llms.txt files in the project root directory
   * @param {string} projectPath
   * @returns {Promise<string|null>} Absolute path to llms.txt file if found, null otherwise
   */
  async scanForLlmsTxt(projectPath) {
    if (!projectPath) {
      return null;
    }

    try {
      const stats = await fs.stat(projectPath);
      if (!stats.isDirectory()) {
        return null;
      }
    } catch (error) {
      return null;
    }

    const llmsTxtPath = path.join(projectPath, 'llms.txt');
    try {
      const stats = await fs.stat(llmsTxtPath);
      if (stats.isFile()) {
        return path.resolve(llmsTxtPath);
      }
    } catch (error) {
      // File not found or other error
    }

    return null;
  }
}

export default new LlmsFileScanner();