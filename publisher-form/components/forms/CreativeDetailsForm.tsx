"use client";

import React, { useState, useMemo } from "react";
import { CreativeFormData, Priority, MultiCreative, UploadedFile } from "@/types/creative";
import { AlignJustify, File, FileArchive } from "lucide-react";
import { CREATIVE_TYPES } from "@/constants/creative";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


interface CreativeDetailsFormProps {
  formData: CreativeFormData;
  errors: { [key: string]: string };
  offers: string[];
  offerSearchTerm: string;
  isOfferDropdownOpen: boolean;
  isCreativeTypeDropdownOpen: boolean;
  priority: Priority;
  uploadedCreative: null | { name: string; url?: string };
  savedMultiCreatives: MultiCreative[];
  handleInputChange: (field: string, value: string) => void;
  setOfferSearchTerm: (term: string) => void;
  setIsOfferDropdownOpen: (open: boolean) => void;
  setIsCreativeTypeDropdownOpen: (open: boolean) => void;
  setPriority: (priority: Priority) => void;
  openModal: (option: string, preserveExisting?: boolean) => void;
  setUploadType: (type: "single" | "multiple" | null) => void;
  setMultiCreatives: (creatives: MultiCreative[]) => void;
  setUploadedFiles: (files: UploadedFile[]) => void;
  setUploadedCreative: (creative: null | { name: string; url?: string }) => void;
  setTempFileKey: (key: string | null) => void;
  deleteCreative: (fileName: string) => void;
}

