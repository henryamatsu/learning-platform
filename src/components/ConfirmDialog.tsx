"use client";

import React from "react";
import { Button } from "./ui/Button";
import { Card, CardHeader, CardContent, CardFooter } from "./ui/Card";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "primary" | "secondary" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="confirm-dialog-overlay" onClick={handleBackdropClick}>
      <Card className="confirm-dialog">
        <CardHeader>
          <h3 className="confirm-dialog__title">{title}</h3>
        </CardHeader>

        <CardContent>
          <p className="confirm-dialog__message">{message}</p>
        </CardContent>

        <CardFooter>
          <div className="confirm-dialog__actions">
            <Button
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button
              variant={confirmVariant}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "Processing..." : confirmText}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
