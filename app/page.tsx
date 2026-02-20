"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Editor from "@monaco-editor/react";
import axios from "axios";

type FileType = "code" | "video" | "audio" | "pdf" | "unsupported" | "";

export default function SuperApp() {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType>("");
  const [content, setContent] = useState<string>("");

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    const uploadedFile = acceptedFiles[0];
    setFile(uploadedFile);

    // Detect type
    if (
      uploadedFile.type.includes("text") ||
      uploadedFile.name.endsWith(".js") ||
      uploadedFile.name.endsWith(".ts") ||
      uploadedFile.name.endsWith(".py") ||
      uploadedFile.name.endsWith(".json")
    ) {
      setFileType("code");
      const reader = new FileReader();
      reader.onload = (e) => setContent((e.target?.result as string) || "");
      reader.readAsText(uploadedFile);
    } else if (uploadedFile.type.includes("video")) {
      setFileType("video");
      setContent(URL.createObjectURL(uploadedFile));
    } else if (uploadedFile.type.includes("audio")) {
      setFileType("audio");
      const url = URL.createObjectURL(uploadedFile);
      setContent(url);
    } else if (
      uploadedFile.type === "application/pdf" ||
      uploadedFile.name.endsWith(".pdf")
    ) {
      setFileType("pdf");
      setContent(URL.createObjectURL(uploadedFile));
    } else {
      setFileType("unsupported");
      setContent("");
    }

    // Send file to FastAPI backend
    const formData = new FormData();
    formData.append("file", uploadedFile); // must match UploadFile name

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("Backend response:", response.data);
    } catch (error) {
      console.error("Upload error:", error);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 p-4 border-r border-gray-700">
        <h1 className="text-2xl font-bold mb-6 text-blue-400">OmniDoc</h1>
        <div
          {...getRootProps()}
          className="border-2 border-dashed border-gray-500 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-700 transition"
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the file here...</p>
          ) : (
            <p>Drag &amp; drop or click to upload ANY file</p>
          )}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col">
        <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center px-6">
          <h2 className="text-lg">
            {file ? `Editing: ${file.name}` : "Workspace"}
          </h2>
          <input
            type="text"
            placeholder="Search within all documents..."
            className="ml-auto bg-gray-900 border border-gray-600 rounded px-4 py-1 w-96 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>

        <div className="flex-1 p-4 overflow-hidden relative">
          {!file && (
            <div className="flex h-full items-center justify-center text-gray-500">
              Upload a file to start processing
            </div>
          )}

          {fileType === "code" && (
            <Editor
              height="100%"
              theme="vs-dark"
              value={content}
              defaultLanguage="javascript"
              onChange={(val) => setContent(val || "")}
            />
          )}

          {fileType === "video" && (
            <div className="w-full h-full flex items-center justify-center">
              <video
                src={content}
                controls
                className="w-full h-full"
              />
            </div>
          )}

          {fileType === "audio" && (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <audio
                src={content}
                controls
                style={{ width: "80%" }}
                onError={(e) => console.error("HTML5 audio error:", e)}
              />
            </div>
          )}

          {fileType === "pdf" && (
            <iframe
              src={content}
              className="w-full h-full rounded bg-white"
              title={file?.name || "PDF"}
            />
          )}

          {fileType === "unsupported" && file && (
            <div className="flex h-full items-center justify-center text-gray-400">
              Unsupported file type: {file.name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
