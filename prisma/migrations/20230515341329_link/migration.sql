-- CreateTable
CREATE TABLE `Link` (
	`id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
	`slug` VARCHAR(24) NOT NULL,
	`domain_id` INTEGER UNSIGNED NOT NULL,
	`user_id` INTEGER UNSIGNED NULL,
	`image_id` INTEGER UNSIGNED NULL,
	`long_url` VARCHAR(512) NOT NULL,
	`is_tracking` TINYINT UNSIGNED NOT NULL DEFAULT 0,
	`cta_heading` TEXT NULL,
	`cta_body` TEXT NULL,
	`cta_action` TEXT NULL,
	`updated_by` INTEGER UNSIGNED NULL,
	`updated` DATETIME(3) NOT NULL,
	`created` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`deleted` DATETIME(3) NULL,
	`archived` DATETIME(3) NULL,
	UNIQUE INDEX `Link_slug_domain_id_key`(`slug`, `domain_id`),
	PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE
	`Link`
ADD
	CONSTRAINT `Link_domain_id_fkey` FOREIGN KEY (`domain_id`) REFERENCES `Domain`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

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