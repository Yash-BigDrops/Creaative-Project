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

export async function extractCreativeText(
  uploadedFiles: UploadedFile[]
): Promise<string> {
  if (uploadedFiles.length === 0) return "";

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
          return ocrText;
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

      return cleanedText;

    } catch (error) {
      console.error("❌ Error processing HTML preview for OCR:", error);
      return "";
    }
  }

  if (file.file && file.file.type.startsWith("image/")) {
    try {
      if (file.file.size < 1024 || file.file.size > 50 * 1024 * 1024) {
        return "";
      }

      if (file.previewUrl) {
        const result = await Tesseract.recognize(file.previewUrl, "eng", {
          logger: (m) => console.log("OCR:", m.status)
        });
        const extractedText = result.data.text || "";
        return extractedText;
      }

      const result = await Tesseract.recognize(file.file, "eng", {
        logger: (m) => console.log("OCR:", m.status),
      });
      const extractedText = result.data.text || "";
      return extractedText;

    } catch (error) {
      console.error("❌ Error extracting text from image:", error);
      return "";
    }
  }

  if (file.extractedContent) {
    return file.extractedContent;
  }

  return "";
}
