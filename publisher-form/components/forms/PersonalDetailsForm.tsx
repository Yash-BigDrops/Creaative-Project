"use client";

import React from "react";
import { CreativeFormData } from "@/types/creative";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PersonalDetailsFormProps {
  formData: CreativeFormData;
  errors: { [key: string]: string };
  handleInputChange: (field: string, value: string) => void;
}

export default function PersonalDetailsForm({
  formData,
  errors,
  handleInputChange,
}: PersonalDetailsFormProps) {
  return (
    <>
      <div className="space-y-2 animate-slide-in-left">
        <Label htmlFor="affiliateId" className="text-sm font-medium text-foreground">
          Affiliate ID
        </Label>
        <Input
          id="affiliateId"
          type="text"
          placeholder="Enter your affiliate ID"
          value={formData.affiliateId}
          onChange={(e) => handleInputChange("affiliateId", e.target.value)}
          className={`h-14 w-full transition-all duration-300 ${
            errors.affiliateId ? "border-destructive focus:ring-destructive" : ""
          }`}
        />
        {errors.affiliateId && (
          <p className="text-destructive text-sm animate-fade-in">
            {errors.affiliateId}
          </p>
        )}
      </div>

      <div className="space-y-2 animate-slide-in-left-delay">
        <Label htmlFor="companyName" className="text-sm font-medium text-foreground">
          Company Name
        </Label>
        <Input
          id="companyName"
          type="text"
          placeholder="Enter your company name"
          value={formData.companyName}
          onChange={(e) => handleInputChange("companyName", e.target.value)}
          className={`h-14 w-full transition-all duration-300 ${
            errors.companyName ? "border-destructive focus:ring-destructive" : ""
          }`}
        />
        {errors.companyName && (
          <p className="text-destructive text-sm animate-fade-in">
            {errors.companyName}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2 animate-slide-in-left-delay-2">
          <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
            First Name
          </Label>
          <Input
            id="firstName"
            type="text"
            placeholder="Enter your first name"
            value={formData.firstName}
            onChange={(e) => handleInputChange("firstName", e.target.value)}
            className={`h-14 w-full transition-all duration-300 ${
              errors.firstName ? "border-destructive focus:ring-destructive" : ""
            }`}
          />
          {errors.firstName && (
            <p className="text-destructive text-sm animate-fade-in">
              {errors.firstName}
            </p>
          )}
        </div>
        <div className="space-y-2 animate-slide-in-left-delay-3">
          <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
            Last Name
          </Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Enter your last name"
            value={formData.lastName}
            onChange={(e) => handleInputChange("lastName", e.target.value)}
            className={`h-14 w-full transition-all duration-300 ${
              errors.lastName ? "border-destructive focus:ring-destructive" : ""
            }`}
          />
          {errors.lastName && (
            <p className="text-destructive text-sm animate-fade-in">
              {errors.lastName}
            </p>
          )}
        </div>
      </div>
    </>
  );
} 