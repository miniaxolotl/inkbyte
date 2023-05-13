-- CreateTable
CREATE TABLE `Role` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(32) NOT NULL,
    `authority` TINYINT UNSIGNED NOT NULL,
    `description` TINYTEXT NULL,
    `updated` DATETIME(3) NOT NULL,
    `created` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted` DATETIME(3) NULL,

    UNIQUE INDEX `Role_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
