import React, { useId } from "react";
import "./Input.css";

interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: "text" | "email" | "password" | "url";
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  id?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  required = false,
  disabled = false,
  error,
  className = "",
  id,
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`input ${error ? "input--error" : ""}`}
      />
      {error && <span className="input-error">{error}</span>}
    </div>
  );
};

interface TextareaProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  id?: string;
  rows?: number;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  className = "",
  id,
  rows = 4,
}) => {
  const generatedId = useId();
  const textareaId = id || generatedId;

  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label htmlFor={textareaId} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        rows={rows}
        className={`input textarea ${error ? "input--error" : ""}`}
      />
      {error && <span className="input-error">{error}</span>}
    </div>
  );
};
