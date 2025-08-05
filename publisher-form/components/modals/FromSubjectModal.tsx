"use client";

import React from "react";
import { Bot } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface FromSubjectModalProps {
  fromLine: string;
  subjectLines: string;
  aiLoading: boolean;
  setFromLine: (line: string) => void;
  setSubjectLines: (lines: string) => void;
  enhanceWithClaude: () => void;
  closeModal: () => void;
  onBackToSingle?: () => void;
  navigationContext?: "direct" | "single" | "multiple" | null;
}

export default function FromSubjectModal({
  fromLine,
  subjectLines,
  aiLoading,
  setFromLine,
  setSubjectLines,
  enhanceWithClaude,
  closeModal,
  onBackToSingle,
  navigationContext,
}: FromSubjectModalProps) {
  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            {/* Back button to creative details page */}
            {onBackToSingle && navigationContext !== "direct" && (
              <Button
                onClick={onBackToSingle}
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
          <div className="space-y-4">
            <Label htmlFor="fromLine" className="text-base font-semibold text-gray-700 flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              From Lines
            </Label>
            <Textarea
              id="fromLine"
              placeholder="Enter your from lines here...&#10;Example:&#10;John Doe &lt;john@company.com&gt;&#10;Marketing Team &lt;marketing@company.com&gt;"
              value={fromLine}
              onChange={(e) => setFromLine(e.target.value)}
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
              value={subjectLines}
              onChange={(e) => setSubjectLines(e.target.value)}
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
            onClick={closeModal}
            className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white transition-all duration-300 active:scale-95"
            size="lg"
          >
            Save & Close
          </Button>
        </div>
      </div>
    </div>
  );
} 