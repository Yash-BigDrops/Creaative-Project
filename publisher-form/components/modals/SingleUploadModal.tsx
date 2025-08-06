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
import { Maximize2, Minimize2, ChevronLeft, ChevronRight, FileText, Archive } from "lucide-react";

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
                <iframe
                  src={uploadedFiles[0].previewUrl || ""}
                  className="w-[95%] min-h-[900px] border-0 bg-white mx-auto"
                  sandbox="allow-scripts allow-same-origin"
                  title="HTML Creative Preview"
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
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
                    {isCodeMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
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
                            <Minimize2 className="h-4 w-4" />
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
            onClick={handleFromSubjectClick}
            variant="outline"
            className="flex items-center justify-center gap-2 w-full mb-6"
          >
            <Archive className="h-4 w-4 text-gray-600" />
            <span>From & Subject Lines</span>
          </Button>

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