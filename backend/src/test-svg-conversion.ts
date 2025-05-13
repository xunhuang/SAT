import imageConversionService from './services/imageConversionService';
import fs from 'fs';
import path from 'path';

// A simple SVG for testing
const testSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">
  <rect width="200" height="100" fill="#f0f0f0" stroke="#000" />
  <text x="20" y="50" font-family="Arial" font-size="16" fill="#333">
    Test SVG to PNG
  </text>
</svg>`;

async function testConversion() {
  try {
    console.log('Testing SVG to PNG conversion...');
    
    // Convert simple SVG to PNG
    const dataUrl = await imageConversionService.svgToPngDataUrl(testSvg);
    console.log('Conversion successful! Data URL length:', dataUrl.length);
    
    // Save the result to a file for inspection
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const outputPath = path.join(__dirname, 'test-output.png');
    fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'));
    console.log(`Output saved to: ${outputPath}`);
    
    // Now test HTML with embedded SVG
    const htmlWithSvg = `<div>
      <h1>Test Document</h1>
      <p>This is a test with embedded SVG:</p>
      ${testSvg}
      <p>End of document</p>
    </div>`;
    
    const processedHtml = await imageConversionService.processSvgInHtml(htmlWithSvg);
    console.log('HTML processing successful!');
    console.log('Processed HTML:', processedHtml.substring(0, 150) + '...');
    
    // Save the processed HTML to a file
    const htmlOutputPath = path.join(__dirname, 'test-output.html');
    fs.writeFileSync(htmlOutputPath, processedHtml);
    console.log(`HTML output saved to: ${htmlOutputPath}`);
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testConversion();