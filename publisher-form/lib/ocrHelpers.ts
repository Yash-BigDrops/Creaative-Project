import Tesseract from "tesseract.js";

type UploadedFile = {
  file: File;
  previewUrl: string | null;
  originalUrl?: string;
  zipImages?: string[];
  currentImageIndex?: number;
  isHtml?: boolean;
  extractedContent?: string;
};

export type OCRWord = { text: string; bbox: { x0: number; y0: number; x1: number; y1: number } };
export type OCRResult = { text: string; words: OCRWord[]; width: number; height: number };

// Tesseract result types
type TesseractWord = { text: string; bbox: { x0: number; y0: number; x1: number; y1: number } };
type TesseractResult = { 
  text: string; 
  words?: TesseractWord[]; 
  imageDims?: { width: number; height: number };
  lines?: Array<{ baseline?: { x1: number } }>;
};

export async function extractCreativeText(
  uploadedFiles: UploadedFile[]
): Promise<string> {
  const result = await extractCreativeWithBoxes(uploadedFiles);
  return result.text;
}

export async function extractCreativeWithBoxes(
  uploadedFiles: UploadedFile[]
): Promise<OCRResult> {
  if (uploadedFiles.length === 0) return { text: "", words: [], width: 0, height: 0 };

  const file = uploadedFiles[0];

  console.log("Extracting text from file:", {
    name: file.file?.name || 'Unknown',
    type: file.file?.type || 'Unknown',
    size: file.file?.size ? `${(file.file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
    isHtml: file.isHtml || false,
    hasPreviewUrl: !!file.previewUrl,
    hasExtractedContent: !!file.extractedContent,
  });

  if (file.isHtml && file.previewUrl) {
    try {
      const response = await fetch(file.previewUrl);
      const html = await response.text();

      const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
      const imageUrl = imgMatch?.[1];

      if (imageUrl && imageUrl.startsWith("http")) {
        const ocrResult = await Tesseract.recognize(imageUrl, "eng", {
          logger: (m) => console.log("OCR progress:", m.status),
        });
        const ocrText = ocrResult.data.text.trim();
        if (ocrText.length > 0) {
          return { text: ocrText, words: [], width: 0, height: 0 };
        }
      }

      const cleanedText = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/h[1-6]>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();

      return { text: cleanedText, words: [], width: 0, height: 0 };

    } catch (error) {
      console.error("❌ Error processing HTML preview for OCR:", error);
      return { text: "", words: [], width: 0, height: 0 };
    }
  }

  if (file.file && file.file.type.startsWith("image/")) {
    try {
      if (file.file.size < 1024 || file.file.size > 50 * 1024 * 1024) {
        return { text: "", words: [], width: 0, height: 0 };
      }

      if (file.previewUrl) {
        const result = await Tesseract.recognize(file.previewUrl, "eng", {
          logger: (m) => console.log("OCR:", m.status)
        });
        const extractedText = result.data.text || "";
        const tesseractData = result.data as TesseractResult;
        const words = tesseractData.words?.map((w) => ({
          text: w.text,
          bbox: { x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1 }
        })) || [];
        const width = tesseractData.imageDims?.width ?? tesseractData.lines?.[0]?.baseline?.x1 ?? 0;
        const height = tesseractData.imageDims?.height ?? 0;
        return { text: extractedText, words, width, height };
      }

      const result = await Tesseract.recognize(file.file, "eng", {
        logger: (m) => console.log("OCR:", m.status),
      });
      const extractedText = result.data.text || "";
      const tesseractData = result.data as TesseractResult;
      const words = tesseractData.words?.map((w) => ({
        text: w.text,
        bbox: { x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1 }
      })) || [];
      const width = tesseractData.imageDims?.width ?? tesseractData.lines?.[0]?.baseline?.x1 ?? 0;
      const height = tesseractData.imageDims?.height ?? 0;
      return { text: extractedText, words, width, height };
    } catch (error) {
      console.error("❌ Error extracting text from image:", error);
      return { text: "", words: [], width: 0, height: 0 };
    }
  }

  if (file.extractedContent) {
    return { text: file.extractedContent, words: [], width: 0, height: 0 };
  }

  return { text: "", words: [], width: 0, height: 0 };
}
