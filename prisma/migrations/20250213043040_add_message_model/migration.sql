-- AlterTable
ALTER TABLE `Post` ALTER COLUMN `boardId` DROP DEFAULT;

-- CreateTable
CREATE TABLE `Message` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `room` VARCHAR(191) NOT NULL,
    `sender` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
