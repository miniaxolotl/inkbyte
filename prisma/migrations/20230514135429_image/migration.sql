-- CreateTable
CREATE TABLE `Image` (
	`id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
	`uid` VARCHAR(256) NOT NULL,
	`slug` VARCHAR(256) NOT NULL,
	`bucket` VARCHAR(128) NOT NULL,
	`mime` VARCHAR(32) NOT NULL,
	`path` VARCHAR(128) NOT NULL,
	`filename` VARCHAR(128) NOT NULL,
	`filetype` VARCHAR(32) NULL,
	`endpoint` VARCHAR(32) NOT NULL,
	`region` VARCHAR(32) NOT NULL,
	`checksum` TEXT NULL,
	`updated_by` INTEGER UNSIGNED NOT NULL,
	`updated` DATETIME(3) NOT NULL,
	`created` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`deleted` DATETIME(3) NULL,
	`archived` DATETIME(3) NULL,
	UNIQUE INDEX `Image_uid_key`(`uid`),
	UNIQUE INDEX `Image_slug_key`(`slug`),
	PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE
	`User`
ADD
	CONSTRAINT `User_image_id_fkey` FOREIGN KEY (`image_id`) REFERENCES `Image`(`id`) ON DELETE
SET
	NULL ON UPDATE CASCADE;