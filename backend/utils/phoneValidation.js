import { isValidPhoneNumber } from "libphonenumber-js";

export function isPlausiblePhoneNumber(countryCode, digitsOnly) {
  if (!countryCode || !digitsOnly) return false;
  try {
    const full = `${countryCode}${digitsOnly}`;
    return isValidPhoneNumber(full);
  } catch {
    return false;
  }
}
