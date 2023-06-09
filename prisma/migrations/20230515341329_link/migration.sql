-- CreateTable
CREATE TABLE `Link` (
	`id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
	`slug` VARCHAR(24) NOT NULL,
	`domain_id` INTEGER UNSIGNED NOT NULL,
	`user_id` INTEGER UNSIGNED NULL,
	`image_id` INTEGER UNSIGNED NULL,
	`long_url` VARCHAR(512) NOT NULL,
	`is_redirect` INTEGER UNSIGNED NOT NULL,
	`cta_heading` TEXT NULL,
	`cta_body` TEXT NULL,
	`cta_action` TEXT NULL,
	`updated_by` INTEGER UNSIGNED NOT NULL,
	`updated` DATETIME(3) NOT NULL,
	`created` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`deleted` DATETIME(3) NULL,
	`archived` DATETIME(3) NULL,
	UNIQUE INDEX `Link_slug_key`(`slug`),
	PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE
	`Link`
ADD
	CONSTRAINT `Link_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE
SET
	NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
	`Link`
ADD
	CONSTRAINT `Link_image_id_fkey` FOREIGN KEY (`image_id`) REFERENCES `Image`(`id`) ON DELETE
SET
	NULL ON UPDATE CASCADE;