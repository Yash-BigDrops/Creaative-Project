"use client";

import React from "react";
import Image from "next/image";
import { UploadedFile, MultiCreative } from "@/types/creative";
import { Button } from "@/components/ui/button";
import { Upload, ShieldCheck, Loader2, FileText } from "lucide-react";
import { proofreadText } from "@/services/api";
import { extractCreativeText } from "@/lib/ocrHelpers";

interface MultipleUploadModalProps {
  multiCreatives: MultiCreative[];
  isZipProcessing: boolean;
  zipError: string | null;
  isDragOver: boolean;
  isUploading: boolean;
  previewImage: string | null;
  previewedCreative: { url: string; type?: "image" | "html" } | null;
  setPreviewImage: (url: string | null) => void;
  setPreviewedCreative: (creative: { url: string; type?: "image" | "html" } | null) => void;
  setMultiCreatives: (creatives: MultiCreative[]) => void;
  handleFileSelect: (file: File) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleMultipleCreativesSave: () => void;
  onEditCreative?: (creative: MultiCreative) => void;
  openModal: (option: string, preserveExisting?: boolean) => void;
  setUploadType: (type: "single" | "multiple") => void;
  setUploadedCreative: (creative: null | { name: string; url?: string }) => void;
  setHtmlCode: (code: string) => void;
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
}

