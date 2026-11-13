import argon2 from "argon2";

const ARGON2_OPTIONS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MiB
  timeCost: 3,
  parallelism: 1,
};

export const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: /[A-Z]/,
  requireLowercase: /[a-z]/,
  requireNumber: /[0-9]/,
  requireSpecial: /[!@#$%^&()\-_=+\[\]{};':"\\|,.<>\/?`~]/,
};

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  if (password.length < PASSWORD_POLICY.minLength)
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters`);
  if (!PASSWORD_POLICY.requireUppercase.test(password))
    errors.push("Password must contain at least one uppercase letter");
  if (!PASSWORD_POLICY.requireLowercase.test(password))
    errors.push("Password must contain at least one lowercase letter");
  if (!PASSWORD_POLICY.requireNumber.test(password))
    errors.push("Password must contain at least one number");
  if (!PASSWORD_POLICY.requireSpecial.test(password))
    errors.push("Password must contain at least one special character");
  return { valid: errors.length === 0, errors };
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

export async function isPasswordReused(
  password: string,
  recentHashes: string[],
): Promise<boolean> {
  for (const hash of recentHashes) {
    if (await argon2.verify(hash, password)) return true;
  }
  return false;
}
