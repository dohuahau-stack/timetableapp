# Security and data handling

This document describes behavior visible in this repository. It is not a security certification or a substitute for an independent audit.

## Data flows

- Timetable, to-do, and settings state are read and written by the Rust backend under the operating system's app-data directory. Writes use a temporary file and rename; invalid state files are copied aside before defaults are loaded.
- The Gemini API key is stored in the app's local JSON state. It is sent in the `x-goog-api-key` header only for the Gemini API request. Anyone with access to the Windows account/files may be able to read local app data; this implementation does not use Windows Credential Manager.
- Excel import reads workbook sheet values and sends the extracted text plus the user's prompt to Google's Gemini API. Do not import confidential workbooks unless you intend to send their contents to Google.
- The app does not include an application server or telemetry endpoint. Gemini requests are the explicit external data flow for AI import.

## Review checklist

1. Inspect `src-tauri/capabilities/default.json` for frontend permissions.
2. Inspect `src-tauri/src/lib.rs` for exposed Tauri commands and `src-tauri/src/excel_ai.rs` for network requests and workbook parsing.
3. Search for secrets before publishing: `git grep -n -I -E 'AIza[0-9A-Za-z_-]{30,}|x-goog-api-key|api[_-]?key\s*[:=]'` (review matches; the header name in source is expected).
4. Build from source with `npm install`, `npm run typecheck`, `npm run build`, and `npm run tauri dev`.
5. Review dependency changes and generated installers before using them. Prefer signed, reproducible releases with published checksums.

## Vulnerability reports

Use GitHub's private Security Advisories for this repository when available. Do not include API keys, private workbooks, personal data, or exploit steps in public issues. Revoke any exposed Gemini key in Google AI Studio immediately.

## Current assurance

The repository is published for source review. No independent penetration test, formal verification, or third-party security certification is claimed. Source availability helps inspection but alone does not prove an application is safe.
