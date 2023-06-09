-- CreateTable
CREATE TABLE `Session` (
	`id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
	`token` VARCHAR(24) NOT NULL,
	`user_id` INTEGER UNSIGNED NOT NULL,
	`updated` DATETIME(3) NOT NULL,
	`created` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`deleted` DATETIME(3) NULL,
	UNIQUE INDEX `Session_token_key`(`token`),
	INDEX `Session_user_id_idx`(`user_id`),
	PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE
	`Session`
ADD
	CONSTRAINT `Session_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;