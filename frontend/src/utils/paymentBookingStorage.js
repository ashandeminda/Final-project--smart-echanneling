const APPOINTMENT_PAYMENT_STORAGE_KEY = "appointment-payment-booking";
const APPOINTMENT_BOOKING_PAGE_STORAGE_KEY = "appointment-booking-page";
const TELEMEDICINE_BOOKING_STORAGE_KEY = "telemedicine-booking-draft";

const readStorage = (key) => {
  try {
    const value = sessionStorage.getItem(key);
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
};

const writeStorage = (key, value) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures and keep the flow usable.
  }
};

const clearStorage = (key) => {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Ignore storage failures and keep the flow usable.
  }
};

export const getStoredAppointmentPaymentData = () =>
  readStorage(APPOINTMENT_PAYMENT_STORAGE_KEY);

export const setStoredAppointmentPaymentData = (value) =>
  writeStorage(APPOINTMENT_PAYMENT_STORAGE_KEY, value);

export const clearStoredAppointmentPaymentData = () =>
  clearStorage(APPOINTMENT_PAYMENT_STORAGE_KEY);

export const getStoredBookingPageState = () =>
  readStorage(APPOINTMENT_BOOKING_PAGE_STORAGE_KEY);

export const setStoredBookingPageState = (value) =>
  writeStorage(APPOINTMENT_BOOKING_PAGE_STORAGE_KEY, value);

export const clearStoredBookingPageState = () =>
  clearStorage(APPOINTMENT_BOOKING_PAGE_STORAGE_KEY);

export const getStoredTelemedicineBookingDraft = () =>
  readStorage(TELEMEDICINE_BOOKING_STORAGE_KEY);

export const setStoredTelemedicineBookingDraft = (value) =>
  writeStorage(TELEMEDICINE_BOOKING_STORAGE_KEY, value);

export const clearStoredTelemedicineBookingDraft = () =>
  clearStorage(TELEMEDICINE_BOOKING_STORAGE_KEY);
