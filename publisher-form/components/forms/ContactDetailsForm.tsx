"use client";

import React from "react";
import { CreativeFormData, TelegramCheckStatus } from "@/types/creative";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { TELEGRAM_BOT_URL } from "@/constants/creative";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ContactDetailsFormProps {
  formData: CreativeFormData;
  errors: { [key: string]: string };
  telegramCheckStatus: TelegramCheckStatus;
  handleInputChange: (field: string, value: string) => void;
  handleTelegramBlur: () => void;
}

export default function ContactDetailsForm({
  formData,
  errors,
  telegramCheckStatus,
  handleInputChange,
  handleTelegramBlur,
}: ContactDetailsFormProps) {
  return (
    <>
      <div className="space-y-2 animate-fade-in">
        <Label htmlFor="contactEmail" className="text-sm font-medium text-foreground">
          Email ID
        </Label>
        <Input
          id="contactEmail"
          type="email"
          placeholder="Enter your email address"
          value={formData.contactEmail}
          onChange={(e) => handleInputChange("contactEmail", e.target.value)}
          className={`h-14 w-full transition-all duration-300 ${
            errors.contactEmail ? "border-destructive focus:ring-destructive" : ""
          }`}
        />
        {errors.contactEmail && (
          <p className="text-destructive text-sm animate-fade-in">
            {errors.contactEmail}
          </p>
        )}
      </div>

      <div className="space-y-2 animate-fade-in-delay">
        <Label htmlFor="telegramId" className="text-sm font-medium text-foreground">
          Telegram Username (Optional)
        </Label>
        <div className="relative">
          <Input
            id="telegramId"
            type="text"
            placeholder="Enter your Telegram username"
            value={formData.telegramId}
            onChange={(e) => handleInputChange("telegramId", e.target.value)}
            onBlur={handleTelegramBlur}
            className="h-14 w-full pr-20 transition-all duration-300"
          />
          
          <Button
            type="button"
            onClick={handleTelegramBlur}
            disabled={telegramCheckStatus === "checking"}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 px-4 text-sm font-medium"
            variant="default"
            size="sm"
          >
            {telegramCheckStatus === "checking" ? "Checking..." : "Check"}
          </Button>
        </div>

        {telegramCheckStatus === "checking" && (
          <p className="text-gray-500 text-sm">Checking Telegram connection...</p>
        )}

        {telegramCheckStatus === "unchecked" && formData.telegramId.trim() && (
          <p className="text-gray-500 text-sm">Click &quot;Check&quot; to verify your Telegram connection</p>
        )}

        {telegramCheckStatus === "not_started" && (
          <div className="mt-2 flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-800 font-medium">Telegram setup required</p>
              <p className="text-xs text-yellow-700 mt-0.5">
                Please follow these steps:
              </p>
              <ol className="text-xs text-yellow-700 mt-1 ml-4 list-decimal">
                <li>Click the &quot;Start Bot&quot; button below to open our bot</li>
                <li>Send <code className="bg-yellow-100 px-1 rounded">/start</code> to the bot</li>
                <li>Come back and click &quot;Check&quot; again</li>
              </ol>
              <div className="flex gap-2 mt-3">
                <Button
                  asChild
                  variant="default"
                  size="sm"
                >
                  <a
                    href={TELEGRAM_BOT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Start Bot
                  </a>
                </Button>
                <Button
                  type="button"
                  onClick={handleTelegramBlur}
                  variant="secondary"
                  size="sm"
                >
                  Check Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {telegramCheckStatus === "ok" && (
          <div className="mt-2 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-green-800 font-medium">Telegram connected!</p>
              <p className="text-xs text-green-700 mt-0.5">
                You&apos;ll receive notifications on Telegram when your submission is processed.
              </p>
              <button
                type="button"
                onClick={handleTelegramBlur}
                className="text-xs text-sky-600 underline mt-1 hover:text-sky-700"
              >
                Re-check connection
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 