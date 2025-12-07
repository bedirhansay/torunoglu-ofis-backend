import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

/**
 * Şifreyi hash'ler
 * @param password Plain text şifre
 * @returns Hash'lenmiş şifre
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Şifreyi doğrular
 * @param password Plain text şifre
 * @param hash Hash'lenmiş şifre
 * @returns Şifre eşleşiyorsa true
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Şifre güçlü mü kontrol eder
 * @param password Şifre
 * @returns Güçlü şifre ise true
 */
export function isPasswordStrong(password: string): boolean {
  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);

  return minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
}

