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

const getDirectoryPath = (filePath: string): string => {
  const normalizedPath = normalizePath(filePath);
  const lastSlashIndex = normalizedPath.lastIndexOf('/');
  return lastSlashIndex > -1 ? normalizedPath.substring(0, lastSlashIndex) : '';
};

const getTopLevelDirectory = (filePath: string): string => {
  const normalizedPath = normalizePath(filePath);
  const firstSlashIndex = normalizedPath.indexOf('/');
  return firstSlashIndex > -1 ? normalizedPath.substring(0, firstSlashIndex) : '';
};

const isInRootDirectory = (filePath: string): boolean => {
  const normalizedPath = normalizePath(filePath);
  return !normalizedPath.includes('/');
};

const directoryOrParentHasHTML = (filePath: string, allFiles: string[]): boolean => {
  const normalizedPath = normalizePath(filePath);
  const pathParts = normalizedPath.split('/');
  
  for (let i = pathParts.length - 1; i >= 0; i--) {
    const currentDirPath = pathParts.slice(0, i).join('/');
    
    const hasHTMLInThisLevel = allFiles.some(file => {
      const fileDir = getDirectoryPath(file);
      const fileName = normalizePath(file);
      return fileDir === currentDirPath && fileName.endsWith('.html');
    });
    
    if (hasHTMLInThisLevel) {
      return true;
    }
  }
  
  return false;
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
  const allFiles = Object.keys(zipData.files).filter(path => !zipData.files[path].dir);
  allFiles.forEach(file => {
    console.log(`  - ${file}`);
  });
  
  const creativeGroups = new Map<string, string[]>();
  const rootFiles: string[] = [];
  
  allFiles.forEach(filePath => {
    if (isInRootDirectory(filePath)) {
      rootFiles.push(filePath);
    } else {
      const topLevelDir = getTopLevelDirectory(filePath);
      if (!creativeGroups.has(topLevelDir)) {
        creativeGroups.set(topLevelDir, []);
      }
      creativeGroups.get(topLevelDir)!.push(filePath);
    }
  });
  
  await processRootFiles(rootFiles, zipData, creatives);
  
  for (const [dirPath, dirFiles] of creativeGroups.entries()) {
    console.log(`📁 Processing creative group: ${dirPath} (${dirFiles.length} files)`);
    await processCreativeGroup(dirPath, dirFiles, zipData, creatives, allFiles);
  }
  
  const htmlFiles = allFiles.filter(f => normalizePath(f).endsWith('.html'));
  const imageFiles = allFiles.filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(normalizePath(f)));
  const zipFiles = allFiles.filter(f => normalizePath(f).endsWith('.zip')); 
  return creatives;
}

async function processRootFiles(
  files: string[], 
  zipData: JSZip, 
  creatives: ExtractedCreative[]
): Promise<void> {
  const htmlFiles = files.filter(f => normalizePath(f).endsWith('.html'));
  const imageFiles = files.filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(normalizePath(f)));
  const zipFiles = files.filter(f => normalizePath(f).endsWith('.zip'));
  
  for (const htmlPath of htmlFiles) {
    try {
      const entry = zipData.files[htmlPath];
      const htmlContent = await entry.async("string");
      const url = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
      creatives.push({ type: "html", url, htmlContent });
    } catch (error) {
      console.error(`  ❌ Error processing HTML file ${htmlPath}:`, error);
    }
  }
  
  if (htmlFiles.length === 0) {
    for (const imagePath of imageFiles) {
      try {
        const entry = zipData.files[imagePath];
        const originalBlob = await entry.async("blob");
        const url = URL.createObjectURL(originalBlob);
        creatives.push({ type: "image", url });
      } catch (error) {
        console.error(`  ❌ Error processing image file ${imagePath}:`, error);
      }
    }
  } else {
  }
  
  for (const zipPath of zipFiles) {
    try {
      const entry = zipData.files[zipPath];
      const innerBlob = await entry.async("blob");
      const innerCreatives = await extractCreativesFromZip(innerBlob, 1);
      creatives.push(...innerCreatives);
    } catch (error) {
      console.error(`  ❌ Error processing ZIP file ${zipPath}:`, error);
    }
  }
}

async function processCreativeGroup(
  groupName: string,
  files: string[], 
  zipData: JSZip, 
  creatives: ExtractedCreative[],
  allFiles: string[]
): Promise<void> {
  const htmlFiles = files.filter(f => normalizePath(f).endsWith('.html'));
  const imageFiles = files.filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(normalizePath(f)));
  const zipFiles = files.filter(f => normalizePath(f).endsWith('.zip'));
  
  
  const uniqueDirs = new Set(files.map(f => getDirectoryPath(f)));
  uniqueDirs.forEach(dir => {
    const filesInDir = files.filter(f => getDirectoryPath(f) === dir);
  });
  
  if (htmlFiles.length > 0) {
    
    for (const htmlPath of htmlFiles) {
      try {
        const entry = zipData.files[htmlPath];
        const htmlContent = await entry.async("string");
        
        let processedHtmlContent = await embedImagesInHTML(htmlContent, imageFiles, zipData, groupName);
        
        const url = `data:text/html;charset=utf-8,${encodeURIComponent(processedHtmlContent)}`;
        creatives.push({ type: "html", url, htmlContent: processedHtmlContent });
      } catch (error) {
        console.error(`  ❌ Error processing HTML file ${htmlPath}:`, error);
      }
    }
  } else {
    for (const imagePath of imageFiles) {
      try {
        const entry = zipData.files[imagePath];
        const originalBlob = await entry.async("blob");
        const url = URL.createObjectURL(originalBlob);
        creatives.push({ type: "image", url });
      } catch (error) {
        console.error(`  ❌ Error processing image file ${imagePath}:`, error);
      }
    }
  }
  
  for (const zipPath of zipFiles) {
    try {
      const entry = zipData.files[zipPath];
      const innerBlob = await entry.async("blob");
      const innerCreatives = await extractCreativesFromZip(innerBlob, 1);
      creatives.push(...innerCreatives);
    } catch (error) {
      console.error(`  ❌ Error processing ZIP file ${zipPath}:`, error);
    }
  }
}

async function embedImagesInHTML(
  htmlContent: string, 
  imageFiles: string[], 
  zipData: JSZip, 
  groupName: string
): Promise<string> {
  let processedHTML = htmlContent;
  
  async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  
  for (const imagePath of imageFiles) {
    try {
      const entry = zipData.files[imagePath];
      const imageBlob = await entry.async("blob");
      
      const dataUrl = await blobToBase64(imageBlob);
      
      const fileName = imagePath.split('/').pop()!;
      
      const possibleRefs = [
        fileName,
        `./${fileName}`,
        `../${fileName}`,
        imagePath,
        `images/${fileName}`,
        `./images/${fileName}`,
        `../images/${fileName}`
      ];
      
      possibleRefs.forEach(ref => {
        const escapedRef = ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        processedHTML = processedHTML.replace(
          new RegExp(`src=["']${escapedRef}["']`, 'gi'),
          `src="${dataUrl}"`
        );
        
        processedHTML = processedHTML.replace(
          new RegExp(`background-image:\\s*url\\(["']?${escapedRef}["']?\\)`, 'gi'),
          `background-image: url(${dataUrl})`
        );
      });
      
    } catch (error) {
      console.error(`    ❌ Failed to embed image ${imagePath}:`, error);
    }
  }
  
  return processedHTML;
}

function getImageMimeType(filePath: string): string {
  const extension = normalizePath(filePath).split('.').pop();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'image/png';
  }
}
