import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and, isNull, desc, sql } from "drizzle-orm";
import { setCookie, deleteCookie } from "hono/cookie";
import { db } from "../db";
import {
  usersTable,
  emailOtpsTable,
  passwordResetTokensTable,
  passwordHistoryTable,
} from "../db/schema";
import {
  hashPassword,
  verifyPassword,
  validatePassword,
  isPasswordReused,
} from "../services/password";
import { generateOtp, hashOtp, verifyOtp } from "../services/otp";
import { generateResetToken, hashToken } from "../services/token";
import { signAccessToken, signRefreshToken } from "../services/jwt";
import {
  sendOtpEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} from "../services/email";
import { logAuditEvent } from "../services/audit";
import { rateLimiter } from "../middleware/rate-limiter";
import { requireJwt, type JwtContextVariables } from "../middleware/auth-jwt";
import { env } from "../config/env";

export const authRouter = new Hono<{ Variables: JwtContextVariables }>();

// ── Validation Schemas ──────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().max(120).optional(),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must be 6 digits"),
});

const resendOtpSchema = z.object({
  email: z.string().email(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const validateResetTokenSchema = z.object({
  token: z.string().min(32).max(128),
});

const resetPasswordSchema = z.object({
  token: z.string().min(32).max(128),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// ── Helpers ────────────────────────────────────────────────────────────────

function getClientMeta(c: any) {
  const forwarded = c.req.header("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : c.req.header("x-real-ip") || "unknown";
  return {
    ipAddress: ip,
    userAgent: c.req.header("user-agent") || undefined,
  };
}

function setSessionCookies(c: any, accessToken: string, refreshToken: string) {
  const isProduction = env.NODE_ENV === "production";
  setCookie(c, "aroha_access_token", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "Lax",
    path: "/",
    maxAge: 15 * 60, // 15 minutes
  });
  setCookie(c, "aroha_refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "Lax",
    path: "/api/auth/refresh",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

// ── 1. POST /register ──────────────────────────────────────────────────────

authRouter.post(
  "/register",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }),
  zValidator("json", registerSchema),
  async (c) => {
    const { email, password, displayName } = c.req.valid("json");
    const meta = getClientMeta(c);

    // Enforce password complexity policy
    const { valid, errors } = validatePassword(password);
    if (!valid) {
      return c.json({ error: "Password does not meet requirements", details: errors }, 422);
    }

    // Check if user already exists
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);

    if (existing) {
      // If user exists and is already verified, inform them or reject
      if (existing.isVerified) {
        return c.json({ error: "An account with this email already exists" }, 409);
      }
      // If user exists but is unverified, update their password and re-send OTP
      const passwordHash = await hashPassword(password);
      await db
        .update(usersTable)
        .set({
          passwordHash,
          displayName: displayName ?? existing.displayName,
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, existing.id));

      await db
        .update(emailOtpsTable)
        .set({ consumedAt: new Date() })
        .where(and(eq(emailOtpsTable.email, email.toLowerCase()), isNull(emailOtpsTable.consumedAt)));

      const otp = generateOtp();
      const otpHash = hashOtp(otp);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await db.insert(emailOtpsTable).values({
        userId: existing.id,
        email: email.toLowerCase(),
        otpHash,
        attempts: 0,
        maxAttempts: 5,
        expiresAt,
      });

      await sendOtpEmail({
        to: email,
        otp,
        displayName: displayName ?? existing.displayName ?? email.split("@")[0],
      });

      await logAuditEvent({ userId: existing.id, event: "register_unverified_retry", ...meta });

      return c.json(
        {
          message: "Verification code sent to your email. Please enter the 6-digit code to activate your account.",
          email: existing.email,
        },
        201,
      );
    }

    // Create new unverified user
    const passwordHash = await hashPassword(password);

    const [user] = await db
      .insert(usersTable)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        displayName: displayName ?? email.split("@")[0],
        isVerified: false,
      })
      .returning();

    // Store in password history
    await db.insert(passwordHistoryTable).values({
      userId: user.id,
      passwordHash,
    });

    // Invalidate any old OTP records for this email
    await db
      .update(emailOtpsTable)
      .set({ consumedAt: new Date() })
      .where(and(eq(emailOtpsTable.email, email.toLowerCase()), isNull(emailOtpsTable.consumedAt)));

    // Generate 6-digit OTP
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.insert(emailOtpsTable).values({
      userId: user.id,
      email: email.toLowerCase(),
      otpHash,
      attempts: 0,
      maxAttempts: 5,
      expiresAt,
    });

    // Send responsive HTML verification email
    await sendOtpEmail({
      to: email,
      otp,
      displayName: displayName ?? email.split("@")[0],
    });

    await logAuditEvent({ userId: user.id, event: "register", ...meta });

    return c.json(
      {
        message: "Account created. A 6-digit verification code has been sent to your email.",
        email: user.email,
      },
      201,
    );
  },
);

// ── 2. POST /verify-otp ────────────────────────────────────────────────────

authRouter.post(
  "/verify-otp",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 20 }),
  zValidator("json", verifyOtpSchema),
  async (c) => {
    const { email, otp } = c.req.valid("json");
    const meta = getClientMeta(c);

    // Look for active unconsumed OTP
    const [otpRecord] = await db
      .select()
      .from(emailOtpsTable)
      .where(
        and(
          eq(emailOtpsTable.email, email.toLowerCase()),
          isNull(emailOtpsTable.consumedAt),
        ),
      )
      .orderBy(desc(emailOtpsTable.createdAt))
      .limit(1);

    if (!otpRecord) {
      return c.json({ error: "No pending verification found. Please request a new code." }, 400);
    }

    // Check expiration
    if (new Date() > otpRecord.expiresAt) {
      await db
        .update(emailOtpsTable)
        .set({ consumedAt: new Date() })
        .where(eq(emailOtpsTable.id, otpRecord.id));
      return c.json({ error: "Verification code has expired. Please request a new code." }, 400);
    }

    // Check maximum attempts lockout (5 max)
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      await db
        .update(emailOtpsTable)
        .set({ consumedAt: new Date() })
        .where(eq(emailOtpsTable.id, otpRecord.id));
      return c.json(
        { error: "Maximum verification attempts exceeded. Please request a new verification code." },
        429,
      );
    }

    // Increment attempt counter
    const currentAttempts = otpRecord.attempts + 1;
    await db
      .update(emailOtpsTable)
      .set({ attempts: currentAttempts })
      .where(eq(emailOtpsTable.id, otpRecord.id));

    // Verify OTP using timing-safe comparison
    const matches = verifyOtp(otp, otpRecord.otpHash);
    if (!matches) {
      const remaining = otpRecord.maxAttempts - currentAttempts;
      if (remaining <= 0) {
        await db
          .update(emailOtpsTable)
          .set({ consumedAt: new Date() })
          .where(eq(emailOtpsTable.id, otpRecord.id));
        return c.json(
          { error: "Maximum attempts reached. This code is now invalidated. Please request a new code." },
          429,
        );
      }
      return c.json(
        {
          error: `Incorrect verification code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
          attemptsRemaining: remaining,
        },
        400,
      );
    }

    // Successful OTP match: mark OTP consumed
    await db
      .update(emailOtpsTable)
      .set({ consumedAt: new Date() })
      .where(eq(emailOtpsTable.id, otpRecord.id));

    // Activate and verify user
    const [user] = await db
      .update(usersTable)
      .set({ isVerified: true, updatedAt: new Date() })
      .where(eq(usersTable.email, email.toLowerCase()))
      .returning();

    if (!user) {
      return c.json({ error: "User account could not be found." }, 404);
    }

    // Issue JWT tokens
    const tokenPayload = { sub: user.id, email: user.email };
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(tokenPayload),
      signRefreshToken(tokenPayload),
    ]);

    setSessionCookies(c, accessToken, refreshToken);
    await logAuditEvent({ userId: user.id, event: "email_verified", ...meta });

    return c.json({
      message: "Email verified successfully! Your account is active.",
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        isVerified: user.isVerified,
      },
      accessToken,
    });
  },
);

// ── 3. POST /resend-otp ────────────────────────────────────────────────────

authRouter.post(
  "/resend-otp",
  rateLimiter({
    windowMs: 60 * 1000, // 60 seconds
    max: 1,
    keyFn: (c) => {
      const ip = c.req.header("x-forwarded-for")?.split(",")[0].trim() || c.req.header("x-real-ip") || "unknown";
      return `resend-otp:${ip}`;
    },
    message: "Please wait 60 seconds before requesting another verification code.",
  }),
  zValidator("json", resendOtpSchema),
  async (c) => {
    const { email } = c.req.valid("json");
    const meta = getClientMeta(c);

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);

    // Timing-safe response: do not reveal if email exists or is already verified
    const SUCCESS_MESSAGE = "If your account is pending verification, a new code has been sent.";

    if (!user || user.isVerified) {
      // Simulate small delay
      await new Promise((r) => setTimeout(r, 200));
      return c.json({ message: SUCCESS_MESSAGE });
    }

    // Invalidate existing active OTPs
    await db
      .update(emailOtpsTable)
      .set({ consumedAt: new Date() })
      .where(and(eq(emailOtpsTable.email, email.toLowerCase()), isNull(emailOtpsTable.consumedAt)));

    // Generate new OTP
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.insert(emailOtpsTable).values({
      userId: user.id,
      email: email.toLowerCase(),
      otpHash,
      attempts: 0,
      maxAttempts: 5,
      expiresAt,
    });

    await sendOtpEmail({
      to: email,
      otp,
      displayName: user.displayName ?? email.split("@")[0],
    });

    await logAuditEvent({ userId: user.id, event: "otp_resent", ...meta });

    return c.json({ message: SUCCESS_MESSAGE });
  },
);

// ── 4. POST /login ─────────────────────────────────────────────────────────

authRouter.post(
  "/login",
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyFn: (c) => {
      const ip = c.req.header("x-forwarded-for")?.split(",")[0].trim() || c.req.header("x-real-ip") || "unknown";
      return `login:${ip}`;
    },
  }),
  zValidator("json", loginSchema),
  async (c) => {
    const { email, password } = c.req.valid("json");
    const meta = getClientMeta(c);

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);

    // Dummy hash for constant-time comparison when user does not exist
    const dummyHash = "$argon2id$v=19$m=65536,t=3,p=1$c29tZXNhbHQ$dGVzdGhhc2g";
    const passwordMatch = user
      ? await verifyPassword(user.passwordHash, password)
      : await verifyPassword(dummyHash, password).catch(() => false);

    if (!user || !passwordMatch) {
      await logAuditEvent({
        userId: user?.id,
        event: "login_failed",
        ...meta,
        metadata: { email: email.toLowerCase() },
      });
      return c.json({ error: "Invalid email or password." }, 401);
    }

    // Check account verification
    if (!user.isVerified) {
      return c.json(
        {
          error: "Your account is not verified. Please enter the verification code sent to your email.",
          requiresVerification: true,
          email: user.email,
        },
        403,
      );
    }

    const tokenPayload = { sub: user.id, email: user.email };
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(tokenPayload),
      signRefreshToken(tokenPayload),
    ]);

    setSessionCookies(c, accessToken, refreshToken);
    await logAuditEvent({ userId: user.id, event: "login_success", ...meta });

    return c.json({
      message: "Logged in successfully.",
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        isVerified: user.isVerified,
      },
      accessToken,
    });
  },
);

// ── 5. POST /forgot-password ──────────────────────────────────────────────

authRouter.post(
  "/forgot-password",
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyFn: (c) => {
      const ip = c.req.header("x-forwarded-for")?.split(",")[0].trim() || c.req.header("x-real-ip") || "unknown";
      return `forgot-pw:${ip}`;
    },
  }),
  zValidator("json", forgotPasswordSchema),
  async (c) => {
    const { email } = c.req.valid("json");
    const meta = getClientMeta(c);
    const SAFE_RESPONSE = "If an account exists with that email, a password reset link has been sent.";

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      // Timing-safe delay to prevent email enumeration
      await new Promise((r) => setTimeout(r, 350));
      return c.json({ message: SAFE_RESPONSE });
    }

    // Invalidate existing reset tokens for user
    await db
      .update(passwordResetTokensTable)
      .set({ consumedAt: new Date() })
      .where(
        and(
          eq(passwordResetTokensTable.userId, user.id),
          isNull(passwordResetTokensTable.consumedAt),
        ),
      );

    // Generate secure 32-byte cryptographic token
    const rawToken = generateResetToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes

    await db.insert(passwordResetTokensTable).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const resetUrl = `${env.APP_URL}/reset-password?token=${rawToken}`;

    await sendPasswordResetEmail({
      to: email,
      resetUrl,
      displayName: user.displayName ?? email.split("@")[0],
    });

    await logAuditEvent({ userId: user.id, event: "forgot_password_requested", ...meta });

    return c.json({ message: SAFE_RESPONSE });
  },
);

// ── 6. GET /validate-reset-token ──────────────────────────────────────────

authRouter.get("/validate-reset-token", async (c) => {
  const token = c.req.query("token");
  if (!token || token.length < 32 || token.length > 128) {
    return c.json({ valid: false, error: "Invalid token format." }, 400);
  }

  const tokenHash = hashToken(token);
  const [record] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(
      and(
        eq(passwordResetTokensTable.tokenHash, tokenHash),
        isNull(passwordResetTokensTable.consumedAt),
      ),
    )
    .limit(1);

  if (!record) {
    return c.json({ valid: false, error: "Password reset link is invalid or has already been used." }, 400);
  }

  if (new Date() > record.expiresAt) {
    return c.json({ valid: false, error: "Password reset link has expired. Please request a new one." }, 400);
  }

  return c.json({ valid: true });
});

// ── 7. POST /reset-password ───────────────────────────────────────────────

authRouter.post(
  "/reset-password",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
  zValidator("json", resetPasswordSchema),
  async (c) => {
    const { token, password } = c.req.valid("json");
    const meta = getClientMeta(c);

    // Validate password complexity
    const { valid, errors } = validatePassword(password);
    if (!valid) {
      return c.json({ error: "Password does not meet requirements", details: errors }, 422);
    }

    const tokenHash = hashToken(token);
    const [record] = await db
      .select()
      .from(passwordResetTokensTable)
      .where(
        and(
          eq(passwordResetTokensTable.tokenHash, tokenHash),
          isNull(passwordResetTokensTable.consumedAt),
        ),
      )
      .limit(1);

    if (!record || new Date() > record.expiresAt) {
      return c.json({ error: "Password reset link is invalid or has expired. Please request a new one." }, 400);
    }

    // Check last 5 passwords in history
    const recentHistory = await db
      .select({ passwordHash: passwordHistoryTable.passwordHash })
      .from(passwordHistoryTable)
      .where(eq(passwordHistoryTable.userId, record.userId))
      .orderBy(desc(passwordHistoryTable.createdAt))
      .limit(5);

    const isReused = await isPasswordReused(
      password,
      recentHistory.map((h) => h.passwordHash),
    );

    if (isReused) {
      return c.json(
        { error: "You cannot reuse any of your last 5 passwords. Please choose a different password." },
        422,
      );
    }

    // Hash new password using Argon2id
    const newPasswordHash = await hashPassword(password);

    // Update user password
    const [user] = await db
      .update(usersTable)
      .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
      .where(eq(usersTable.id, record.userId))
      .returning();

    // Record new password in history
    await db.insert(passwordHistoryTable).values({
      userId: record.userId,
      passwordHash: newPasswordHash,
    });

    // Invalidate the reset token
    await db
      .update(passwordResetTokensTable)
      .set({ consumedAt: new Date() })
      .where(eq(passwordResetTokensTable.id, record.id));

    // Send confirmation email
    await sendPasswordChangedEmail({
      to: user.email,
      displayName: user.displayName ?? user.email.split("@")[0],
    });

    await logAuditEvent({ userId: user.id, event: "password_reset_success", ...meta });

    return c.json({ message: "Password reset successfully. You can now log in with your new password." });
  },
);

// ── 8. POST /logout ────────────────────────────────────────────────────────

authRouter.post("/logout", async (c) => {
  deleteCookie(c, "aroha_access_token", { path: "/" });
  deleteCookie(c, "aroha_refresh_token", { path: "/api/auth/refresh" });
  return c.json({ message: "Logged out successfully." });
});

// ── 9. GET /me ─────────────────────────────────────────────────────────────

authRouter.get("/me", requireJwt, async (c) => {
  const payload = c.get("jwtPayload");

  const [user] = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      displayName: usersTable.displayName,
      isVerified: usersTable.isVerified,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, payload.sub))
    .limit(1);

  if (!user) {
    return c.json({ error: "User not found." }, 404);
  }

  return c.json({ user });
});
