-- CreateTable
CREATE TABLE `User` (
	`id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
	`uid` VARCHAR(24) NOT NULL,
	`image_id` INTEGER UNSIGNED NULL,
	`email` VARCHAR(64) NOT NULL,
	`first_name` VARCHAR(64) NOT NULL,
	`last_name` VARCHAR(64) NOT NULL,
	`password` VARCHAR(128) NOT NULL,
	`last_ip` VARCHAR(128) NULL,
	`verification_date` DATETIME(3) NULL,
	`verification_token` VARCHAR(24) NULL,
	`apl_token` VARCHAR(128) NULL,
	`gle_token` VARCHAR(128) NULL,
	`marketing_opt_out` DATETIME(3) NULL,
	`updated` DATETIME(3) NOT NULL,
	`created` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`deleted` DATETIME(3) NULL,
	UNIQUE INDEX `User_uid_key`(`uid`),
	UNIQUE INDEX `User_email_key`(`email`),
	UNIQUE INDEX `User_apl_token_key`(`apl_token`),
	UNIQUE INDEX `User_gle_token_key`(`gle_token`),
	PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;