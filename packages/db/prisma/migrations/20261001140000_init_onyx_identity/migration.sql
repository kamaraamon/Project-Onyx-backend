-- Create-only identity tables. Does not alter existing Neon tables.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "onyx_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onyx_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onyx_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onyx_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onyx_login_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onyx_login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onyx_audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onyx_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "onyx_users_email_key" ON "onyx_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "onyx_sessions_tokenHash_key" ON "onyx_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "onyx_sessions_userId_idx" ON "onyx_sessions"("userId");

-- CreateIndex
CREATE INDEX "onyx_login_attempts_email_createdAt_idx" ON "onyx_login_attempts"("email", "createdAt");

-- CreateIndex
CREATE INDEX "onyx_audit_logs_createdAt_idx" ON "onyx_audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "onyx_sessions" ADD CONSTRAINT "onyx_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "onyx_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onyx_login_attempts" ADD CONSTRAINT "onyx_login_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "onyx_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onyx_audit_logs" ADD CONSTRAINT "onyx_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "onyx_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
