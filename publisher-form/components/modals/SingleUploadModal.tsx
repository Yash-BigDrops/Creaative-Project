"use client";

import React from "react";
import Image from "next/image";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/theme-github";
import { UploadedFile } from "@/types/creative";
import { formatFileSize } from "@/utils/fileUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Maximize2, ChevronLeft, ChevronRight, FileText, Archive, Loader2, ShieldCheck, RefreshCw } from "lucide-react";
import { proofreadText } from "@/services/api";
import { extractCreativeText } from "@/lib/ocrHelpers";

interface SingleUploadModalProps {
  uploadedFiles: UploadedFile[];
  htmlCode: string;
  isCodeMaximized: boolean;
  isCodeMinimized: boolean;
  tempFileName: string;
  creativeNotes: string;
  modalFromLine: string;
  modalSubjectLines: string;
  previewImage: string | null;
  setPreviewImage: (url: string | null) => void;
  setHtmlCode: (code: string) => void;
  setIsCodeMaximized: (maximized: boolean) => void;
  setIsCodeMinimized: (minimized: boolean) => void;
  setTempFileName: (name: string) => void;
  setCreativeNotes: (notes: string) => void;
  setModalFromLine: (line: string) => void;
  setModalSubjectLines: (lines: string) => void;
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  handleFileSelect: (file: File) => void;
  openModal: (option: string) => void;
  closeModal: () => void;
  saveCreative: () => void;
  isFromMultiple?: boolean;
  setUploadType: (type: "single" | "multiple") => void;
  setEditingCreativeIndex: (index: number | null) => void;
  setFromSubjectNavigationContext?: (context: "direct" | "single" | "multiple" | null) => void;
}

