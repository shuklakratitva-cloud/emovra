// backend/utils/phoneValidation.js
//
// Real format validation using libphonenumber-js (free, offline, no API
// key or signup needed - it's just a library of real phone number
// patterns per country, the same data Google/WhatsApp/etc use).
//
// IMPORTANT: this confirms a number is a plausible, correctly-formatted
// real phone number for its country (right length, right prefix ranges) -
// it does NOT confirm the number actually belongs to the person entering
// it, or that it's currently reachable. That would need real SMS/call
// verification (a paid gateway + DLT registration for Indian numbers -
// see the note in routes/auth.js). This is a free improvement over the
// previous "is it 7-15 digits" check, not a replacement for real
// ownership verification.

import { isValidPhoneNumber } from "libphonenumber-js";

/**
 * @param {string} countryCode - e.g. "+91"
 * @param {string} digitsOnly - phone number digits, no country code, no symbols
 * @returns {boolean}
 */
export function isPlausiblePhoneNumber(countryCode, digitsOnly) {
  if (!countryCode || !digitsOnly) return false;
  try {
    const full = `${countryCode}${digitsOnly}`;
    return isValidPhoneNumber(full);
  } catch {
    return false;
  }
}
