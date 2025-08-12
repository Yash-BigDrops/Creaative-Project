import { useState, useEffect } from "react";
import { CreativeFormData, UploadedFile, MultiCreative, TelegramCheckStatus, TelegramCheckResponse, Priority, UploadType } from "@/types/creative";
import { validateFormData } from "@/utils/validation";
import { fetchOffers, checkTelegramUser, getClaudeSuggestions, saveCreative, saveMultipleCreatives, deleteCreative, submitForm } from "@/services/api";
import { extractCreativeText } from "@/lib/ocrHelpers";
import { uploadToBlob, createCompressedPreview } from "@/lib/uploadHelpers";
import { extractCreativesFromZip, isImageFile, formatFileSize } from "@/utils/fileUtils";

export const useCreativeForm = () => {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState<CreativeFormData>({
    affiliateId: "",
    companyName: "",
    firstName: "",
    lastName: "",
    contactEmail: "",
    telegramId: "",
    offerId: "",
    creativeType: "",
    fromLine: "",
    subjectLines: "",
    otherRequest: "",
  });

  const [offers, setOffers] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [trackingLink, setTrackingLink] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewedCreative, setPreviewedCreative] = useState<{
    url: string;
    type?: "image" | "html";
  } | null>(null);
  const [offerSearchTerm, setOfferSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [uploadType, setUploadType] = useState<UploadType>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [tempFileKey, setTempFileKey] = useState<string | null>(null);
  const [isOfferDropdownOpen, setIsOfferDropdownOpen] = useState(false);
  const [isCreativeTypeDropdownOpen, setIsCreativeTypeDropdownOpen] = useState(false);
  const [fromLine, setFromLine] = useState("");
  const [subjectLines, setSubjectLines] = useState("");
  const [modalFromLine, setModalFromLine] = useState("");
  const [modalSubjectLines, setModalSubjectLines] = useState("");
  const [creativeNotes, setCreativeNotes] = useState("");
  const [uploadedCreative, setUploadedCreative] = useState<null | {
    name: string;
    url?: string;
  }>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempFileName, setTempFileName] = useState("");
  const [htmlCode, setHtmlCode] = useState("");
  const [isCodeMaximized, setIsCodeMaximized] = useState(false);
  const [isCodeMinimized, setIsCodeMinimized] = useState(false);
  const [multiCreatives, setMultiCreatives] = useState<MultiCreative[]>([]);
  const [editingCreativeIndex, setEditingCreativeIndex] = useState<number | null>(null);
  const [originalZipFileName, setOriginalZipFileName] = useState<string>("");
  const [savedMultiCreatives, setSavedMultiCreatives] = useState<MultiCreative[]>([]);
  const [isZipProcessing, setIsZipProcessing] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);
  const [priority, setPriority] = useState<Priority>("Moderate");
  const [aiLoading, setAiLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [telegramCheckStatus, setTelegramCheckStatus] = useState<TelegramCheckStatus>("unchecked");
  const [fromSubjectNavigationContext, setFromSubjectNavigationContext] = useState<"direct" | "single" | "multiple" | null>(null);
  
  const [previousSuggestions, setPreviousSuggestions] = useState<{
    fromLines: string[];
    subjectLines: string[];
  }>({ fromLines: [], subjectLines: [] });

  useEffect(() => {
    const loadOffers = async () => {
      const offersData = await fetchOffers();
      setOffers(offersData);
    };
    loadOffers();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    if (field === 'firstName' || field === 'lastName') {
      const filteredValue = value.replace(/[^A-Za-z\s]/g, '');
      setFormData((prev) => ({ ...prev, [field]: filteredValue }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleTelegramBlur = async () => {
    const cleanUsername = formData.telegramId.trim().replace(/^@/, '');
    
    if (!cleanUsername) {
      setTelegramCheckStatus("unchecked");
      return;
    }

    setTelegramCheckStatus("checking");

    try {
      const data = await checkTelegramUser(cleanUsername);
      
      if (data.started) {
        setTelegramCheckStatus("ok");
        if (data.message) {
        }
      } else {
        setTelegramCheckStatus("not_started");
      }
    } catch (err) {
      setTelegramCheckStatus("not_started");
    }
  };

  const checkForDuplicates = (newFromLines: string[], newSubjectLines: string[]): boolean => {
    const allPreviousFromLines = previousSuggestions.fromLines.join(' ').toLowerCase();
    const allPreviousSubjectLines = previousSuggestions.subjectLines.join(' ').toLowerCase();
    
    const newFromText = newFromLines.join(' ').toLowerCase();
    const newSubjectText = newSubjectLines.join(' ').toLowerCase();
    
    const fromSimilarity = newFromLines.some(line => 
      allPreviousFromLines.includes(line.toLowerCase().substring(0, 20))
    );
    
    const subjectSimilarity = newSubjectLines.some(line => 
      allPreviousSubjectLines.includes(line.toLowerCase().substring(0, 20))
    );
    
    return fromSimilarity || subjectSimilarity;
  };

  const enhanceWithClaude = async () => {
    if (!formData.companyName?.trim()) {
      alert('Please enter a Company Name first.');
      return;
    }

    if (!formData.offerId?.trim()) {
      alert('Please select an Offer ID first.');
      return;
    }

    if (uploadedFiles.length === 0 && !uploadedCreative) {
      alert('Please upload a creative first so AI can analyze it.');
      return;
    }

    setAiLoading(true);

    try {
      let creativeContent = '';

      if (fromSubjectNavigationContext === "direct") {
        const allFiles: any[] = [];

        if (uploadedFiles.length > 0) {
          allFiles.push(...uploadedFiles);
        }

        if (multiCreatives.length > 0) {
          multiCreatives.forEach((creative, idx) => {
            if (creative.type === "html" && creative.htmlContent) {
              allFiles.push({
                file: new File([], `creative-${idx + 1}.html`, { type: "text/html" }),
                previewUrl: creative.imageUrl || "",
                isHtml: true,
                extractedContent: creative.htmlContent,
              });
            } else if (creative.type === "image") {
              allFiles.push({
                file: new File([], `creative-${idx + 1}.png`, { type: "image/png" }),
                previewUrl: creative.imageUrl || "",
                isHtml: false,
              });
            }
          });
        }

        creativeContent = await extractCreativeText(allFiles);
      } else {
        if (uploadedFiles.length > 0) {
          const validFiles = uploadedFiles.filter(file => file.file) as any[];
          if (validFiles.length > 0) {
            creativeContent = await extractCreativeText(validFiles);
          }
        } else if (uploadedCreative?.url) {
          try {
            const response = await fetch(uploadedCreative.url);
            const html = await response.text();

            creativeContent = html
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
          } catch (error) {
            console.error('Error fetching saved creative content:', error);
            creativeContent = 'Creative content available but could not be extracted';
          }
        }
      }

      if (!creativeContent || creativeContent.length < 100) {
        alert("The creative content seems too short or irrelevant for AI to generate From/Subject lines. Please upload a different creative or edit manually.");
        return;
      }

      let creativeFileName = '';
      let creativeIndex = null;
      
      if (fromSubjectNavigationContext === "multiple" && editingCreativeIndex !== null) {
        const creative = multiCreatives[editingCreativeIndex];
        creativeFileName = creative.fileName || `creative-${editingCreativeIndex + 1}`;
        creativeIndex = editingCreativeIndex + 1;
      } else if (fromSubjectNavigationContext === "single" && uploadedFiles.length > 0) {
        creativeFileName = uploadedFiles[0].file?.name || uploadedFiles[0].displayName || 'single-creative';
        creativeIndex = 1;
      } else if (fromSubjectNavigationContext === "direct") {
        creativeFileName = 'global-campaign';
        creativeIndex = 0;
      }

      const enhancedContent = creativeContent + `

---
Creative Context:
- File: ${creativeFileName}
- Index: ${creativeIndex}
- Company: ${formData.companyName}
- Timestamp: ${new Date().toISOString()}
- Context: ${fromSubjectNavigationContext || 'unknown'}
`;

      const data = await getClaudeSuggestions({
        companyName: formData.companyName,
        offerId: formData.offerId,
        creativeType: formData.creativeType,
        notes: formData.otherRequest || '',
        creativeContent: enhancedContent,
        creativeFileName,
        creativeIndex: creativeIndex || undefined,
        timestamp: new Date().toISOString()
      });

      console.log('Claude API response:', data);

      if (!data.suggestions) {
        alert('No AI suggestions were generated. Please try again.');
        return;
      }

      const suggestions = data.suggestions;
      console.log('🔍 Claude Suggestions Raw Output:\n', suggestions);

      if (
        suggestions.includes("I cannot responsibly suggest") ||
        suggestions.includes("please provide more details") ||
        suggestions.includes("No meaningful content")
      ) {
        alert("AI could not generate suggestions due to lack of meaningful creative content. Please upload a creative with a clear offer or message.");
        return;
      }

      const fromLinesMatch = suggestions.match(/From.*?:\s*\n((?:\d+\.\s*[^\n]+\n?)+)/i);
      const subjectLinesMatch = suggestions.match(/Subject.*?:\s*\n((?:\d+\.\s*[^\n]+\n?)+)/i);

      const cleanList = (text: string) =>
        text
          .split('\n')
          .filter(line => line.trim())
          .map(line => line.replace(/^\d+\.\s*/, ''))
          .join('\n');


      let newFromLines: string[] = [];
      let newSubjectLines: string[] = [];

      if (fromLinesMatch) {
        newFromLines = cleanList(fromLinesMatch[1]).split('\n').filter(line => line.trim());
      }

      if (subjectLinesMatch) {
        newSubjectLines = cleanList(subjectLinesMatch[1]).split('\n').filter(line => line.trim());
      }

      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount < maxRetries) {
        const hasDuplicates = previousSuggestions.fromLines.length > 0 || previousSuggestions.subjectLines.length > 0 
          ? checkForDuplicates(newFromLines, newSubjectLines) 
          : false;
        
        if (!hasDuplicates) {
          break;
        }
        
        retryCount++;
        console.log(`⚠️ Duplicate suggestions detected (attempt ${retryCount}/${maxRetries}), regenerating...`);
        
        const duplicateWarning = `
⚠️ DUPLICATE DETECTED: The previous suggestions were too similar to existing ones.
Please generate COMPLETELY DIFFERENT suggestions that are unique and fresh.
Focus on different angles, tones, and approaches for this creative.
Avoid any lines that might be similar to previous suggestions.
        `;
        
        const retryEnhancedContent = enhancedContent + duplicateWarning;
        
        try {
          const retryData = await getClaudeSuggestions({
            companyName: formData.companyName,
            offerId: formData.offerId,
            creativeType: formData.creativeType,
            notes: formData.otherRequest || '',
            creativeContent: retryEnhancedContent,
            creativeFileName,
            creativeIndex: creativeIndex || undefined,
            timestamp: new Date().toISOString()
          });
          
          if (retryData.suggestions) {
            const retrySuggestions = retryData.suggestions;
            
            const retryFromLinesMatch = retrySuggestions.match(/From.*?:\s*\n((?:\d+\.\s*[^\n]+\n?)+)/i);
            const retrySubjectLinesMatch = retrySuggestions.match(/Subject.*?:\s*\n((?:\d+\.\s*[^\n]+\n?)+)/i);
            
            if (retryFromLinesMatch) {
              newFromLines = cleanList(retryFromLinesMatch[1]).split('\n').filter(line => line.trim());
            }
            
            if (retrySubjectLinesMatch) {
              newSubjectLines = cleanList(retrySubjectLinesMatch[1]).split('\n').filter(line => line.trim());
            }
            
            console.log(`✅ Retry ${retryCount} completed with ${newFromLines.length} From lines and ${newSubjectLines.length} Subject lines`);
          }
        } catch (retryError) {
          console.error(`❌ Retry ${retryCount} failed:`, retryError);
          break;
        }
      }
      
      if (retryCount > 0) {
        const finalHasDuplicates = checkForDuplicates(newFromLines, newSubjectLines);
        if (finalHasDuplicates) {
          alert(`Generated ${retryCount} new sets of suggestions, but some may still be similar. Consider manual editing for complete uniqueness.`);
        } else {
          console.log('✅ Duplicates resolved after retry');
        }
      }

      if (newFromLines.length > 0) {
        const fromLinesText = newFromLines.join('\n');
        if (fromSubjectNavigationContext === "single" || fromSubjectNavigationContext === "multiple") {
          setModalFromLine(fromLinesText);
        } else {
          setFromLine(fromLinesText);
        }
      }

      if (newSubjectLines.length > 0) {
        const subjectLinesText = newSubjectLines.join('\n');
        if (fromSubjectNavigationContext === "single" || fromSubjectNavigationContext === "multiple") {
          setModalSubjectLines(subjectLinesText);
        } else {
          setSubjectLines(subjectLinesText);
        }
      }

      setPreviousSuggestions(prev => ({
        fromLines: [...prev.fromLines, ...newFromLines],
        subjectLines: [...prev.subjectLines, ...newSubjectLines]
      }));

      if (!fromLinesMatch && !subjectLinesMatch) {
        const numberedLists = suggestions.match(/(\d+\.\s*[^\n]+\n?)+/g);
        if (numberedLists && numberedLists.length >= 2) {
          const firstList = cleanList(numberedLists[0]);
          const secondList = cleanList(numberedLists[1]);

          const fallbackFromLines = firstList.split('\n').filter(line => line.trim());
          const fallbackSubjectLines = secondList.split('\n').filter(line => line.trim());

          if (previousSuggestions.fromLines.length > 0 || previousSuggestions.subjectLines.length > 0) {
            const hasDuplicates = checkForDuplicates(fallbackFromLines, fallbackSubjectLines);
            if (hasDuplicates) {
              alert('Some fallback suggestions may be similar to previous ones. Consider regenerating for more variety.');
            }
          }

          if (fromSubjectNavigationContext === "single" || fromSubjectNavigationContext === "multiple") {
            setModalFromLine(firstList);
            setModalSubjectLines(secondList);
          } else {
            setFromLine(firstList);
            setSubjectLines(secondList);
          }

          setPreviousSuggestions(prev => ({
            fromLines: [...prev.fromLines, ...fallbackFromLines],
            subjectLines: [...prev.subjectLines, ...fallbackSubjectLines]
          }));
        }
      }

    } catch (error) {
      console.error('AI suggestion error:', error);
      alert(`Failed to get AI suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    setUploadedFiles([]);
    setUploadedCreative(null);
    setTempFileKey(null);
    setIsUploading(true);

    if (file.name.toLowerCase().endsWith(".zip")) {
      setIsZipProcessing(true);
      setZipError(null);
    }

    try {
      const uploadPromise = uploadToBlob(file);
      
      if (file.type === "text/html" || file.name.toLowerCase().endsWith(".html")) {
        const text = await file.text();
        setHtmlCode(text);

        let processedHtml = text;
        if (!processedHtml.includes("<html")) {
          processedHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>${processedHtml}</body></html>`;
        }

        const blob = new Blob([processedHtml], { type: "text/html" });
        const htmlUrl = URL.createObjectURL(blob);
        
        const originalUrl = await uploadPromise;
        setUploadedFiles([{ file, previewUrl: htmlUrl, originalUrl, isHtml: true }]);
        setTempFileKey(originalUrl);
      } else if (file.name.toLowerCase().endsWith(".zip")) {
        try {
          const creativesFound = await extractCreativesFromZip(file);

          if (creativesFound.length === 0) {
            setZipError("No valid creatives found in ZIP or nested ZIPs.");
            setIsZipProcessing(false);
            return;
          }

          console.log("ZIP processing results:", creativesFound);
          console.log("Number of creatives found:", creativesFound.length);
          console.log("Creatives breakdown:", {
            html: creativesFound.filter(c => c.type === "html").length,
            image: creativesFound.filter(c => c.type === "image").length
          });

          const originalUrl = await uploadPromise;

          if (uploadType === "multiple") {
            const creatives = creativesFound.map((c, idx) => ({
              id: idx,
              type: c.type,
              imageUrl: c.url, // Use the URL directly from extracted creative
              fromLine: "",
              subjectLine: "",
              notes: "",
              htmlContent: c.htmlContent || "",
            }));
            console.log("Created MultiCreatives:", creatives.length);
            setMultiCreatives(creatives);
            setOriginalZipFileName(file.name);
            setTempFileKey(originalUrl);
          } else {
            const firstHtml = creativesFound.find((c) => c.type === "html");
            console.log("First HTML found:", firstHtml);

            if (firstHtml) {
              const htmlContent = firstHtml.htmlContent || "";
              console.log("Processing HTML creative:", {
                hasContent: !!htmlContent,
                contentLength: htmlContent.length,
                containsImages: htmlContent.includes("data:image"),
                containsCSS: htmlContent.includes("<style"),
              });

              // Use the URL directly from the extracted creative instead of creating a new blob
              const htmlUrl = firstHtml.url;
              console.log("Using HTML URL directly:", htmlUrl);

              setHtmlCode(htmlContent);
              setUploadedFiles([{ file, previewUrl: htmlUrl, originalUrl, isHtml: true }]);
            } else {
              const firstImg = creativesFound.find((c) => c.type === "image");
              if (firstImg) {
                setUploadedFiles([
                  { file, previewUrl: firstImg.url, originalUrl, isHtml: false },
                ]);
              }
            }
            setTempFileKey(originalUrl);
          }
        } catch (err) {
          console.error("Error processing ZIP file:", err);
          setZipError(
            err instanceof Error
              ? err.message
              : "Unknown error while processing ZIP file"
          );
        }

        setIsZipProcessing(false);
      } else if (isImageFile(file)) {
        const originalUrl = await uploadPromise;
        
        let previewUrl: string;
        if (file.type.startsWith("image/")) {
          const compressed = await createCompressedPreview(file);
          previewUrl = URL.createObjectURL(compressed);
        } else {
          previewUrl = URL.createObjectURL(file);
        }
        setUploadedFiles([{ file, previewUrl, originalUrl, isHtml: false }]);
        setTempFileKey(originalUrl);
      } else {
        const originalUrl = await uploadPromise;
        setUploadedFiles([{ file, previewUrl: null, originalUrl }]);
        setTempFileKey(originalUrl);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload creative. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleNextStep = () => {
    const newErrors = validateFormData(formData, step);
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0 && step < 3) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
      setErrors({});
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!uploadedCreative && multiCreatives.length === 0) {
      alert("Please upload at least one creative before submitting.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const submissionPayload = {
        offer_id: formData.offerId,
        priority,
        contact_method: 'email',
        contact_info: formData.contactEmail,
        from_lines: fromLine || formData.fromLine,
        subject_lines: subjectLines || formData.subjectLines,
        other_request: formData.otherRequest,
        creatives: [] as Array<{
          file_url: string;
          file_key: string;
          original_filename: string;
          creative_from_lines: string | null;
          creative_subject_lines: string | null;
          creative_notes: string | null;
          creative_html_code: string | null;
        }>
      };

      multiCreatives.forEach((creative, index) => {
        console.log(`🔧 Creative ${index}:`, {
          fromLine: creative.fromLine,
          subjectLine: creative.subjectLine,
          notes: creative.notes
        });
      });

      
      if (uploadedCreative) {
        submissionPayload.creatives.push({
          file_url: uploadedCreative.url || '',
          file_key: uploadedCreative.name || 'creative',
          original_filename: uploadedCreative.name || 'creative',
          creative_from_lines: modalFromLine || null, 
          creative_subject_lines: modalSubjectLines || null, 
          creative_notes: creativeNotes || null,
          creative_html_code: htmlCode || null
        });
      }

      
      if (multiCreatives.length > 0) {
        multiCreatives.forEach((creative, index) => {
          submissionPayload.creatives.push({
            file_url: creative.imageUrl || '',
            file_key: `creative_${index + 1}`,
            original_filename: `creative_${index + 1}`,
            creative_from_lines: creative.fromLine || null,
            creative_subject_lines: creative.subjectLine || null,
            creative_notes: creative.notes || null,
            creative_html_code: creative.htmlContent || null
          });
        });
      }

      
      console.log("🔧 Submitting with payload:", {
        from_lines: submissionPayload.from_lines,
        subject_lines: submissionPayload.subject_lines,
        fromLine_state: fromLine,
        formData_fromLine: formData.fromLine,
        subjectLines_state: subjectLines,
        formData_subjectLines: formData.subjectLines,
        fromLine_length: fromLine?.length || 0,
        formData_fromLine_length: formData.fromLine?.length || 0,
        subjectLines_length: subjectLines?.length || 0,
        formData_subjectLines_length: formData.subjectLines?.length || 0
      });

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionPayload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save submission');
      }

      const result = await res.json();
      setTrackingLink(result.trackingLink);
      setIsSubmitting(false);
      setIsSubmitted(true);
      
      setTimeout(() => {
        handleResetForm();
      }, 2000);
    } catch (error) {
      console.error(error);
      alert(
        `An error occurred: ${error instanceof Error ? error.message : "Please try again."}`
      );
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    uploadedFiles.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    
    setIsSubmitted(false);
    setStep(1);
    setFormData({
      affiliateId: "",
      companyName: "",
      firstName: "",
      lastName: "",
      contactEmail: "",
      telegramId: "",
      offerId: "",
      creativeType: "",
      fromLine: "",
      subjectLines: "",
      otherRequest: "",
    });
    setUploadedFiles([]);
    setTrackingLink("");
    setErrors({});
    
    setFromLine("");
    setSubjectLines("");
    setModalFromLine("");
    setModalSubjectLines("");
    
    setUploadedCreative(null);
    setMultiCreatives([]);
    setCreativeNotes("");
    setHtmlCode("");
    setModalOpen(false);
    setSelectedOption("");
    setUploadType(null);
    setFromSubjectNavigationContext(null);
    
    setTempFileKey(null);
    setOriginalZipFileName("");
    setEditingCreativeIndex(null);
    setSavedMultiCreatives([]);
    setIsZipProcessing(false);
    setZipError(null);
    setPreviewedCreative(null);
    setPreviewImage(null);
    
    setIsCodeMaximized(false);
    setIsCodeMinimized(false);
    setIsRenaming(false);
    setTempFileName("");
    setIsDragOver(false);
    setIsUploading(false);
    setAiLoading(false);
    setTelegramCheckStatus("unchecked");
    
    setPriority("Moderate");
  };

  const openModal = (option: string, preserveExisting = false) => {
    
    setSelectedOption(option);
    
    if (option === "Single Creative") {
      setUploadType("single");
      // Set navigation context for single creative
      if (uploadedFiles.length > 0) {
        setFromSubjectNavigationContext("single");
      }
    } else if (option === "Multiple Creatives") {
      setUploadType("multiple");
      // Set navigation context for multiple creatives
      if (multiCreatives.length > 0) {
        setFromSubjectNavigationContext("multiple");
      }
    } else {
      if (option !== "From & Subject Lines") {
        setUploadType(null);
      }
    }

    if (option === "From & Subject Lines") {
      setFromLine(fromLine || formData.fromLine || "");
      setSubjectLines(subjectLines || formData.subjectLines || "");
      
      // Preserve the current navigation context if it exists
      if (fromSubjectNavigationContext === null) {
        const hasActiveUploads = uploadedFiles.length > 0 || multiCreatives.length > 0;
        const hasActiveUploadType = uploadType === "single" || uploadType === "multiple";
        
        if (uploadType === "single" && uploadedFiles.length > 0 && hasActiveUploads) {
          setFromSubjectNavigationContext("single");
        } else if (uploadType === "multiple" && multiCreatives.length > 0 && hasActiveUploads) {
          setFromSubjectNavigationContext("multiple");
        } else {
          setFromSubjectNavigationContext("direct");
        }
      }
    }

    if (!preserveExisting && option !== "From & Subject Lines") {
      setUploadedFiles([]);
      setTempFileKey(null);
      setHtmlCode("");
      setIsCodeMaximized(false);
      setIsCodeMinimized(false);

      setMultiCreatives([]);
      setOriginalZipFileName("");
      setEditingCreativeIndex(null);
      setSavedMultiCreatives([]);
      setIsZipProcessing(false);
      setZipError(null);
      setPreviewedCreative(null);
    }

    setModalOpen(true);
  };

  const deleteCreative = async (fileName: string, fileUrl?: string) => {
    try {
      if (fileUrl) {
        await fetch(`/api/creative/delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileUrl }),
        });
      }
      
      setUploadedCreative(null);
      setTempFileKey(null);
      
      console.log("Creative deleted:", fileName);
    } catch (error) {
      console.error("Error deleting creative:", error);
      throw error;
    }
  };

  const closeModal = async () => {
    if (editingCreativeIndex !== null) {
      const updated = [...multiCreatives];

      if (uploadedFiles[0]?.isHtml && htmlCode) {
        updated[editingCreativeIndex] = {
          ...updated[editingCreativeIndex],
          htmlContent: htmlCode,
        };
      } else if (!uploadedFiles[0]?.isHtml && uploadedFiles[0]?.previewUrl) {
        updated[editingCreativeIndex] = {
          ...updated[editingCreativeIndex],
          imageUrl: uploadedFiles[0].previewUrl,
        };
      }

      setMultiCreatives(updated);
      setEditingCreativeIndex(null);
    }

    uploadedFiles.forEach((f) => {
      if (f.previewUrl && f.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(f.previewUrl);
      }
    });

    if (uploadedFiles.length === 0) {
      setTempFileKey(null);
      setUploadedFiles([]);
      setIsUploading(false);
    }

    if (fromSubjectNavigationContext === "multiple") {
      setSelectedOption("Multiple Creatives");
      setUploadType("multiple");
    } else {
      setModalOpen(false);
      setSelectedOption("");
      setUploadType(null);
      // Only reset navigation context when actually closing the modal
      setFromSubjectNavigationContext(null);
    }
    
    setIsDragOver(false);

    if (selectedOption === "From & Subject Lines" || fromSubjectNavigationContext === "direct") {
      setFormData(prev => ({
        ...prev,
        fromLine: fromLine || prev.fromLine,
        subjectLines: subjectLines || prev.subjectLines
      }));
    } else {
      setFromLine("");
      setSubjectLines("");
    }
    setCreativeNotes("");
    setIsRenaming(false);
    setTempFileName("");
    setHtmlCode("");
    setIsCodeMaximized(false);
    setIsCodeMinimized(false);

    if (selectedOption !== "From & Subject Lines") {
      setMultiCreatives([]);
      setOriginalZipFileName("");
      setEditingCreativeIndex(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);

    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleMultipleCreativesSave = async () => {
    if (multiCreatives.length === 0) {
      alert("Please upload creatives before saving.");
      return;
    }

    if (!formData.offerId || !formData.creativeType) {
      alert("Please select an offer and creative type first.");
      return;
    }

    try {
      const fileUrl = uploadType === "multiple" ? tempFileKey : uploadedFiles[0]?.originalUrl;
      
      console.log("Saving creative with data:", {
        offerId: formData.offerId,
        creativeType: formData.creativeType,
        fromLine,
        subjectLines,
        multiCreativesCount: multiCreatives?.length || 0,
        fileUrl,
        uploadType,
        tempFileKey,
        uploadedFilesOriginalUrl: uploadedFiles[0]?.originalUrl
      });

      const creativeData = {
        offerId: formData.offerId,
        creativeType: formData.creativeType,
        fromLine,
        subjectLines,
        multiCreatives,
        fileUrl,
      };

      const res = await fetch("/api/creative/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creativeData),
      });

      if (!res.ok) {
        throw new Error("Failed to save creatives");
      }

      setUploadedCreative({
        name:
          originalZipFileName ||
          `Multiple Creatives (${multiCreatives.length} items)`,
        url: multiCreatives[0]?.imageUrl,
      });
      setSavedMultiCreatives([...multiCreatives]);
      setModalOpen(false);
      setStep(3);
    } catch (err) {
      console.error(err);
      alert("Failed to save creatives");
    }
  };

  const saveCreative = async () => {
    if (uploadedFiles.length === 0) {
      alert("Please upload a creative before saving.");
      return;
    }

    try {
      const creativeData = {
        offerId: formData.offerId,
        creativeType: formData.creativeType,
        fromLine: modalFromLine,
        subjectLines: modalSubjectLines,
        notes: creativeNotes,
        fileUrl: tempFileKey,
      };

      const res = await fetch("/api/creative/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creativeData),
      });

      if (!res.ok) {
        throw new Error("Failed to save creative");
      }

      if (editingCreativeIndex !== null) {
        
        const updated = [...multiCreatives];
        const currentCreative = updated[editingCreativeIndex];

        const updatedCreative = {
          ...currentCreative,
          fromLine: modalFromLine,
          subjectLine: modalSubjectLines,
          notes: creativeNotes,
        };

        if (uploadedFiles[0]?.isHtml && htmlCode) {
          updatedCreative.htmlContent = htmlCode;
        } else if (!uploadedFiles[0]?.isHtml && uploadedFiles[0]?.previewUrl) {
          updatedCreative.imageUrl = uploadedFiles[0].previewUrl;
        }

        updated[editingCreativeIndex] = updatedCreative;
        setMultiCreatives(updated);
        
        setEditingCreativeIndex(null);
        setUploadType("multiple");
        setSelectedOption("Multiple Creatives");
        setUploadedFiles([]);
        setHtmlCode("");
        setModalFromLine("");
        setModalSubjectLines("");
        setCreativeNotes("");
      } else {
        setUploadedCreative({
          name:
            uploadedFiles[0]?.file?.name ||
            "creative.html",
          url: uploadedFiles[0].previewUrl || undefined,
        });

        setModalOpen(false);
        setStep(3);
      }
    } catch (error) {
      console.error("Error saving creative:", error);
      alert("Could not save creative. Please try again.");
    }
  };

  const handleEditCreative = (creative: MultiCreative) => {
    const creativeIndex = multiCreatives.findIndex(c => c.id === creative.id);
    if (creativeIndex !== -1) {
      setEditingCreativeIndex(creativeIndex);
      
      const uploadedFile: UploadedFile = {
        file: new File([], `creative-${creativeIndex + 1}`, { type: creative.type === "html" ? "text/html" : "image/png" }),
        previewUrl: creative.imageUrl,
        displayName: `creative-${creativeIndex + 1}`,
        isHtml: creative.type === "html"
      };

      setUploadedFiles([uploadedFile]);
      
      if (creative.type === "html" && creative.htmlContent) {
        setHtmlCode(creative.htmlContent);
      } else if (creative.type === "html") {
        fetch(creative.imageUrl)
          .then(response => response.text())
          .then(html => {
            setHtmlCode(html);
          })
          .catch(error => {
            console.error('Error fetching HTML code:', error);
            setHtmlCode('<!-- HTML content could not be loaded -->');
          });
      }

      setCreativeNotes(creative.notes || "");
      setModalFromLine(creative.fromLine || "");
      setModalSubjectLines(creative.subjectLine || "");

      setFromSubjectNavigationContext("multiple");
      
      setUploadType("single");
      setModalOpen(true);
      
    }
  };

  const handleBackToMultiple = () => {
    setUploadType("multiple");
    setEditingCreativeIndex(null);
    setUploadedFiles([]);
    setHtmlCode("");
    setCreativeNotes("");
    setModalFromLine("");
    setModalSubjectLines("");
    setPreviewImage(null);
    setPreviewedCreative(null);
    // Don't reset navigation context when navigating between modals
    // Only reset when actually closing the modal
    
  };

  const handleBackToSingle = () => {
    
    if (fromSubjectNavigationContext === "single") {
      setSelectedOption("Single Creative");
      setUploadType("single");
      setModalOpen(true);
    } else if (fromSubjectNavigationContext === "multiple") {
      setSelectedOption("Single Creative");
      setUploadType("single");
      
      if (editingCreativeIndex !== null) {
        setModalOpen(true);
      } else {
        setModalOpen(false);
        setSelectedOption("");
        setUploadType(null);
      }
    } else if (fromSubjectNavigationContext === "direct") {
      setFormData(prev => ({
        ...prev,
        fromLine: fromLine || prev.fromLine,
        subjectLines: subjectLines || prev.subjectLines
      }));
      
      setModalOpen(false);
      setSelectedOption("");
      setUploadType(null);
    } else {
      setModalOpen(false);
      setSelectedOption("");
      setUploadType(null);
    }

    // Don't reset navigation context when navigating between modals
    // Only reset when actually closing the modal
  };

  return {
    step,
    errors,
    formData,
    offers,
    uploadedFiles,
    isSubmitting,
    isSubmitted,
    trackingLink,
    previewImage,
    previewedCreative,
    offerSearchTerm,
    modalOpen,
    selectedOption,
    uploadType,
    isDragOver,
    tempFileKey,
    isOfferDropdownOpen,
    isCreativeTypeDropdownOpen,
    fromLine,
    subjectLines,
    modalFromLine,
    modalSubjectLines,
    creativeNotes,
    uploadedCreative,
    isRenaming,
    tempFileName,
    htmlCode,
    isCodeMaximized,
    isCodeMinimized,
    multiCreatives,
    editingCreativeIndex,
    originalZipFileName,
    savedMultiCreatives,
    isZipProcessing,
    zipError,
    priority,
    aiLoading,
    isUploading,
    telegramCheckStatus,
    fromSubjectNavigationContext,
    previousSuggestions,

    setStep,
    setErrors,
    setFormData,
    setOffers,
    setUploadedFiles,
    setIsSubmitting,
    setIsSubmitted,
    setTrackingLink,
    setPreviewImage,
    setPreviewedCreative,
    setOfferSearchTerm,
    setModalOpen,
    setSelectedOption,
    setUploadType,
    setIsDragOver,
    setTempFileKey,
    setIsOfferDropdownOpen,
    setIsCreativeTypeDropdownOpen,
    setFromLine,
    setSubjectLines,
    setModalFromLine,
    setModalSubjectLines,
    setCreativeNotes,
    setUploadedCreative,
    setIsRenaming,
    setTempFileName,
    setHtmlCode,
    setIsCodeMaximized,
    setIsCodeMinimized,
    setMultiCreatives,
    setEditingCreativeIndex,
    setOriginalZipFileName,
    setSavedMultiCreatives,
    setIsZipProcessing,
    setZipError,
    setPriority,
    setAiLoading,
    setIsUploading,
    setTelegramCheckStatus,
    setFromSubjectNavigationContext,
    setPreviousSuggestions,

    handleInputChange,
    handleTelegramBlur,
    enhanceWithClaude,
    handleFileSelect,
    handleNextStep,
    handlePrevStep,
    handleSubmit,
    handleResetForm,
    openModal,
    closeModal,
    deleteCreative,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleMultipleCreativesSave,
    saveCreative,
    handleEditCreative,
    handleBackToMultiple,
    handleBackToSingle,
    formatFileSize,
  };
};