export default function SingleUploadModal({
  uploadedFiles,
  htmlCode,
  isCodeMaximized,
  isCodeMinimized,
  tempFileName,
  creativeNotes,
  modalFromLine,
  modalSubjectLines,
  previewImage,
  setPreviewImage,
  setHtmlCode,
  setIsCodeMaximized,
  setIsCodeMinimized,
  setTempFileName,
  setCreativeNotes,
  setModalFromLine,
  setModalSubjectLines,
  setUploadedFiles,
  handleFileSelect,
  openModal,
  closeModal,
  saveCreative,
  isFromMultiple,
  setUploadType,
  setEditingCreativeIndex,
  setFromSubjectNavigationContext,
}: SingleUploadModalProps) {
  const [isChecking, setIsChecking] = React.useState(false);
  const [proofResult, setProofResult] = React.useState<{ issues: string[]; notes?: string } | null>(null);
  const [isIframeLoaded, setIsIframeLoaded] = React.useState(false);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  // Reset iframe loaded state when uploaded files or htmlCode change
  React.useEffect(() => {
    setIsIframeLoaded(false);
  }, [uploadedFiles, htmlCode]);

  const handleProofread = async () => {
    try {
      setIsChecking(true);
      setProofResult(null);



      console.log("Proofreading started, uploadedFiles:", uploadedFiles);
      console.log("iframeRef.current:", iframeRef.current);

      if (uploadedFiles[0]?.isHtml) {
        // HTML preview: use block-based approach
        
        // Check if iframe is loaded first
        if (!isIframeLoaded) {
          console.log("Iframe not loaded yet");
          setProofResult({ issues: [], notes: "Please wait for the preview to load before checking spelling & grammar." });
          return;
        }

        const iframeDoc = iframeRef.current?.contentDocument;
        console.log("Attempting to access iframe contentDocument:", iframeDoc);
        
        if (!iframeDoc || iframeDoc.readyState !== 'complete' || !iframeDoc.body || !iframeDoc.body.children.length) {
          console.log("Iframe not accessible, using HTML fallback for proofreading");
          try {
            const result = await proofreadText(htmlCode);
            setProofResult({
              issues: (result.edits || []).map(e => {
                const expanded = expandToWord(htmlCode, e.start, e.end);
                const original = htmlCode.slice(expanded.start, expanded.end);
                return `${original} → ${e.suggestion}${e.reason ? ` (${e.reason})` : ""}`;
              }),
              notes: "Proofread using HTML code (preview highlighting not available). Iframe preview had accessibility issues."
            });
            return;
          } catch (fallbackError) {
            console.error("HTML fallback proofreading failed:", fallbackError);
            setProofResult({ 
              issues: [], 
              notes: "Error: Both preview and HTML fallback proofreading failed. Please try refreshing the page." 
            });
            return;
          }
        }

        if (!iframeDoc.body || !iframeDoc.body.children.length) {
          console.log("Iframe body not ready, waiting...");
          setProofResult({ issues: [], notes: "Preview content not ready. Please wait a moment and try again." });
          return;
        }



        iframeDoc.querySelectorAll("script,style,template,[hidden],[aria-hidden='true']").forEach(n => n.remove());


        try {
          const testElement = iframeDoc.body.querySelector('p, div, h1, h2, h3, h4, h5, h6');
          if (!testElement) {
            throw new Error("No content elements found");
          }
          
          const testText = testElement.textContent;
          if (testText === null) {
            throw new Error("Cannot read text content - possible cross-origin restriction");
          }
        } catch (error) {
          console.error("Cannot access iframe content:", error);
          setProofResult({ 
            issues: [], 
            notes: "Error: Cannot access preview content. This might be due to cross-origin restrictions or the preview not being fully loaded. Please try refreshing the page and try again." 
          });
          return;
        }



        const blocks = getVisibleBlocks(iframeDoc); 
        if (!blocks.length) {
          setProofResult({ issues: [], notes: "No visible text found." });
          return;
        }

        ensureReadonlyStyles(iframeDoc);

        const issuesForPanel: {text: string; suggestion: string; reason?: string}[] = [];

        for (const block of blocks) {
          try {
            console.log(`Processing block: ${block.el.tagName}, text length: ${block.text.length}`);
            
            // map text for this element
            const { map, joined } = mapElementTextNodes(block.el, iframeDoc);
            if (!map.length || !joined) {
              console.warn("Skipping block with no mappable text");
              continue;
            }

            const res = await proofreadText(block.text).catch(() => null);
            const edits = res?.edits || [];
            if (!edits.length) {
              console.log("No edits found for this block");
              continue;
            }

            console.log(`Found ${edits.length} edits for block, applying highlights...`);

            // highlight
            const grouped = groupOverlapping(edits);
            grouped.forEach(g => {
              console.log(`Wrapping range ${g.start}-${g.end} with label: ${g.label}`);
              wrapReadonly(iframeDoc, map, g.start, g.end, g.label);
            });

            // collect issues for the side panel
            edits.forEach(e => {
              // Expand to full word boundaries for better readability
              const expanded = expandToWord(block.text, e.start, e.end);
              const original = block.text.slice(expanded.start, expanded.end);
              
              issuesForPanel.push({
                text: original,
                suggestion: e.suggestion,
                reason: e.reason
              });
            });
          } catch (error) {
            console.error("Error processing block:", error);
            // Continue with other blocks
          }
        }

        // Count how many footer elements were skipped
        const totalElements = Array.from(iframeDoc.body.querySelectorAll("p, li, h1,h2,h3,h4,h5,h6, blockquote, td, th, pre, address, figcaption, article, section, aside, div"));
        const footerElements = totalElements.filter(el => isFooterContent(el as HTMLElement, iframeDoc));
        
        setProofResult({
          issues: issuesForPanel.map(i =>
            `${i.text} → ${i.suggestion}${i.reason ? ` (${i.reason})` : ""}`
          ),
          notes: `Hover a highlighted area to see the suggestion. Footer/navigation content (${footerElements.length} elements) was automatically excluded from proofreading.`
        });
      } else {
        // Image preview: use OCR approach
        const textToCheck = await extractCreativeText(uploadedFiles as any);

        if (!textToCheck || !textToCheck.trim()) {
          setProofResult({ issues: [], notes: "No readable text found in preview." });
          return;
        }

        const result = await proofreadText(textToCheck);
        
        // For images, just show the issues without highlighting
        setProofResult({
          issues: (result.edits || []).map(e => {
            // Expand to full word boundaries for better readability
            const expanded = expandToWord(textToCheck, e.start, e.end);
            const original = textToCheck.slice(expanded.start, expanded.end);
            return `${original} → ${e.suggestion}${e.reason ? ` (${e.reason})` : ""}`;
          }),
          notes: "Image text proofread (no highlighting available)."
        });
      }
    } catch (e: unknown) {
      setProofResult({ issues: [], notes: `Error: ${e instanceof Error ? e.message : "Unknown error"}` });
    } finally {
      setIsChecking(false);
    }
  };















  const isVisible = (el: Element, doc: Document) => {
    const cs = doc.defaultView?.getComputedStyle(el as HTMLElement);
    const rect = (el as HTMLElement).getBoundingClientRect();
    return !!rect.width && !!rect.height && cs?.visibility !== "hidden";
  };

  const isFooterContent = (el: HTMLElement, doc: Document) => {
    // Check if element is positioned at the bottom of the page
    const rect = el.getBoundingClientRect();
    const docHeight = doc.documentElement.scrollHeight;
    const isNearBottom = rect.top > (docHeight * 0.7); // If element is in bottom 30% of page
    
    // Check for common footer identifiers
    const tagName = el.tagName.toLowerCase();
    const className = el.className?.toLowerCase() || '';
    const id = el.id?.toLowerCase() || '';
    const text = el.innerText?.toLowerCase() || '';
    
    // Common footer patterns
    const footerPatterns = [
      'footer', 'header', 'nav', 'navigation',
      'copyright', 'all rights reserved', 'privacy policy', 'terms of service',
      'contact us', 'follow us', 'social media', 'newsletter', 'subscribe',
      'about us', 'help', 'support', 'faq', 'legal', 'disclaimer'
    ];
    
    // Check if any footer patterns match
    const hasFooterPattern = footerPatterns.some(pattern => 
      tagName.includes(pattern) || 
      className.includes(pattern) || 
      id.includes(pattern) || 
      text.includes(pattern)
    );
    
    return isNearBottom || hasFooterPattern;
  };

  const getVisibleBlocks = (doc: Document) => {
    // Order matters: p, li, headings, blockquotes, table cells, and block divs
    // Exclude footer, header, and other navigation elements
    const sel = "p, li, h1,h2,h3,h4,h5,h6, blockquote, td, th, pre, address, figcaption, article, section, aside, div";
    const all = Array.from(doc.body.querySelectorAll(sel)) as HTMLElement[];
    const blocks = all
      .filter(el => {
        // Skip footer, header, and navigation elements
        if (isFooterContent(el, doc)) {
          console.log("Skipping footer/navigation content:", el.tagName, el.className, el.innerText?.substring(0, 50));
          return false;
        }
        
        return isVisible(el, doc);
      })
      .map(el => {
        // Normalize <br> to newlines inside the block
        const clone = el.cloneNode(true) as HTMLElement;
        clone.querySelectorAll("script,style,template,[hidden],[aria-hidden='true']").forEach(n => n.remove());
        clone.querySelectorAll("br").forEach(br => br.replaceWith(doc.createTextNode("\n")));
        const text = clone.innerText.replace(/\s+\n/g, "\n").replace(/\n\s+/g, "\n").replace(/[ \t]+/g, " ").trim();
        return { el, text };
      })
      .filter(b => b.text); // non-empty
    return blocks;
  };

  const mapElementTextNodes = (el: HTMLElement, doc: Document) => {
    const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const map: { node: Text; start: number; end: number }[] = [];
    let n: Text | null;
    let pos = 0;
    
    while ((n = walker.nextNode() as Text | null)) {
      const t = n.nodeValue || "";
      if (!t.trim()) continue;
      
      // Ensure we don't have negative positions
      const start = Math.max(0, pos);
      const end = start + t.length;
      
      map.push({ node: n, start, end });
      pos = end;
    }
    
    // Validate the map
    if (map.length === 0) {
      console.warn("No text nodes found in element:", el);
      return { map: [], joined: "" };
    }
    
    const joined = map.map(m => m.node.nodeValue || "").join("");
    console.log(`Mapped ${map.length} text nodes, total length: ${joined.length}`);
    
    return { map, joined };
  };

  // Group overlapping edits → one highlight per region, multiple suggestions




  // Simplified read-only styles
  const ensureReadonlyStyles = (doc: Document) => {
    if (doc.getElementById("gpt-proof-style")) return;
    const style = doc.createElement("style");
    style.id = "gpt-proof-style";
    style.textContent = `
      .gpt-proof { 
        background: rgba(255,205,210,.35);
        outline: 1px solid #e57373; 
        border-radius: 2px;
        cursor: help;
      }
    `;
    doc.head.appendChild(style);
  };



  // Apply highlights using the new range-based approach
  // Simplified read-only highlighting functions
  const locate = (map: {node: Text; start: number; end: number}[], pos: number) => {
    // Find the segment that contains this position
    for (const seg of map) {
      if (pos >= seg.start && pos < seg.end) {
        const offset = pos - seg.start;
        // Ensure offset doesn't exceed node length
        const nodeLength = seg.node.nodeValue?.length || 0;
        return { 
          node: seg.node, 
          offset: Math.min(offset, nodeLength) 
        };
      }
    }
    
    // Fallback: if position is beyond all segments, use the last one
    if (map.length > 0) {
      const last = map[map.length - 1];
      const nodeLength = last.node.nodeValue?.length || 0;
      return { 
        node: last.node, 
        offset: nodeLength 
      };
    }
    
    // Emergency fallback
    throw new Error(`Cannot locate position ${pos} in text map`);
  };

  const wrapReadonly = (
    doc: Document,
    map: {node: Text; start: number; end: number}[],
    start: number, end: number, title: string
  ) => {
    try {
      // Validate positions
      if (start < 0 || end < start || map.length === 0) {
        console.warn(`Invalid range: start=${start}, end=${end}, mapLength=${map.length}`);
        return;
      }

      const s = locate(map, start);
      const e = locate(map, end);
      
      // Validate that we have valid nodes
      if (!s.node || !e.node) {
        console.warn("Invalid text nodes found during location");
        return;
      }

      const range = doc.createRange();
      range.setStart(s.node, s.offset);
      range.setEnd(e.node, e.offset);
      
      const span = doc.createElement("span");
      span.className = "gpt-proof";
      span.title = title; // shows on hover
      
      try { 
        range.surroundContents(span); 
      } catch (rangeError) {
        console.warn("Range.surroundContents failed, using fallback:", rangeError);
        // Fallback: extract content and wrap manually
        const frag = range.cloneContents();
        span.appendChild(frag);
        range.deleteContents();
        range.insertNode(span);
      }
    } catch (error) {
      console.error("Error in wrapReadonly:", error);
      // Don't throw - just log and continue with other highlights
    }
  };

  const groupOverlapping = (edits: {start: number; end: number; suggestion: string; reason?: string}[]) => {
    const out: {start: number; end: number; label: string}[] = [];
    const arr = [...edits].sort((a,b)=> a.start - b.start || a.end - b.end);
    let cur: {start: number; end: number; label: string} | null = null;
    for (const e of arr) {
      const label = e.reason ? `${e.suggestion} (${e.reason})` : e.suggestion;
      if (!cur || e.start > cur.end) {
        cur = { start: e.start, end: e.end, label };
        out.push(cur);
      } else {
        cur.end = Math.max(cur.end, e.end);
        cur.label += ` | ${label}`;
      }
    }
    return out;
  };

  // Expand edit ranges to full word boundaries for better readability
  const expandToWord = (text: string, start: number, end: number) => {
    // Find start of word (look backwards for word boundary)
    let wordStart = start;
    while (wordStart > 0 && /\w/.test(text[wordStart - 1])) {
      wordStart--;
    }
    
    // Find end of word (look forwards for word boundary)
    let wordEnd = end;
    while (wordEnd < text.length && /\w/.test(text[wordEnd])) {
      wordEnd++;
    }
    
    return { start: wordStart, end: wordEnd };
  };








  
  const handleFromSubjectClick = () => {
    if (setFromSubjectNavigationContext) {
      setFromSubjectNavigationContext(isFromMultiple ? "multiple" : "single");
    }
    openModal("From & Subject Lines");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 modal-content">

      <div className="lg:w-7/12 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm flex items-center justify-center p-2 max-h-[80vh] lg:max-h-[90vh] relative" style={{ overflowY: 'auto' }}>
        {uploadedFiles[0]?.previewUrl ? (
          <div className="relative group w-full h-full">
            <Button
              onClick={() => setPreviewImage(uploadedFiles[0].previewUrl || "")}
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-200 z-30"
              title="Maximize"
            >
              <Maximize2 className="h-5 w-5 text-gray-600" />
            </Button>
            
            <div className="w-full h-full overflow-auto">
                            {uploadedFiles[0].isHtml ? (
                <div className="relative">
                  {!isIframeLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">Loading preview...</p>
                      </div>
                    </div>
                  )}
                  {isIframeLoaded && (
                    <div className="absolute top-2 left-2 bg-green-100 border border-green-300 text-green-700 px-2 py-1 rounded text-xs z-10">
                      ✓ Preview Ready
                    </div>
                  )}

                  <iframe
                    ref={iframeRef}
                    srcDoc={htmlCode || ""}
                    className="w-[95%] min-h-[900px] border-0 bg-white mx-auto"
                    sandbox="allow-scripts"
                    title="HTML Creative Preview"
                    onLoad={() => {
                      console.log("Iframe load event fired");
                      // Try to access contentDocument with multiple retries
                      let retryCount = 0;
                      const maxRetries = 5;
                      
                      const tryAccess = () => {
                        const doc = iframeRef.current?.contentDocument;
                        if (doc && doc.readyState === 'complete' && doc.body && doc.body.children.length > 0) {
                          console.log("Iframe contentDocument accessible");
                          setIsIframeLoaded(true);
                        } else if (retryCount < maxRetries) {
                          retryCount++;
                          console.log(`Iframe contentDocument not ready yet, retry ${retryCount}/${maxRetries}`);
                          setTimeout(tryAccess, 200);
                        } else {
                          console.log("Iframe contentDocument not accessible after all retries - will use HTML fallback");
                          // Set as loaded anyway so user can try proofreading (will fallback to HTML)
                          setIsIframeLoaded(true);
                        }
                      };
                      
                      setTimeout(tryAccess, 100);
                    }}
                  />
                </div>
              ) : (
                <div id="creative-image-container" className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src={uploadedFiles[0].previewUrl || ""}
                    alt="Uploaded Creative"
                    width={800}
                    height={600}
                    className="max-h-full w-auto object-contain"
                  />

                  {uploadedFiles[0].zipImages &&
                    uploadedFiles[0].zipImages.length > 1 && (
                      <>
                        <Button
                          onClick={() => {
                            const currentIndex =
                              uploadedFiles[0].currentImageIndex || 0;
                            const newIndex =
                              currentIndex > 0
                                ? currentIndex - 1
                                : uploadedFiles[0].zipImages!.length - 1;
                            setUploadedFiles([
                              {
                                ...uploadedFiles[0],
                                previewUrl:
                                  uploadedFiles[0].zipImages![newIndex],
                                currentImageIndex: newIndex,
                              },
                            ]);
                          }}
                          variant="secondary"
                          size="sm"
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all duration-200 z-10"
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            const currentIndex =
                              uploadedFiles[0].currentImageIndex || 0;
                            const newIndex =
                              currentIndex <
                              uploadedFiles[0].zipImages!.length - 1
                                ? currentIndex + 1
                                : 0;
                            setUploadedFiles([
                              {
                                ...uploadedFiles[0],
                                previewUrl:
                                  uploadedFiles[0].zipImages![newIndex],
                                currentImageIndex: newIndex,
                              },
                            ]);
                          }}
                          variant="secondary"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all duration-200 z-10"
                          aria-label="Next image"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm z-10">
                          {(uploadedFiles[0].currentImageIndex || 0) + 1}{" "}
                          / {uploadedFiles[0].zipImages!.length}
                        </div>
                      </>
                    )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              {uploadedFiles[0]?.file?.name?.endsWith(".zip") ? (
                <Archive className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              ) : (
                <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              )}
              <p>
                {uploadedFiles[0]?.file?.name?.endsWith(".zip")
                  ? "ZIP File Uploaded"
                  : "File Uploaded"}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="lg:w-5/12 flex flex-col justify-between bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm h-full" style={{ overflowY: 'auto', maxHeight: '80vh' }}>
        <div>
          <h3 className="text-base sm:text-lg font-semibold mb-3">
            File Details
          </h3>
          <div className="text-sm mb-1 flex items-center">
            <Label className="font-medium">Name:</Label>
              {tempFileName ? (
              <Input
                type="text"
                value={tempFileName}
                onChange={(e) => setTempFileName(e.target.value)}
                onBlur={() => {
                  const currentDisplayName = uploadedFiles[0]?.displayName || uploadedFiles[0]?.file?.name || "creative.html";
                  if (tempFileName !== currentDisplayName) {
                    setUploadedFiles((prev) =>
                      prev.map((file) => ({
                        ...file,
                        displayName: tempFileName,
                      }))
                    );
                  }
                  setTempFileName("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const currentDisplayName = uploadedFiles[0]?.displayName || uploadedFiles[0]?.file?.name || "creative.html";
                    if (tempFileName !== currentDisplayName) {
                      setUploadedFiles((prev) =>
                        prev.map((file) => ({
                          ...file,
                          displayName: tempFileName,
                        }))
                      );
                    }
                    setTempFileName("");
                  }
                }}
                className="ml-2 h-6 text-sm"
                autoFocus
              />
            ) : (
              <span
                className="ml-2 cursor-pointer text-gray-700 hover:underline"
                onClick={() => {
                  setTempFileName(
                    uploadedFiles[0]?.displayName ||
                    uploadedFiles[0]?.file?.name ||
                      "creative.html"
                  );
                }}
              >
                {uploadedFiles[0]?.displayName || uploadedFiles[0]?.file?.name || "creative.html"}
              </span>
            )}

            {!tempFileName ? (
              <Button
                type="button"
                onClick={() => {
                  setTempFileName(
                    uploadedFiles[0]?.displayName ||
                    uploadedFiles[0]?.file?.name ||
                      "creative.html"
                  );
                }}
                variant="ghost"
                size="sm"
                className="ml-3 text-sky-500 hover:text-sky-600 h-6 px-2"
              >
                Edit
              </Button>
            ) : (
              <Button
                type="button"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  
                  const currentTempFileName = tempFileName;
                  
                  const currentDisplayName = uploadedFiles[0]?.displayName || uploadedFiles[0]?.file?.name || "creative.html";
                  if (currentTempFileName !== currentDisplayName) {
                    setUploadedFiles((prev) =>
                      prev.map((file) => ({
                        ...file,
                        displayName: currentTempFileName,
                      }))
                    );
                  }
                  
                  setTempFileName("");
                }}
                variant="ghost"
                size="sm"
                className="ml-3 text-green-600 hover:text-green-700 h-6 px-2 font-medium relative z-30"
              >
                Done
              </Button>
            )}
          </div>
          <p className="text-sm mb-1">
            <strong>Size:</strong>{" "}
            {uploadedFiles[0]?.file?.size
              ? formatFileSize(uploadedFiles[0].file.size)
              : "Unknown"}
          </p>
          <p className="text-sm mb-4">
            <strong>Type:</strong>{" "}
            {uploadedFiles[0]?.isHtml
              ? "HTML"
              : uploadedFiles[0]?.file?.type?.toUpperCase() ||
                uploadedFiles[0]?.file?.name
                  ?.split(".")
                  .pop()
                  ?.toUpperCase() ||
                "IMAGE"}
          </p>

          <input
            id="modal-file-upload"
            type="file"
            accept=".png,.jpg,.jpeg,.gif,.html,.zip"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileSelect(file);
              }
            }}
          />

          <hr className="my-4 border-gray-200" />

          {uploadedFiles[0]?.isHtml && (
            <div className="mb-6 relative">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">
                  HTML Code
                </h3>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setIsCodeMinimized(!isCodeMinimized);
                      setIsCodeMaximized(false);
                    }}
                    variant="ghost"
                    size="sm"
                    className="p-1 rounded hover:bg-gray-200 transition-colors duration-200"
                    title={isCodeMinimized ? "Restore" : "Minimize"}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    onClick={() => {
                      setIsCodeMaximized(!isCodeMaximized);
                      setIsCodeMinimized(false);
                    }}
                    variant="ghost"
                    size="sm"
                    className="p-1 rounded hover:bg-gray-200 transition-colors duration-200"
                    title={isCodeMaximized ? "Exit Fullscreen" : "Maximize"}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {!isCodeMinimized &&
                (isCodeMaximized ? (
                  <div className="fixed inset-0 fullscreen-modal bg-black bg-opacity-60 flex flex-col">
                    <div className="flex justify-between items-center bg-white px-4 py-2 border-b border-gray-200 shadow-md">
                      <h3 className="text-lg font-semibold">
                        HTML Code (Fullscreen)
                      </h3>
                      <div className="flex gap-2">
                        {!isCodeMaximized && (
                          <Button
                            type="button"
                            onClick={() => {
                              setIsCodeMaximized(false);
                              setIsCodeMinimized(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="p-2 rounded"
                            title="Minimize to small view"
                          >
                            <Maximize2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          onClick={() => setIsCodeMaximized(false)}
                          variant="outline"
                          size="sm"
                          className="p-2 rounded"
                          title="Exit Fullscreen"
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex-1 bg-white p-4">
                      <AceEditor
                        mode="html"
                        theme="github"
                        name="htmlEditorFullscreen"
                        value={htmlCode}
                        onChange={(newCode) => {
                          setHtmlCode(newCode);
                          const blob = new Blob([newCode], {
                            type: "text/html",
                          });
                          const updatedUrl = URL.createObjectURL(blob);
                          setUploadedFiles((prev) => {
                            if (prev[0]?.previewUrl) {
                              URL.revokeObjectURL(prev[0].previewUrl);
                            }
                            return [
                              {
                                ...prev[0],
                                previewUrl: updatedUrl,
                              },
                            ];
                          });
                        }}
                        width="100%"
                        height="100%"
                        fontSize={14}
                        setOptions={{
                          useWorker: false,
                          tabSize: 2,
                          wrap: true,
                        }}
                        style={{
                          border: "1px solid #ddd",
                          borderRadius: "8px",
                          backgroundColor: "#fff",
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <AceEditor
                      mode="html"
                      theme="github"
                      name="htmlEditor"
                      value={htmlCode}
                      onChange={(newCode) => {
                        setHtmlCode(newCode);
                        const blob = new Blob([newCode], {
                          type: "text/html",
                        });
                        const updatedUrl = URL.createObjectURL(blob);
                        setUploadedFiles((prev) => {
                          if (prev[0]?.previewUrl) {
                            URL.revokeObjectURL(prev[0].previewUrl);
                          }
                          return [
                            {
                              ...prev[0],
                              previewUrl: updatedUrl,
                            },
                          ];
                        });
                      }}
                      width="100%"
                      height={isCodeMinimized ? "100px" : "300px"}
                      fontSize={14}
                      setOptions={{
                        useWorker: false,
                        tabSize: 2,
                        wrap: true,
                      }}
                      style={{
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        backgroundColor: "#fff",
                      }}
                    />
                  </div>
                ))}
            </div>
          )}

          <h3 className="text-lg font-semibold mb-3">
            Creative Specific Details
          </h3>
          

          
          <Button
            type="button"
            onClick={handleProofread}
            variant="outline"
            className="flex items-center justify-center gap-2 w-full mb-3"
            disabled={isChecking || (uploadedFiles[0]?.isHtml && !isIframeLoaded)}
            title={uploadedFiles[0]?.isHtml && !isIframeLoaded ? "Please wait for the preview to load" : "Run spelling & grammar check on the current preview"}
          >
            {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4 text-gray-600" />}
            <span>
              {isChecking 
                ? "Checking…" 
                : uploadedFiles[0]?.isHtml && !isIframeLoaded
                  ? "Loading Preview..." 
                  : "Check Spelling & Grammar"
              }
            </span>
          </Button>

          {(proofResult || isChecking) && (
            <div className="mb-6 rounded-lg border border-gray-200 p-3">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Proofreading (errors only)
              </h4>
              
              {isChecking && (
                <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Analyzing content for spelling and grammar issues...</span>
                  </div>
                </div>
              )}
              
              {proofResult?.notes?.includes("Error:") && (
                <div className="space-y-2">
                  <Button
                    onClick={handleProofread}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Proofreading
                  </Button>
                  
                  {proofResult.notes.includes("iframe preview had accessibility issues") && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700">
                        <strong>ℹ️ Info:</strong> The preview had accessibility issues, so proofreading was done using the HTML code instead. This ensures reliable results even when the preview doesn't load properly.
                      </p>
                    </div>
                  )}
                  {(proofResult.notes.includes("cross-origin") || proofResult.notes.includes("browser security policies")) && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-700">
                        <strong>Tip:</strong> If preview proofreading continues to fail, you can:
                        <br />• Switch to the HTML code editor tab
                        <br />• Use the proofreading button there instead
                        <br />• Or refresh the page and try again
                      </p>
                    </div>
                  )}
                </div>
              )}



              {isChecking ? (
                <p className="text-sm text-gray-500">Analyzing…</p>
              ) : proofResult?.issues?.length ? (
                <>
                  <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-700">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="text-sm font-medium">Check complete!</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">Hover over highlighted areas to see suggestions.</p>
                  </div>
                  <ul className="list-disc pl-5 text-sm space-y-1 max-h-72 overflow-auto">
                    {proofResult.issues.map((issue, idx) => (
                      <li key={idx} className="text-xs">{issue}</li>
                    ))}
                  </ul>
                  {proofResult.notes && (
                    <p className="text-xs text-gray-500 mt-2">{proofResult.notes}</p>
                  )}
                </>
              ) : proofResult?.notes ? (
                <p className="text-sm text-gray-500">{proofResult.notes}</p>
              ) : null}




            </div>
          )}
          
          <div className="space-y-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="modalFromLine" className="text-lg font-semibold">
                From Lines
              </Label>
              <Textarea
                id="modalFromLine"
                placeholder="Enter your from lines here...&#10;Example:&#10;John Doe &lt;john@company.com&gt;&#10;Marketing Team &lt;marketing@company.com&gt;"
                value={modalFromLine}
                onChange={(e) => setModalFromLine(e.target.value)}
                className="min-h-[100px] resize-none transition-all duration-300"
              />
              <p className="text-xs text-gray-500">Edit your from lines directly here, or use AI suggestions below.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modalSubjectLines" className="text-lg font-semibold">
                Subject Lines
              </Label>
              <Textarea
                id="modalSubjectLines"
                placeholder="Enter your subject lines here...&#10;Example:&#10;Exclusive Offer Inside!&#10;Don't Miss This Limited Time Deal&#10;Your Special Discount Awaits"
                value={modalSubjectLines}
                onChange={(e) => setModalSubjectLines(e.target.value)}
                className="min-h-[100px] resize-none transition-all duration-300"
              />
              <p className="text-xs text-gray-500">Edit your subject lines directly here, or use AI suggestions below.</p>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>💡 Tip:</strong> Your changes are automatically saved when you click "Save & Continue" below.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleFromSubjectClick}
              variant="outline"
              className="flex items-center justify-center gap-2 w-full"
            >
              <Archive className="h-4 w-4 text-gray-600" />
              <span>Get AI Suggestions (Opens Full Editor)</span>
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="creativeNotes" className="text-lg font-semibold">
              Any Notes For This Creative
            </Label>
            <Textarea
              id="creativeNotes"
              placeholder="Type your notes here..."
              value={creativeNotes}
              onChange={(e) => setCreativeNotes(e.target.value)}
              className="min-h-[100px] resize-none transition-all duration-300"
            />
          </div>
        </div>

        <Button
          onClick={() => {
            saveCreative();
            if (isFromMultiple) {
              setUploadType("multiple");
              setEditingCreativeIndex(null);
            }
          }}
          className="mt-6 w-full py-3 transition-all duration-300 active:scale-95"
          size="lg"
        >
          Save & Continue
        </Button>
      </div>
    </div>
  );
}