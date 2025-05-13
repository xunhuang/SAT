# SVG to PNG Conversion for Email

This document explains how the SVG to PNG conversion service works for email notifications.

## Node.js Libraries

The image conversion service uses pure Node.js libraries instead of external system dependencies:

1. **svg2img**
   - A Node.js library that converts SVG to PNG, JPEG or PDF
   - Works with both file paths and SVG content strings
   - No external system dependencies

2. **sharp**
   - High-performance image processing library for Node.js
   - Used to optimize the PNG images for email embedding
   - Reduces file size while maintaining quality

## Installation

All required dependencies are included in package.json and will be installed with npm:

```bash
npm install
```

No additional system-level dependencies are required, making deployment easier across different platforms.

## Implementation Details

The `imageConversionService.ts` provides three main functions:

1. **svgToPngDataUrl**:
   - Takes raw SVG content as input
   - Uses svg2img to convert SVG to a PNG buffer
   - Optimizes the PNG buffer using sharp
   - Encodes the buffer as a base64 data URL
   - Returns a complete data URL string for embedding in HTML

2. **cleanupSvgContent**:
   - Handles common issues with SVG content that might affect conversion
   - Ensures width and height attributes are present
   - Adds proper XML namespace if missing
   - Fixes other potential issues that could cause conversion errors

3. **extractSvgContent**:
   - Takes HTML content as input
   - Uses regex to extract all SVG tags
   - Returns an array of SVG strings

4. **processSvgInHtml**:
   - Takes HTML content with embedded SVG as input
   - Finds each SVG tag and converts it to a PNG
   - Replaces the SVG tags with img tags containing data URLs
   - Handles conversion failures gracefully

## Usage

The conversion happens automatically in the email controller when sending test attempt emails with wrong answers containing SVG content.

## Troubleshooting

If SVG conversion isn't working:

1. Check the Node.js version - svg2img requires Node.js 10 or higher

2. Look for detailed error messages in the server logs

3. For a specific SVG that isn't converting properly:
   - Check for malformed SVG content
   - Ensure it has proper height, width, and viewBox attributes
   - Try running the conversion manually with debugging

If conversion fails, a fallback message will be used instead of the image.