// Same rule as the server's profile endpoint: 10–15 digits, optional leading +.
export const isValidPhone = (phone: string) => {
  const clean = phone.replace(/[\s()-]/g, "");
  return /^\+?[0-9]{10,15}$/.test(clean);
};

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
