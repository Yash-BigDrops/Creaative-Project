"use client";

import React from "react";
import Image from "next/image";
import { useCreativeForm } from "@/hooks/useCreativeForm";
import PersonalDetailsForm from "@/components/forms/PersonalDetailsForm";
import ContactDetailsForm from "@/components/forms/ContactDetailsForm";
import CreativeDetailsForm from "@/components/forms/CreativeDetailsForm";
import SuccessScreen from "@/components/screens/SuccessScreen";
import SingleUploadModal from "@/components/modals/SingleUploadModal";
import MultipleUploadModal from "@/components/modals/MultipleUploadModal";
import CreativeModal from "@/components/modals/CreativeModal";
import FromSubjectModal from "@/components/modals/FromSubjectModal";
import { STEP_LABELS } from "@/constants/creative";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function CreativeForm() {
  const {
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
    priority,
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
    aiLoading,
    isUploading,
    telegramCheckStatus,
    fromSubjectNavigationContext,
    handleInputChange,
    handleTelegramBlur,
    enhanceWithClaude,
    handleFileSelect,
    handleNextStep,
    handlePrevStep,
    handleSubmit,
    handleResetForm,
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
    setPriority,
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
    setAiLoading,
    setIsUploading,
    setTelegramCheckStatus,
    setUploadedFiles,
    setUploadedCreative,
    openModal,
    handleEditCreative,
    handleBackToMultiple,
    handleBackToSingle,
    closeModal,
    deleteCreative,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleMultipleCreativesSave,
    saveCreative,
  } = useCreativeForm();

  if (isSubmitted) {
    return (
      <SuccessScreen
        trackingLink={trackingLink}
        handleResetForm={handleResetForm}
      />
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-6 sm:py-12 animate-fade-in"
      style={{
        backgroundImage: "url('/images/Background.png')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="mb-6 sm:mb-8 animate-slide-down">
        <Image
          src="/images/logo.svg"
          alt="Big Drops Marketing Group"
          width={48}
          height={48}
          className="h-10 sm:h-12 w-auto transition-transform hover:scale-105 duration-300"
        />
      </div>

      <Card className="w-full max-w-3xl animate-slide-up hover:shadow-xl transition-all duration-500">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-4xl font-bold text-gray-900 leading-snug animate-fade-in-delay">
            Submit Your Creatives For Approval
          </CardTitle>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed animate-fade-in-delay-2">
            Upload your static images or HTML creatives with offer details to
            begin the approval process. Our team will review and notify you
            shortly.
          </p>
          <p className="text-base sm:text-lg font-semibold text-primary animate-fade-in-delay-3">
            Step {step} of 3: {STEP_LABELS[step as keyof typeof STEP_LABELS]}
          </p>
          <div
            className="w-full border-b border-primary/20"
            style={{
              marginTop: "24px",
            }}
          ></div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {step === 1 && (
              <PersonalDetailsForm
                formData={formData}
                errors={errors}
                handleInputChange={handleInputChange}
              />
            )}

            {step === 2 && (
              <ContactDetailsForm
                formData={formData}
                errors={errors}
                telegramCheckStatus={telegramCheckStatus}
                handleInputChange={handleInputChange}
                handleTelegramBlur={handleTelegramBlur}
              />
            )}

            {step === 3 && (
              <CreativeDetailsForm
                formData={formData}
                errors={errors}
                offers={offers}
                offerSearchTerm={offerSearchTerm}
                isOfferDropdownOpen={isOfferDropdownOpen}
                isCreativeTypeDropdownOpen={isCreativeTypeDropdownOpen}
                priority={priority}
                uploadedCreative={uploadedCreative}
                savedMultiCreatives={savedMultiCreatives}
                handleInputChange={handleInputChange}
                setOfferSearchTerm={setOfferSearchTerm}
                setIsOfferDropdownOpen={setIsOfferDropdownOpen}
                setIsCreativeTypeDropdownOpen={setIsCreativeTypeDropdownOpen}
                setPriority={setPriority}
                openModal={openModal}
                setUploadType={setUploadType}
                setMultiCreatives={setMultiCreatives}
                setUploadedFiles={setUploadedFiles}
                setUploadedCreative={setUploadedCreative}
                setTempFileKey={setTempFileKey}
                deleteCreative={deleteCreative}
              />
            )}

            <div className="flex flex-col pt-4 gap-4 animate-fade-in-delay-4">
              {step === 1 && (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full h-14"
                  size="lg"
                >
                  Save & Add Contact Details
                </Button>
              )}
              {step === 2 && (
                <>
                  <Button
                    type="button"
                    onClick={handlePrevStep}
                    variant="outline"
                    className="w-full h-14"
                    size="lg"
                  >
                    Edit Personal Details
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full h-14"
                    size="lg"
                  >
                    Save & Add Contact Details
                  </Button>
                </>
              )}
              {step === 3 && (
                <>
                  <Button
                    type="button"
                    onClick={handlePrevStep}
                    variant="outline"
                    className="w-full h-14"
                    size="lg"
                  >
                    Edit Contact Details
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      "Submit Creative"
                    )}
                  </Button>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {previewImage && (
        <div
          className="fixed inset-0 fullscreen-modal bg-black bg-opacity-80 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => {
            setPreviewImage(null);
            setPreviewedCreative(null);
          }}
          style={{ overflowY: 'auto' }}
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh] animate-scale-in fullscreen-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {previewedCreative?.type === "html" || uploadedFiles[0]?.isHtml ? (
              <iframe
                src={previewImage}
                className="w-[90vw] h-[90vh] border-0 bg-white rounded-md shadow-lg"
                title="HTML Full Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              />
            ) : (
              <Image
                src={previewImage}
                alt="Full Preview"
                width={1200}
                height={900}
                className="h-auto w-auto max-h-[85vh] max-w-[85vw] rounded-md shadow-lg object-contain bg-gray-50 p-4"
              />
            )}

            <Button
              onClick={() => {
                setPreviewImage(null);
                setPreviewedCreative(null);
              }}
              variant="destructive"
              size="sm"
              className="absolute -top-3 -right-3 rounded-full p-2 shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center modal-backdrop animate-fade-in p-2 sm:p-4"
          onClick={closeModal}
          style={{ overflowY: 'auto' }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-[95vw] lg:max-w-[90vw] xl:max-w-[85vw] h-auto lg:h-[95vh] overflow-hidden relative animate-scale-in modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '95vh' }}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                {/* Back button only when editing from multiple uploads */}
                {editingCreativeIndex !== null && (
                  <Button
                    onClick={() => {
                      // Go back to multiple uploads
                      setUploadType("multiple");
                      setEditingCreativeIndex(null);
                      setUploadedFiles([]);
                      setHtmlCode("");
                      setCreativeNotes("");
                      setModalFromLine("");
                      setModalSubjectLines("");
                      setPreviewImage(null);
                      setPreviewedCreative(null);
                    }}
                    variant="ghost"
                    size="sm"
                    className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200 group"
                    title="Back to Multiple Creatives"
                  >
                    <svg className="h-5 w-5 text-gray-500 group-hover:text-gray-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </Button>
                )}
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                    {uploadType === "single" && "Upload Single Creative"}
                    {uploadType === "multiple" && "Upload Multiple Creatives"}
                    {!uploadType && selectedOption}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {uploadType === "single" && "Upload and configure a single creative file"}
                    {uploadType === "multiple" && "Upload and manage multiple creative files"}
                    {!uploadType && "Configure your creative settings"}
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
                <X className="h-5 w-5 text-gray-500 group-hover:text-gray-700 transition-colors" />
              </Button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-3 sm:p-4 lg:p-6" style={{ maxHeight: 'calc(95vh - 100px)' }}>

            {(uploadType === "single" || uploadType === "multiple") && (
              <>
                {uploadType === "single" && uploadedFiles.length > 0 ? (
                  <SingleUploadModal
                    uploadedFiles={uploadedFiles}
                    htmlCode={htmlCode}
                    isCodeMaximized={isCodeMaximized}
                    isCodeMinimized={isCodeMinimized}
                    isRenaming={isRenaming}
                    tempFileName={tempFileName}
                    creativeNotes={creativeNotes}
                    modalFromLine={modalFromLine}
                    modalSubjectLines={modalSubjectLines}
                    previewImage={previewImage}
                    setPreviewImage={setPreviewImage}
                    setHtmlCode={setHtmlCode}
                    setIsCodeMaximized={setIsCodeMaximized}
                    setIsCodeMinimized={setIsCodeMinimized}
                    setIsRenaming={setIsRenaming}
                    setTempFileName={setTempFileName}
                    setCreativeNotes={setCreativeNotes}
                    setModalFromLine={setModalFromLine}
                    setModalSubjectLines={setModalSubjectLines}
                    setUploadedFiles={setUploadedFiles}
                    handleFileSelect={handleFileSelect}
                    openModal={openModal}
                    closeModal={closeModal}
                    saveCreative={saveCreative}
                    isFromMultiple={editingCreativeIndex !== null}
                  />
                ) : uploadType === "multiple" && multiCreatives.length > 0 ? (
                  <MultipleUploadModal
                    multiCreatives={multiCreatives}
                    isZipProcessing={isZipProcessing}
                    zipError={zipError}
                    isDragOver={isDragOver}
                    isUploading={isUploading}
                    previewImage={previewImage}
                    previewedCreative={previewedCreative}
                    setPreviewImage={setPreviewImage}
                    setPreviewedCreative={setPreviewedCreative}
                    setMultiCreatives={setMultiCreatives}
                    handleFileSelect={handleFileSelect}
                    handleDragOver={handleDragOver}
                    handleDragLeave={handleDragLeave}
                    handleDrop={handleDrop}
                    handleMultipleCreativesSave={handleMultipleCreativesSave}
                    onEditCreative={handleEditCreative}
                    openModal={openModal}
                    setUploadType={setUploadType}
                    setUploadedCreative={setUploadedCreative}
                    setHtmlCode={setHtmlCode}
                  />
                ) : (
                  <CreativeModal
                    uploadedFiles={uploadedFiles}
                    isDragOver={isDragOver}
                    isUploading={isUploading}
                    handleFileSelect={handleFileSelect}
                    handleDragOver={handleDragOver}
                    handleDragLeave={handleDragLeave}
                    handleDrop={handleDrop}
                  />
                )}
              </>
            )}

            {!uploadType && selectedOption === "From & Subject Lines" && (
              <FromSubjectModal
                fromLine={fromLine}
                subjectLines={subjectLines}
                aiLoading={aiLoading}
                setFromLine={setFromLine}
                setSubjectLines={setSubjectLines}
                enhanceWithClaude={enhanceWithClaude}
                closeModal={closeModal}
                onBackToSingle={handleBackToSingle}
                navigationContext={fromSubjectNavigationContext}
              />
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 