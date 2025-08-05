import JSZip from "jszip";
import { ExtractedCreative } from "@/types/creative";
import { ACCEPTED_IMAGE_EXTENSIONS, MAX_ZIP_DEPTH, RESPONSIVE_STYLE, DEFAULT_HTML_TEMPLATE } from "@/constants/creative";

export const isImageFile = (file: File): boolean => {
  const fileName = file.name.toLowerCase();
  if (file.type && file.type.startsWith("image/")) {
    return true;
  }
  return ACCEPTED_IMAGE_EXTENSIONS.some((ext) => fileName.endsWith(ext));
};

export const normalizePath = (p: string) => p.replace(/\\/g, "/").toLowerCase();

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export async function extractCreativesFromZip(
  zipBlob: Blob,
  depth = 0
): Promise<ExtractedCreative[]> {
  if (depth > MAX_ZIP_DEPTH) return [];

  const jszip = new JSZip();
  const zipData = await jszip.loadAsync(zipBlob);
  let creatives: ExtractedCreative[] = [];
  
  console.log(`📦 ZIP contains ${Object.keys(zipData.files).length} files:`);
  const allFiles = Object.keys(zipData.files);
  allFiles.forEach(file => {
    console.log(`  - ${file}`);
  });
  
  // Count files by type
  const htmlFiles = allFiles.filter(f => normalizePath(f).endsWith('.html'));
  const imageFiles = allFiles.filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(normalizePath(f)));
  const zipFiles = allFiles.filter(f => normalizePath(f).endsWith('.zip'));
  const otherFiles = allFiles.filter(f => !normalizePath(f).endsWith('.html') && !/\.(png|jpg|jpeg|gif|webp)$/i.test(normalizePath(f)) && !normalizePath(f).endsWith('.zip'));
  
  console.log(`📊 File breakdown:`, {
    total: allFiles.length,
    html: htmlFiles.length,
    image: imageFiles.length,
    zip: zipFiles.length,
    other: otherFiles.length
  });

  // Process all files in the ZIP as individual creatives
  let processedCount = 0;
  for (const [path, entry] of Object.entries(zipData.files)) {
    if (entry.dir) {
      console.log(`📁 Skipping directory: ${path}`);
      continue;
    }
    const lowerPath = normalizePath(path);

    console.log(`📄 Processing file ${processedCount + 1}: ${path}`);

    // Handle HTML files - extract as original content
    if (lowerPath.endsWith(".html")) {
      const htmlContent = await entry.async("string");
      // Create a simple URL for the HTML content without creating a new Blob
      const url = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
      creatives.push({ type: "html", url, htmlContent });
      console.log(`✅ Added HTML creative: ${path}`);
      processedCount++;
    }
    // Handle image files - extract as original blob
    else if (/\.(png|jpg|jpeg|gif|webp)$/i.test(lowerPath)) {
      const originalBlob = await entry.async("blob");
      // Use the original blob directly without creating a new one
      const url = URL.createObjectURL(originalBlob);
      creatives.push({ type: "image", url });
      console.log(`✅ Added image creative: ${path}`);
      processedCount++;
    }
    // Handle nested ZIP files - extract recursively
    else if (lowerPath.endsWith(".zip")) {
      const innerBlob = await entry.async("blob");
      const innerCreatives: ExtractedCreative[] =
        await extractCreativesFromZip(innerBlob, depth + 1);
      creatives = creatives.concat(innerCreatives);
      console.log(`✅ Added ${innerCreatives.length} nested ZIP creatives from: ${path}`);
      processedCount++;
    }
    // Skip other file types
    else {
      console.log(`⏭️ Skipping unsupported file type: ${path}`);
    }
  }
  
  console.log(`📊 Processed ${processedCount} files, created ${creatives.length} creatives`);

  console.log(
    `📊 ZIP processing complete: ${creatives.length} creatives extracted`
  );
  console.log(
    `📊 Breakdown: ${creatives.filter((c) => c.type === "html").length} HTML creatives, ${creatives.filter((c) => c.type === "image").length} image creatives`
  );

  return creatives;
} 