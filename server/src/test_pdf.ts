import { createCanvas } from '@napi-rs/canvas';
import * as fs from 'fs';
import * as path from 'path';

// We require pdfjs-dist legacy build
const pdfjs = require('pdfjs-dist/legacy/build/pdf.mjs');

class NodeCanvasFactory {
  create(width: number, height: number) {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    return { canvas, context };
  }

  reset(canvasAndContext: any, width: number, height: number) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  destroy(canvasAndContext: any) {
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

async function testPdf() {
  console.log('Testing PDF.js page rendering...');
  try {
    const pdfPath = path.join(__dirname, '../dummy.pdf');
    console.log('Loading PDF from:', pdfPath);
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    
    const loadingTask = pdfjs.getDocument({
      data,
      useSystemFonts: true,
      disableFontFace: false
    });
    
    const pdfDoc = await loadingTask.promise;
    console.log('PDF loaded. Total pages:', pdfDoc.numPages);
    
    const page = await pdfDoc.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 }); // Increase scale for quality
    console.log('Viewport width:', viewport.width, 'height:', viewport.height);
    
    const canvasFactory = new NodeCanvasFactory();
    const { canvas, context } = canvasFactory.create(viewport.width, viewport.height);
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
      canvasFactory: canvasFactory,
    };
    
    await page.render(renderContext).promise;
    console.log('Page rendered to canvas context successfully');
    
    const webpBuffer = await canvas.toBuffer('image/webp');
    console.log('WebP buffer size:', webpBuffer.length);
    
    const outputPath = path.join(__dirname, '../dummy-page-1.webp');
    fs.writeFileSync(outputPath, webpBuffer);
    console.log('Output image saved to:', outputPath);
    
  } catch (err) {
    console.error('Error during test:', err);
  }
}

testPdf();