export default function MultipleUploadModal({
  multiCreatives,
  isZipProcessing,
  zipError,
  isDragOver,
  isUploading,
  previewImage,
  previewedCreative,
  setPreviewImage,
  setPreviewedCreative,
  setMultiCreatives,
  handleFileSelect,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleMultipleCreativesSave,
  onEditCreative,
  openModal,
  setUploadType,
  setUploadedCreative,
  setHtmlCode,
  setUploadedFiles,
}: MultipleUploadModalProps) {
  // Proofreading state and refs
  const iframeRefs = React.useRef<Array<HTMLIFrameElement | null>>([]);
  const [loaded, setLoaded] = React.useState<Record<number, boolean>>({});
  const [issuesByIndex, setIssuesByIndex] = React.useState<Record<number, string[]>>({});
  const [checkingIndex, setCheckingIndex] = React.useState<number | null>(null);



  // Proofreading helper functions
  const isVisible = (el: Element, doc: Document) => {
    const cs = doc.defaultView?.getComputedStyle(el as HTMLElement);
    const rect = (el as HTMLElement).getBoundingClientRect();
    return !!rect.width && !!rect.height && cs?.visibility !== "hidden";
  };

  const getVisibleBlocks = (doc: Document) => {
    const sel = "p, li, h1,h2,h3,h4,h5,h6, blockquote, td, th, pre, address, figcaption, article, section, aside, header, footer, div";
    const all = Array.from(doc.body.querySelectorAll(sel)) as HTMLElement[];
    const blocks = all
      .filter(el => isVisible(el, doc))
      .map(el => {
        const clone = el.cloneNode(true) as HTMLElement;
        clone.querySelectorAll("script,style,template,[hidden],[aria-hidden='true']").forEach(n => n.remove());
        clone.querySelectorAll("br").forEach(br => br.replaceWith(doc.createTextNode("\n")));
        const text = clone.innerText.replace(/\s+\n/g, "\n").replace(/\n\s+/g, "\n").replace(/[ \t]+/g, " ").trim();
        return { el, text };
      })
      .filter(b => b.text);
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
      
      const start = Math.max(0, pos);
      const end = start + t.length;
      
      map.push({ node: n, start, end });
      pos = end;
    }
    
    if (map.length === 0) {
      console.warn("No text nodes found in element:", el);
      return { map: [], joined: "" };
    }
    
    const joined = map.map(m => m.node.nodeValue || "").join("");
    return { map, joined };
  };

  const expandToWord = (text: string, start: number, end: number) => {
    let wordStart = start;
    while (wordStart > 0 && /\w/.test(text[wordStart - 1])) {
      wordStart--;
    }
    
    let wordEnd = end;
    while (wordEnd < text.length && /\w/.test(text[wordEnd])) {
      wordEnd++;
    }
    
    return { start: wordStart, end: wordEnd };
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

  const locate = (map: {node: Text; start: number; end: number}[], pos: number) => {
    for (const seg of map) {
      if (pos >= seg.start && pos < seg.end) {
        const offset = pos - seg.start;
        const nodeLength = seg.node.nodeValue?.length || 0;
        return { 
          node: seg.node, 
          offset: Math.min(offset, nodeLength) 
        };
      }
    }
    
    if (map.length > 0) {
      const last = map[map.length - 1];
      const nodeLength = last.node.nodeValue?.length || 0;
      return { 
        node: last.node, 
        offset: nodeLength 
      };
    }
    
    throw new Error(`Cannot locate position ${pos} in text map`);
  };

  const wrapReadonly = (
    doc: Document,
    map: {node: Text; start: number; end: number}[],
    start: number, end: number, title: string
  ) => {
    try {
      if (start < 0 || end < start || map.length === 0) {
        console.warn(`Invalid range: start=${start}, end=${end}, mapLength=${map.length}`);
        return;
      }

      const s = locate(map, start);
      const e = locate(map, end);
      
      if (!s.node || !e.node) {
        console.warn("Invalid text nodes found during location");
        return;
      }

      const range = doc.createRange();
      range.setStart(s.node, s.offset);
      range.setEnd(e.node, e.offset);
      
      const span = doc.createElement("span");
      span.className = "gpt-proof";
      span.title = title;
      
      try { 
        range.surroundContents(span); 
      } catch (rangeError) {
        console.warn("Range.surroundContents failed, using fallback:", rangeError);
        const frag = range.cloneContents();
        span.appendChild(frag);
        range.deleteContents();
        range.insertNode(span);
      }
    } catch (error) {
      console.error("Error in wrapReadonly:", error);
    }
  };

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

  // Main proofreading function for a specific creative
  const checkErrorsFor = async (index: number) => {
    try {
      console.log(`Starting proofreading for creative ${index}`, { creative: multiCreatives[index] });
      setCheckingIndex(index);
      const creative = multiCreatives[index];
      

      
      if (creative.type === "html") {
        console.log("Processing HTML creative", { 
          hasHtmlContent: !!creative.htmlContent, 
          htmlContentLength: creative.htmlContent?.length || 0 
        });
        const iframe = iframeRefs.current[index];
        console.log("Iframe ref:", iframe);
        
        if (!iframe?.contentDocument) {
          console.warn("Iframe not loaded for HTML creative");
          setIssuesByIndex(prev => ({ ...prev, [index]: ["Iframe not loaded yet. Please wait for preview to finish loading."] }));
          return;
        }

        console.log("Iframe contentDocument:", iframe.contentDocument);
        

        
        ensureReadonlyStyles(iframe.contentDocument);
        const blocks = getVisibleBlocks(iframe.contentDocument);
        console.log("Visible blocks found:", blocks.length, blocks);
        
        if (!blocks.length) {
          console.log("No visible blocks found");
          setIssuesByIndex(prev => ({ ...prev, [index]: ["No visible text found in preview."] }));
          return;
        }

        console.log("Sending blocks for proofreading...");
        const results = await Promise.all(
          blocks.map(b => proofreadText(b.text).catch((err) => {
            console.error("Proofread API error for block:", err);
            return { edits: [] };
          }))
        );
        console.log("Proofreading results:", results);

        // Apply highlights
        if (!iframe.contentDocument) {
          console.error("Iframe contentDocument is null");
          return;
        }
        results.forEach((r, bi) => {
          if (!r?.edits?.length) return;
          const { map } = mapElementTextNodes(blocks[bi].el, iframe.contentDocument!);
          const grouped = groupOverlapping(r.edits);
          grouped.forEach(g =>
            wrapReadonly(iframe.contentDocument!, map, g.start, g.end, g.label)
          );
        });

        // Build issues list
        const panelIssues: string[] = [];
        results.forEach((r, bi) => {
          const text = blocks[bi].text;
          r?.edits?.forEach(e => {
            const { start, end } = expandToWord(text, e.start, e.end);
            const frag = text.slice(start, end);
            panelIssues.push(`${frag} → ${e.suggestion}${e.reason ? ` (${e.reason})` : ""}`);
          });
        });

        console.log("Panel issues:", panelIssues);
        setIssuesByIndex(prev => ({ ...prev, [index]: panelIssues }));
        console.log("Updated issuesByIndex for index", index);
      } else {
        console.log("Processing image creative");
        // Image creative - use OCR
        try {
          const mockFile = { imageUrl: creative.imageUrl, file: undefined, isHtml: false, previewUrl: creative.imageUrl, extractedContent: undefined } as any;
          const textToCheck = await extractCreativeText([mockFile]);
          console.log("OCR extracted text:", textToCheck);
          
          if (!textToCheck || !textToCheck.trim()) {
            setIssuesByIndex(prev => ({ ...prev, [index]: ["No readable text found in image."] }));
            return;
          }

          const result = await proofreadText(textToCheck);
          console.log("Image proofreading result:", result);
          
          const issues = (result.edits || []).map(e => {
            const expanded = expandToWord(textToCheck, e.start, e.end);
            const original = textToCheck.slice(expanded.start, expanded.end);
            return `${original} → ${e.suggestion}${e.reason ? ` (${e.reason})` : ""}`;
          });

          console.log("Image issues:", issues);
          setIssuesByIndex(prev => ({ ...prev, [index]: issues }));
        } catch (error) {
          console.error("OCR error:", error);
          setIssuesByIndex(prev => ({ ...prev, [index]: ["Failed to extract text from image."] }));
        }
      }
    } catch (error) {
      console.error("Proofreading error:", error);
      setIssuesByIndex(prev => ({ ...prev, [index]: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`] }));
    } finally {
      setCheckingIndex(null);
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      {multiCreatives.length > 0 ? (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Uploaded Creatives</h3>
              <p className="text-gray-600 text-xs sm:text-sm">Manage your uploaded creative files</p>
            </div>
            <Button
              onClick={handleMultipleCreativesSave}
              className="px-4 sm:px-6 py-2 bg-primary hover:bg-primary/90 text-white font-medium text-sm"
            >
              Save All Creatives
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {multiCreatives.map((creative, idx) => (
            <div
              key={creative.id}
              className="flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
            >
              <div className="relative group w-full h-40 bg-gray-50 flex items-center justify-center overflow-hidden">
                {creative.type === "html" ? (
                  <div className="relative w-full h-full">
                    {!loaded[idx] && (
                      <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto mb-2"></div>
                          <p className="text-xs text-gray-500">Loading preview...</p>
                        </div>
                      </div>
                    )}
                    <iframe
                      ref={el => {
                        iframeRefs.current[idx] = el;
                      }}
                      srcDoc={creative.htmlContent || ""}
                      title={`Creative-${idx + 1}`}
                      className="w-full h-full border-0 group-hover:scale-105 transition-transform duration-300"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                      onLoad={() => {
                        console.log(`Iframe ${idx} loaded`);
                        setLoaded(prev => ({...prev, [idx]: true}));
                      }}
                      onError={(e) => {
                        console.error("Creative iframe load error:", e);
                      }}
                    />

                  </div>
                ) : (
                  <Image
                    src={creative.imageUrl}
                    alt={`Creative ${idx + 1}`}
                    width={400}
                    height={300}
                    className="object-contain max-h-full max-w-full group-hover:scale-105 transition-transform duration-300"
                  />
                )}
                <Button
                  onClick={() => {
                    setPreviewImage(creative.imageUrl);
                    setPreviewedCreative({
                      url: creative.imageUrl,
                      type: creative.type,
                    });
                  }}
                  variant="secondary"
                  className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-black font-medium"
                >
                  Preview
                </Button>
              </div>

              <div className="p-3 flex flex-col flex-1">
                <p className="font-semibold text-gray-800 truncate">{`Creative-${idx + 1}`}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Type: {creative.type === "html" ? "HTML" : "Image"}
                </p>
              </div>

              <div className="p-3 border-t border-gray-100 flex gap-2">
                <button
                  onClick={() => onEditCreative && onEditCreative(creative)}
                  className="flex-1 border border-sky-400 text-sky-500 text-sm rounded-lg py-1 hover:bg-sky-50 transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={() =>
                    setMultiCreatives(
                      multiCreatives.filter((c) => c.id !== creative.id)
                    )
                  }
                  className="flex-1 border border-red-400 text-red-500 text-sm rounded-lg py-1 hover:bg-red-50 transition-all"
                >
                  Remove
                </button>
              </div>

              {/* Proofreading section */}
              <div className="px-3 pb-3 border-t border-gray-100">
                <Button
                  onClick={() => {
                    console.log(`Check errors button clicked for creative ${idx}`);
                    checkErrorsFor(idx);
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full mb-2"
                  disabled={!loaded[idx] || checkingIndex === idx}
                  title={!loaded[idx] ? "Preview still loading..." : "Check spelling and grammar"}
                >
                  {checkingIndex === idx ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Check errors
                    </>
                  )}
                </Button>
                
                {/* Issues display */}
                {issuesByIndex[idx] && (
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Issues found</span>
                    </div>
                    {issuesByIndex[idx].length > 0 ? (
                      <ul className="list-disc pl-4 text-xs text-gray-600 space-y-1 max-h-24 overflow-y-auto">
                        {issuesByIndex[idx].map((issue, k) => (
                          <li key={k} className="leading-tight">{issue}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-green-600">No issues found!</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          </div>
        </div>
      ) : (
        <>
          {isZipProcessing && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mb-4"></div>
              <p className="text-gray-600 font-medium">
                Processing ZIP file...
              </p>
            </div>
          )}

          {zipError && (
            <div className="bg-red-50 border border-red-300 text-red-600 px-4 py-3 rounded-lg mt-4">
              <strong>Error:</strong> {zipError}
            </div>
          )}

          <div
            className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center
            px-8 py-24 sm:px-20 sm:py-32 min-h-[80vh] w-full max-w-full mx-auto text-center cursor-pointer 
            transition-all duration-300 ${
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-border bg-muted hover:border-primary"
            } ${(isZipProcessing || isUploading) ? "opacity-50 pointer-events-none" : ""}`}
            style={{ overflowY: 'auto' }}
            onClick={() =>
              !isZipProcessing && !isUploading &&
              document.getElementById("file-upload")?.click()
            }
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="w-36 h-36 mb-10 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sky-500"></div>
              </div>
            ) : (
              <Upload
                              className={`w-36 h-36 mb-10 transition-colors duration-300 ${
                isDragOver ? "text-primary" : "text-muted-foreground"
              }`}
              />
            )}
            <p
              className={`text-3xl transition-colors duration-300 ${
                isDragOver ? "text-primary" : "text-foreground"
              }`}
            >
              {isUploading
                ? "Uploading your creative..."
                : isDragOver
                ? "Drop your files here"
                : "Click here to upload your Creative"}
            </p>
            <p className="text-xl text-muted-foreground mt-6">
              Accepted Files: PNG, JPG, JPEG, HTML, ZIP
            </p>
            <p className="text-lg text-muted-foreground">
              or drag and drop files here
            </p>
            <input
              id="file-upload"
              type="file"
              multiple={true}
              className="hidden"
              accept=".png,.jpg,.jpeg,.html,.zip"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileSelect(file);
                }
              }}
            />
          </div>
        </>
      )}

      {multiCreatives.length > 0 && (
        <Button
          onClick={handleMultipleCreativesSave}
          className="mt-6 w-full py-3 transition-all duration-300 active:scale-95"
          size="lg"
        >
          Save All Creatives & Continue
        </Button>
      )}
    </div>
  );
}