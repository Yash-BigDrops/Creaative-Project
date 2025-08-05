"use client";

import React from "react";
import Image from "next/image";
import { UploadedFile, MultiCreative } from "@/types/creative";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

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
}: MultipleUploadModalProps) {
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
                  <iframe
                    src={creative.imageUrl}
                    title={`Creative-${idx + 1}`}
                    className="w-full h-full border-0 group-hover:scale-105 transition-transform duration-300"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                    onError={(e) => {
                      console.error("Creative iframe load error:", e);
                    }}
                  />
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
                  className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white font-medium"
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
                <Button
                  onClick={() => {
                    if (onEditCreative) {
                      onEditCreative(creative);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-primary text-primary hover:bg-primary/5"
                >
                  Edit/View
                </Button>
                <Button
                  onClick={() =>
                    setMultiCreatives(
                      multiCreatives.filter((c) => c.id !== creative.id)
                    )
                  }
                  variant="outline"
                  size="sm"
                  className="flex-1 border-red-400 text-red-500 hover:bg-red-50"
                >
                  Remove
                </Button>
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