"use client";

import React from "react";
import { Bot } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface FromSubjectModalProps {
  fromLine: string;
  subjectLines: string;
  modalFromLine?: string;
  modalSubjectLines?: string;
  aiLoading: boolean;
  setFromLine: (line: string) => void;
  setSubjectLines: (lines: string) => void;
  setModalFromLine?: (line: string) => void;
  setModalSubjectLines?: (lines: string) => void;
  enhanceWithClaude: () => void;
  closeModal: () => void;
  onBackToSingle?: () => void;
  navigationContext?: "direct" | "single" | "multiple" | null;
}

export default function FromSubjectModal({
  fromLine,
  subjectLines,
  modalFromLine,
  modalSubjectLines,
  aiLoading,
  setFromLine,
  setSubjectLines,
  setModalFromLine,
  setModalSubjectLines,
  enhanceWithClaude,
  closeModal,
  onBackToSingle,
  navigationContext,
}: FromSubjectModalProps) {
  
  const handleBackClick = () => {
    if (navigationContext === "single" || navigationContext === "multiple") {
      if (onBackToSingle) {
        onBackToSingle();
      }
    } else {
      closeModal();
    }
  };

  const currentFromLine = (navigationContext === "single" || navigationContext === "multiple") 
    ? (modalFromLine || "") 
    : (fromLine || "");
  
  const currentSubjectLines = (navigationContext === "single" || navigationContext === "multiple") 
    ? (modalSubjectLines || "") 
    : (subjectLines || "");

  
  const setCurrentFromLine = (value: string) => {
    if (navigationContext === "single" || navigationContext === "multiple") {
      setModalFromLine?.(value);
    } else {
      setFromLine(value);
    }
  };
  
  const setCurrentSubjectLines = (value: string) => {
    if (navigationContext === "single" || navigationContext === "multiple") {
      setModalSubjectLines?.(value);
    } else {
      setSubjectLines(value);
    }
  };

  const handleSaveAndClose = () => {
    if (navigationContext === "single" || navigationContext === "multiple") {
      if (onBackToSingle) {
        onBackToSingle();
      }
    } else {
      closeModal();
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center"
        style={{ 
          zIndex: 1000,
          overflowY: 'auto' 
        }}
        onClick={closeModal}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-[95vw] lg:max-w-[90vw] xl:max-w-[85vw] max-h-[95vh] overflow-hidden relative animate-scale-in"
          style={{ zIndex: 1001 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              {(navigationContext === "single" || navigationContext === "multiple") && onBackToSingle && (
                <Button
                  onClick={handleBackClick}
                  variant="ghost"
                  size="sm"
                  className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200 group"
                  title="Back to Creative Details"
                >
                  <svg className="h-5 w-5 text-gray-500 group-hover:text-gray-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
              )}
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  From & Subject Lines
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Configure your email sender information and subject line variations
                </p>
              </div>
            </div>
            <Button
              onClick={closeModal}
              variant="ghost"
              size="sm"
              className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200 group"
              title="Close"
            >
              <svg className="h-5 w-5 text-gray-500 group-hover:text-gray-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>

          <div className="overflow-y-auto p-4 sm:p-6 lg:p-8" style={{ maxHeight: 'calc(95vh - 100px)' }}>
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
                <div className="space-y-4">
                  <Label htmlFor="fromLine" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    From Lines
                  </Label>
                  <Textarea
                    id="fromLine"
                    placeholder="Enter your from lines here...&#10;Example:&#10;John Doe &lt;john@company.com&gt;&#10;Marketing Team &lt;marketing@company.com&gt;"
                    value={currentFromLine}
                    onChange={(e) => setCurrentFromLine(e.target.value)}
                    className="min-h-[200px] sm:min-h-[250px] lg:min-h-[300px] p-3 sm:p-4 text-sm resize-none border-gray-200 focus:border-primary focus:ring-primary/20 transition-all duration-300"
                  />
                </div>

                <div className="space-y-4">
                  <Label htmlFor="subjectLines" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Subject Lines
                  </Label>
                  <Textarea
                    id="subjectLines"
                    placeholder="Enter your subject lines here...&#10;Example:&#10;Exclusive Offer Inside!&#10;Don't Miss This Limited Time Deal&#10;Your Special Discount Awaits"
                    value={currentSubjectLines}
                    onChange={(e) => setCurrentSubjectLines(e.target.value)}
                    className="min-h-[200px] sm:min-h-[250px] lg:min-h-[300px] p-3 sm:p-4 text-sm resize-none border-gray-200 focus:border-primary focus:ring-primary/20 transition-all duration-300"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-6 border-t border-gray-100">
                <Button
                  type="button"
                  onClick={enhanceWithClaude}
                  disabled={aiLoading}
                  className="px-6 py-3 flex items-center gap-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 active:scale-95 shadow-lg"
                  size="lg"
                >
                  <Bot size={18} />
                  {aiLoading ? "Generating AI Suggestions..." : "AI Suggest From & Subject Lines"}
                </Button>

                <Button
                  onClick={handleSaveAndClose}
                  className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white transition-all duration-300 active:scale-95"
                  size="lg"
                >
                  Save & Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}