export default function CreativeDetailsForm({
  formData,
  errors,
  offers,
  offerSearchTerm,
  isOfferDropdownOpen,
  isCreativeTypeDropdownOpen,
  priority,
  uploadedCreative,
  savedMultiCreatives,
  handleInputChange,
  setOfferSearchTerm,
  setIsOfferDropdownOpen,
  setIsCreativeTypeDropdownOpen,
  setPriority,
  openModal,
  setUploadType,
  setMultiCreatives,
  setUploadedFiles,
  setUploadedCreative,
  setTempFileKey,
  deleteCreative,
  }: CreativeDetailsFormProps) {
  const filteredOffers = useMemo(() => {
    if (!offerSearchTerm) return offers;
    return offers.filter((offerId: string) =>
      offerId.toLowerCase().includes(offerSearchTerm.toLowerCase())
    );
  }, [offers, offerSearchTerm]);

  
  return (
    <>
      <div className="space-y-2 animate-fade-in relative">
        <Label htmlFor="offerSearch" className="text-sm font-medium text-foreground">
          Search Offers
        </Label>
        <Select
          value={formData.offerId}
          onValueChange={(value) => handleInputChange("offerId", value)}
        >
          <SelectTrigger className={`!min-h-[56px] !py-3 data-[size=default]:!h-14 w-full ${errors.offerId ? "border-red-500 focus:ring-red-500" : ""}`}>
            <SelectValue placeholder="Select an offer" />
          </SelectTrigger>
          <SelectContent>
            <div className="p-2">
              <Input
                placeholder="Search offers..."
                className="mb-2"
                value={offerSearchTerm}
                onChange={(e) => setOfferSearchTerm(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            {filteredOffers.length === 0 ? (
              <div className="flex items-center justify-center px-4 py-6 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-500 mr-2"></div>
                <span className="text-sm">Loading offers...</span>
              </div>
            ) : (
              filteredOffers.map((offerId: string) => (
                <SelectItem key={offerId} value={offerId}>
                  Offer ID: {offerId}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>



        {errors.offerId && (
          <p className="text-red-500 text-sm animate-fade-in">
            {errors.offerId}
          </p>
        )}
      </div>

      <div className="space-y-2 animate-fade-in-delay relative">
        <Label htmlFor="creativeType" className="text-sm font-medium text-foreground">
          Creative Type
        </Label>
        <Select
          value={formData.creativeType}
          onValueChange={(value) => handleInputChange("creativeType", value)}
        >
          <SelectTrigger className={`!min-h-[56px] !py-3 data-[size=default]:!h-14 w-full ${errors.creativeType ? "border-red-500 focus:ring-red-500" : ""}`}>
            <SelectValue placeholder="Select creative type" />
          </SelectTrigger>
          <SelectContent>
            {CREATIVE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>



        {errors.creativeType && (
          <p className="text-red-500 text-sm animate-fade-in">
            {errors.creativeType}
          </p>
        )}
      </div>

      {uploadedCreative ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border border-gray-200 rounded-lg p-3 bg-gray-50 gap-3 sm:gap-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-700">
                Creative Uploaded
              </p>
              <p className="text-sm text-gray-600 truncate">
                {uploadedCreative.name}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {savedMultiCreatives.length > 1 && (
                <Button
                  type="button"
                  onClick={() => {
                    openModal("Multiple Creatives", true);
                    setUploadType("multiple");
                    setMultiCreatives([...savedMultiCreatives]);
                  }}
                  variant="outline"
                  size="sm"
                  className="border-yellow-400 text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
                >
                  Edit
                </Button>
              )}

              <Button
                type="button"
                onClick={() => {
                  openModal("Single Creative", true);
                  setUploadType("single");
                }}
                variant="outline"
                size="sm"
                className="border-sky-400 text-sky-700 bg-sky-50 hover:bg-sky-100"
              >
                Edit
              </Button>

              <Button
                type="button"
                onClick={() => {
                  setTempFileKey(null);
                  deleteCreative(uploadedCreative.name);
                }}
                variant="outline"
                size="sm"
                className="border-red-400 text-red-700 bg-red-50 hover:bg-red-100"
              >
                Remove
              </Button>
            </div>
          </div>

          {(savedMultiCreatives.length > 0 || uploadedCreative) && formData.creativeType.toLowerCase() === "email" && (
            <Button
              type="button"
              onClick={() => openModal("From & Subject Lines")}
              variant="outline"
              className="w-full h-14 justify-start gap-2"
            >
              <AlignJustify className="h-4 w-4 text-gray-600" />
              <span>From & Subject Lines</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 animate-fade-in-delay-2">
          <Button
            type="button"
            onClick={() => openModal("Single Creative")}
            variant="outline"
            className="flex-1 h-14 justify-start gap-2"
          >
            <File className="h-4 w-4 text-gray-600" />
            <span>Single Creative</span>
          </Button>
          <Button
            type="button"
            onClick={() => openModal("Multiple Creatives")}
            variant="outline"
            className="flex-1 h-14 justify-start gap-2"
          >
            <FileArchive className="h-4 w-4 text-gray-600" />
            <span>Multiple Creatives</span>
          </Button>
          {formData.creativeType.toLowerCase() === "email" && (
            <Button
              type="button"
              onClick={() => openModal("From & Subject Lines")}
              variant="outline"
              className="flex-1 h-14 justify-start gap-2"
            >
              <AlignJustify className="h-4 w-4 text-gray-600" />
              <span>From & Subject Lines</span>
            </Button>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 mb-6 animate-fade-in-delay-2">
        <Label className="text-sm font-medium text-foreground">
          Set Priority:
        </Label>
        <div className="flex border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
          <Button
            type="button"
            variant={priority === "High" ? "default" : "ghost"}
            className={`h-12 px-4 relative overflow-hidden transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 ${
              priority === "High" ? "shadow-lg" : ""
            }`}
            onClick={() => setPriority("High")}
          >
            <span className="relative z-10 font-medium">High</span>
            {priority === "High" && (
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/40 animate-pulse opacity-20"></div>
            )}
          </Button>
          <Button
            type="button"
            variant={priority === "Moderate" ? "default" : "ghost"}
            className={`h-12 px-4 relative overflow-hidden transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 ${
              priority === "Moderate" ? "shadow-lg" : ""
            }`}
            onClick={() => setPriority("Moderate")}
          >
            <span className="relative z-10 font-medium">Moderate</span>
            {priority === "Moderate" && (
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/40 animate-pulse opacity-20"></div>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2 animate-fade-in-delay-3">
        <Label htmlFor="otherRequest" className="text-sm font-medium text-foreground">
          Additional Notes for Client
        </Label>
        <Textarea
          id="otherRequest"
          placeholder="Enter any additional notes or requests"
          value={formData.otherRequest}
          onChange={(e) => handleInputChange("otherRequest", e.target.value)}
          className="w-full min-h-[100px] resize-none transition-all duration-300"
        />
      </div>


    </>
  );
} 