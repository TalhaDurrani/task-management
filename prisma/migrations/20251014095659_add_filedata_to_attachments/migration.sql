/*
  Warnings:

  - You are about to drop the column `filePath` on the `attachments` table. All the data in the column will be lost.
  - Added the required column `fileData` to the `attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileExtension` to the `attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileType` to the `attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileUrl` to the `attachments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."attachments" DROP COLUMN "filePath",
ADD COLUMN     "fileData" BYTEA NOT NULL,
ADD COLUMN     "fileExtension" TEXT NOT NULL,
ADD COLUMN     "fileType" TEXT NOT NULL,
ADD COLUMN     "fileUrl" TEXT NOT NULL;
