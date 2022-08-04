const config = require('../config.json')
const logger = require('../logger')
const Database = require('./database')
const con = new Database().connect(config.database)

try {
    con.query("CREATE TABLE `bots` (`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT, `discord_id` VARCHAR(20) NOT NULL COLLATE 'utf8mb4_general_ci', `paradise_id` VARCHAR(20) NOT NULL COLLATE 'utf8mb4_general_ci', `settings` LONGTEXT NOT NULL COLLATE 'utf8mb4_bin', `paid` DATETIME NOT NULL DEFAULT current_timestamp(), `enabled` TINYINT(1) NOT NULL DEFAULT '1', PRIMARY KEY (`id`) USING BTREE, CONSTRAINT `settings` CHECK (json_valid(`settings`))) COLLATE='utf8mb4_general_ci' ENGINE=InnoDB;")
    con.query("CREATE TABLE `logs` (`id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT, `lid` BIGINT(20) UNSIGNED NULL DEFAULT NULL, `gid` INT(11) NULL DEFAULT NULL, PRIMARY KEY (`id`) USING BTREE) COLLATE='utf8mb4_general_ci' ENGINE=InnoDB;")
    con.query("CREATE TABLE `users` (`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT, `gid` INT(10) UNSIGNED NOT NULL, `uid` INT(10) UNSIGNED NOT NULL, `cash` BIGINT(20) NOT NULL DEFAULT '0', `count_artifact` INT(10) UNSIGNED NOT NULL DEFAULT '0', `count_import` INT(10) UNSIGNED NOT NULL DEFAULT '0', `count_importfail` INT(10) UNSIGNED NOT NULL DEFAULT '0', `count_export` INT(10) UNSIGNED NOT NULL DEFAULT '0', `count_pawnshop` INT(10) UNSIGNED NOT NULL DEFAULT '0', `earn_artifact` INT(10) UNSIGNED NOT NULL DEFAULT '0', `earn_import` INT(10) UNSIGNED NOT NULL DEFAULT '0', `earn_export` INT(10) UNSIGNED NOT NULL DEFAULT '0', `earn_pawnshop` INT(10) UNSIGNED NOT NULL DEFAULT '0', PRIMARY KEY (`id`) USING BTREE, UNIQUE INDEX `gid_uid` (`gid`, `uid`) USING BTREE) COLLATE='utf8mb4_general_ci' ENGINE=InnoDB;")
    con.query("CREATE TABLE `data_history` (`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT, `gid` INT(10) UNSIGNED NOT NULL, `uid` INT(10) UNSIGNED NOT NULL, `date` DATETIME NOT NULL DEFAULT current_timestamp(), `info` LONGTEXT NOT NULL COLLATE 'utf8mb4_bin', PRIMARY KEY (`id`) USING BTREE) COLLATE='utf8mb4_general_ci' ENGINE=InnoDB;")
    con.query("CREATE TABLE `ignored_users` (`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT, `gid` INT(10) UNSIGNED NOT NULL, `uid` INT(10) UNSIGNED NOT NULL, PRIMARY KEY (`id`) USING BTREE) COLLATE='utf8mb4_general_ci' ENGINE=InnoDB;")
    con.query("CREATE TABLE `imports` ( `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT, `gid` INT(10) UNSIGNED NOT NULL, `uid` INT(10) UNSIGNED NOT NULL, `vehicle` VARCHAR(255) NOT NULL DEFAULT '' COLLATE 'utf8mb4_general_ci', PRIMARY KEY (`id`) USING BTREE) COLLATE='utf8mb4_general_ci' ENGINE=InnoDB;")
    con.query("CREATE TABLE `warehouse_notify` (`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT, `gid` INT(10) UNSIGNED NOT NULL, `discord_id` VARCHAR(50) NOT NULL COLLATE 'utf8mb4_general_ci', `channel_id` VARCHAR(50) NOT NULL COLLATE 'utf8mb4_general_ci', `message_id` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci', PRIMARY KEY (`id`) USING BTREE) COLLATE='utf8mb4_general_ci' ENGINE=InnoDB;")
} catch (e) {
    logger.error('Error while creating migration')
    throw e
}