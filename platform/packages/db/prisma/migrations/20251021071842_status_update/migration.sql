-- CreateEnum
CREATE TYPE "HackathonStatus" AS ENUM ('UPCOMING', 'LIVE', 'ENDED');

-- AlterTable
ALTER TABLE "Hackathon" ADD COLUMN     "actualStartTime" TIMESTAMP(3),
ADD COLUMN     "status" "HackathonStatus" NOT NULL DEFAULT 'UPCOMING';
