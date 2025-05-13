import svg2img from 'svg2img';
import { promisify } from 'util';
import sharp from 'sharp';
import * as fs from 'fs';

// Direct import to handle TypeScript issues
const svg2imgModule = require('svg2img');

// Create type-safe wrapper for svg2img
function convertSvgToPng(svgContent: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    svg2imgModule(svgContent, {
      format: 'png',
      quality: 100,
      width: 800,
      height: 600
    }, (error: Error | null, buffer: Buffer) => {
      if (error) {
        reject(error);
      } else {
        resolve(buffer);
      }
    });
  });
}

/**
 * Service to handle conversion of SVG to PNG for email embedding
 */
export default {
  /**
   * Convert SVG content to PNG and return a data URL
   * @param svgContent The SVG content as string
   * @returns Promise<string> Data URL of the PNG image
   */
  async svgToPngDataUrl(svgContent: string): Promise<string> {
    try {
      // Fix potential issues with SVG content
      const cleanedSvg = this.cleanupSvgContent(svgContent);
      
      // Use our wrapper function to convert SVG to PNG buffer
      const pngBuffer = await convertSvgToPng(cleanedSvg);
      
      // Use sharp to optimize the PNG
      const optimizedBuffer = await sharp(pngBuffer)
        .png({ quality: 90 })
        .toBuffer();
      
      // Convert to base64
      const pngBase64 = optimizedBuffer.toString('base64');
      
      // Return data URL
      return `data:image/png;base64,${pngBase64}`;
    } catch (error) {
      console.error('Error converting SVG to PNG:', error);
      
      // In case of error, create a fallback image with error message
      try {
        // Create an SVG with error message
        const errorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100">
          <rect width="400" height="100" fill="#f8f8f8" stroke="#ccc" />
          <text x="20" y="50" font-family="Arial" font-size="14" fill="#666">
            [Image unavailable - Please check online version]
          </text>
        </svg>`;
        
        // Try to convert the error SVG to PNG
        const errorPngBuffer = await convertSvgToPng(errorSvg);
        const errorBase64 = errorPngBuffer.toString('base64');
        return `data:image/png;base64,${errorBase64}`;
      } catch (fallbackError) {
        // If even the fallback fails, return empty data
        return '';
      }
    }
  },
  
  /**
   * Clean up SVG content to fix common issues that might cause conversion problems
   * @param svgContent SVG content as string
   * @returns Cleaned SVG content
   */
  cleanupSvgContent(svgContent: string): string {
    // Make sure SVG has width and height attributes
    if (!svgContent.includes('width=') || !svgContent.includes('height=')) {
      // Extract viewBox values if available
      const viewBoxMatch = svgContent.match(/viewBox=["']([\d\s.]+)["']/i);
      if (viewBoxMatch && viewBoxMatch[1]) {
        const [, , width, height] = viewBoxMatch[1].split(/\s+/).map(Number);
        
        // Insert width and height attributes if they're missing
        svgContent = svgContent.replace(/<svg/i, `<svg width="${width}" height="${height}"`);
      }
    }
    
    // Ensure SVG has proper XML namespace
    if (!svgContent.includes('xmlns="http://www.w3.org/2000/svg"')) {
      svgContent = svgContent.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    
    return svgContent;
  },

  /**
   * Extract SVG content from HTML
   * @param html HTML content that may contain SVG tags
   * @returns Array of extracted SVG content strings
   */
  extractSvgContent(html: string): string[] {
    const svgRegex = /<svg[^>]*>[\s\S]*?<\/svg>/gi;
    return html.match(svgRegex) || [];
  },

  /**
   * Process HTML content with SVG, replacing SVG with embedded PNG images
   * @param html HTML content that may contain SVG tags
   * @returns Promise<string> Processed HTML with SVG replaced by PNG data URLs
   */
  async processSvgInHtml(html: string): Promise<string> {
    if (!html) return html;
    
    try {
      // Extract all SVG tags
      const svgTags = this.extractSvgContent(html);
      if (svgTags.length === 0) return html;

      let processedHtml = html;
      
      // Process each SVG tag
      for (const svgTag of svgTags) {
        try {
          // Convert SVG to PNG data URL
          const pngDataUrl = await this.svgToPngDataUrl(svgTag);
          
          // Replace SVG with an img tag containing the PNG data URL
          processedHtml = processedHtml.replace(
            svgTag,
            `<img src="${pngDataUrl}" alt="Graph or diagram" style="max-width: 100%; height: auto;" />`
          );
        } catch (err) {
          console.error('Error processing individual SVG:', err);
          // If conversion fails, replace with a placeholder message
          processedHtml = processedHtml.replace(
            svgTag,
            `<div style="padding: 10px; border: 1px solid #ccc; background-color: #f9f9f9; margin: 10px 0;">
              <p><strong>[Image]</strong> A graphical element is available in the online version.</p>
            </div>`
          );
        }
      }
      
      return processedHtml;
    } catch (error) {
      console.error('Error processing SVG in HTML:', error);
      return html; // Return original HTML if processing fails
    }
  }
};