"use client";

import { useState } from "react";

const documents = [
  { value: "identity_front", label: "Identity document — front" },
  { value: "identity_back", label: "Identity document — back" },
  { value: "selfie", label: "Selfie (optional)" },
  { value: "business_registration", label: "Business registration (optional)" },
  { value: "address_proof", label: "Address proof (optional)" },
] as const;

export default function VerificationDocumentUpload() {
  const [documentType, setDocumentType] = useState("identity_front");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function upload() {
    if (!file) {
      setMessage("Choose a document first.");
      return;
    }

    setBusy(true);
    setMessage("");

    const form = new FormData();
    form.append("document_type", documentType);
    form.append("file", file);

    try {
      const response = await fetch("/api/seller/verification/document", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed.");

      setFile(null);
      const input = document.getElementById("verification-file") as HTMLInputElement | null;
      if (input) input.value = "";
      setMessage("Document uploaded securely.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="account-card verification-upload">
      <h2>Secure documents</h2>
      <p className="seller-field-help">
        Files are stored in a private verification bucket. Maximum 5 MB per file. Accepted: JPG, PNG, WebP and PDF where applicable.
      </p>
      <label className="seller-field">
        <span>Document type</span>
        <select value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
          {documents.map((document) => (
            <option key={document.value} value={document.value}>{document.label}</option>
          ))}
        </select>
      </label>
      <label className="seller-field">
        <span>File</span>
        <input
          id="verification-file"
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>
      <button className="button button-primary" type="button" onClick={upload} disabled={busy || !file}>
        {busy ? "Uploading..." : "Upload securely"}
      </button>
      {message && <p className="seller-field-help" role="status">{message}</p>}
    </div>
  );
}
