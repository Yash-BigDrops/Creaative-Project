"use client";

import React from "react";
import Image from "next/image";
import { UploadedFile } from "@/types/creative";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface CreativeModalProps {
  uploadedFiles: UploadedFile[];
  isDragOver: boolean;
  isUploading: boolean;
  handleFileSelect: (file: File) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
}

export default function CreativeModal({
  uploadedFiles,
  isDragOver,
  isUploading,
  handleFileSelect,
  handleDragOver,
  handleDragLeave,
  handleDrop,
}: CreativeModalProps) {
  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <div
        className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center
        px-4 py-12 sm:px-8 sm:py-16 lg:px-16 lg:py-28 min-h-[50vh] sm:min-h-[60vh] w-full max-w-4xl mx-auto text-center cursor-pointer 
        transition-all duration-300 bg-gradient-to-br from-gray-50 to-white ${
          isDragOver
            ? "border-primary bg-primary/5 shadow-lg scale-[1.02]"
            : "border-gray-200 hover:border-primary hover:shadow-md"
        } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
        onClick={() =>
          !isUploading &&
          document.getElementById("file-upload")?.click()
        }
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="w-24 h-24 mb-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="w-24 h-24 mb-8 p-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload
              className={`w-12 h-12 transition-all duration-300 ${
                isDragOver ? "text-primary scale-110" : "text-gray-400"
              }`}
            />
          </div>
        )}
        <h3
          className={`text-2xl font-semibold mb-4 transition-colors duration-300 ${
            isDragOver ? "text-primary" : "text-gray-900"
          }`}
        >
          {isUploading
            ? "Uploading your creative..."
            : isDragOver
            ? "Drop your files here"
            : "Upload your Creative"}
        </h3>
        <p className="text-base text-gray-600 mb-2">
          Click to browse or drag and drop your files
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">PNG</span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">JPG</span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">HTML</span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">ZIP</span>
        </div>
        <input
          id="file-upload"
          type="file"
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
    </div>
  );
} 