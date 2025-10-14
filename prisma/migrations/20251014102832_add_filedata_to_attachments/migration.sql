/*
  Warnings:

  - You are about to drop the column `fileUrl` on the `attachments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."attachments" DROP COLUMN "fileUrl";
