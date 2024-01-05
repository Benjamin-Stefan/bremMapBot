-- --------------------------------------------------------
-- Host:                         176.28.12.113
-- Server Version:               10.4.13-MariaDB-1:10.4.13+maria~bionic-log - mariadb.org binary distribution
-- Server Betriebssystem:        debian-linux-gnu
-- HeidiSQL Version:             11.0.0.5919
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

-- Exportiere Struktur von Tabelle rocketmad.mapBot_item
DROP TABLE IF EXISTS `mapBot_item`;
CREATE TABLE IF NOT EXISTS `mapBot_item` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `duration` int(11) NOT NULL,
  `currency` varchar(50) NOT NULL,
  `currencyValue` varchar(50) NOT NULL,
  `defaultItem` tinyint(1) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Daten Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle rocketmad.mapBot_transactionInfo
DROP TABLE IF EXISTS `mapBot_transactionInfo`;
CREATE TABLE IF NOT EXISTS `mapBot_transactionInfo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transactionId` varchar(50) NOT NULL,
  `transactionDate` datetime NOT NULL,
  `paymentValue` varchar(50) NOT NULL,
  `textMessage` varchar(255) DEFAULT NULL,
  `processedAt` datetime DEFAULT NULL,
  `used` tinyint(1) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `FK__mapbot_user` (`userId`),
  CONSTRAINT `FK__mapbot_user` FOREIGN KEY (`userId`) REFERENCES `mapBot_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Daten Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle rocketmad.mapBot_user
DROP TABLE IF EXISTS `mapBot_user`;
CREATE TABLE IF NOT EXISTS `mapBot_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `discordTag` varchar(50) NOT NULL,
  `discordId` varchar(50) NOT NULL,
  `defaultLanguage` varchar(50) NOT NULL DEFAULT 'de-DE',
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4;

-- Daten Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle rocketmad.mapBot_userAccessLevel
DROP TABLE IF EXISTS `mapBot_userAccessLevel`;
CREATE TABLE IF NOT EXISTS `mapBot_userAccessLevel` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `discordRoleId` varchar(50) NOT NULL DEFAULT '',
  `expiredAt` datetime NOT NULL,
  `notification` tinyint(1) NOT NULL DEFAULT 0,
  `removed` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `FK_mapbot_userAccessLevel_mapbot_user` (`userId`),
  CONSTRAINT `FK_mapbot_userAccessLevel_mapbot_user` FOREIGN KEY (`userId`) REFERENCES `mapBot_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4;

-- Daten Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle rocketmad.mapBot_userAccessLevelHistory
DROP TABLE IF EXISTS `mapBot_userAccessLevelHistory`;
CREATE TABLE IF NOT EXISTS `mapBot_userAccessLevelHistory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userAccessLevelId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `event` varchar(50) NOT NULL,
  `details` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `FK_mapbot_userAccessLevelHistory_mapbot_userAccessLevel` (`userAccessLevelId`),
  KEY `FK_mapbot_userAccessLevelHistory_mapbot_user` (`userId`),
  CONSTRAINT `FK_mapbot_userAccessLevelHistory_mapbot_user` FOREIGN KEY (`userId`) REFERENCES `mapBot_user` (`id`),
  CONSTRAINT `FK_mapbot_userAccessLevelHistory_mapbot_userAccessLevel` FOREIGN KEY (`userAccessLevelId`) REFERENCES `mapBot_userAccessLevel` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Daten Export vom Benutzer nicht ausgewählt

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
