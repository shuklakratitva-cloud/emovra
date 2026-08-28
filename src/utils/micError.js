// src/utils/micError.js
//
// getUserMedia()/MediaRecorder can fail for several unrelated reasons -
// permission actually denied, no microphone connected, the mic already
// in use by another app, or something else entirely. Previously every
// caller showed the same "Mic access blocked, allow permission" message
// no matter which of these happened, which is actively misleading when
// the site's mic permission is already set to Allowed (the message tells
// the user to do something that won't fix anything).
//
// This maps the real DOMException name to the right i18n key so the
// message the user sees actually matches what went wrong.
export function getMicErrorKey(err, prefix) {
  const name = err?.name || "";

  if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") {
    // Permission genuinely denied (site-level or OS-level).
    return `${prefix}.micBlocked`;
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    // No microphone device available at all.
    return `${prefix}.micNotFound`;
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    // A device exists but couldn't be opened - usually another app has it.
    return `${prefix}.micInUse`;
  }
  // Anything else (unsupported mimeType, AudioContext failure, etc).
  return `${prefix}.micGenericError`;
}
