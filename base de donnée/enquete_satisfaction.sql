-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : ven. 04 juil. 2025 à 00:12
-- Version du serveur : 8.3.0
-- Version de PHP : 8.2.18

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `enquete_satisfaction`
--

-- --------------------------------------------------------

--
-- Structure de la table `enquetes`
--

DROP TABLE IF EXISTS `enquetes`;
CREATE TABLE IF NOT EXISTS `enquetes` (
  `id_enquete` int NOT NULL AUTO_INCREMENT,
  `date_heure_visite` datetime NOT NULL,
  `nom_visiteur` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom_visiteur` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telephone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `raison_presence` enum('Information','Prise de sang (Bilan)','Retrait de résultat') COLLATE utf8mb4_unicode_ci NOT NULL,
  `niveau_satisfaction` enum('Satisfait','Mécontent') COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_service` int NOT NULL,
  `commentaires` text COLLATE utf8mb4_unicode_ci,
  `recommandations` text COLLATE utf8mb4_unicode_ci,
  `adresse_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `date_soumission` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modification` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_enquete`),
  KEY `idx_date_visite` (`date_heure_visite`),
  KEY `idx_satisfaction` (`niveau_satisfaction`),
  KEY `idx_raison_presence` (`raison_presence`),
  KEY `idx_service` (`id_service`),
  KEY `idx_date_soumission` (`date_soumission`)
) ENGINE=MyISAM AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `enquetes`
--

INSERT INTO `enquetes` (`id_enquete`, `date_heure_visite`, `nom_visiteur`, `prenom_visiteur`, `telephone`, `email`, `raison_presence`, `niveau_satisfaction`, `id_service`, `commentaires`, `recommandations`, `adresse_ip`, `user_agent`, `date_soumission`, `date_modification`) VALUES
(1, '2025-07-01 09:15:00', 'ZADJEHI', 'Emmanuel', '0100000001', 'zadjehi@example.ci', 'Information', 'Satisfait', 1, 'Très bon accueil', 'Continuez ainsi', '::1', 'Mozilla/5.0', '2025-07-04 00:12:25', '2025-07-04 00:12:25'),
(2, '2025-07-01 10:20:00', 'KOUADIO', 'Jacques', '0100000002', 'kouadio.jacques@example.ci', 'Prise de sang (Bilan)', 'Satisfait', 2, 'Personnel accueillant', 'Améliorer la signalisation', '::1', 'Mozilla/5.0', '2025-07-04 00:12:25', '2025-07-04 00:12:25'),
(3, '2025-07-01 11:45:00', 'YAO', 'Arsène', '0100000003', 'yao.arsene@example.ci', 'Retrait de résultat', 'Mécontent', 3, 'Trop d\'attente', 'Réduire les délais', '::1', 'Mozilla/5.0', '2025-07-04 00:12:25', '2025-07-04 00:12:25'),
(4, '2025-07-02 08:30:00', 'BLE', 'Lucien', '0100000004', 'ble.lucien@example.ci', 'Information', 'Satisfait', 1, 'Service rapide', 'RAS', '::1', 'Mozilla/5.0', '2025-07-04 00:12:25', '2025-07-04 00:12:25'),
(5, '2025-07-02 09:50:00', 'KONE', 'Aminata', '0100000005', 'kone.aminata@example.ci', 'Prise de sang (Bilan)', 'Satisfait', 2, 'Bonne prise en charge', 'Continuer comme ça', '::1', 'Mozilla/5.0', '2025-07-04 00:12:25', '2025-07-04 00:12:25'),
(6, '2025-07-02 10:10:00', 'TANO', 'Jean', '0100000006', 'tano.jean@example.ci', 'Retrait de résultat', 'Mécontent', 3, 'Résultats retardés', 'Communiquer les délais', '::1', 'Mozilla/5.0', '2025-07-04 00:12:25', '2025-07-04 00:12:25'),
(7, '2025-07-03 13:15:00', 'N\'DA', 'Christelle', '0100000007', 'nda.christelle@example.ci', 'Information', 'Satisfait', 1, 'Personnel souriant', 'RAS', '::1', 'Mozilla/5.0', '2025-07-04 00:12:25', '2025-07-04 00:12:25'),
(8, '2025-07-03 14:25:00', 'KOFFI', 'Michel', '0100000008', 'koffi.michel@example.ci', 'Prise de sang (Bilan)', 'Satisfait', 2, 'Bien organisé', 'Ajouter plus de sièges', '::1', 'Mozilla/5.0', '2025-07-04 00:12:25', '2025-07-04 00:12:25'),
(9, '2025-07-03 15:00:00', 'DJE', 'Nadine', '0100000009', 'dje.nadine@example.ci', 'Retrait de résultat', 'Satisfait', 3, 'Rapide et efficace', 'RAS', '::1', 'Mozilla/5.0', '2025-07-04 00:12:25', '2025-07-04 00:12:25'),
(10, '2025-07-04 09:10:00', 'ADOU', 'Eric', '0100000010', 'adou.eric@example.ci', 'Information', 'Satisfait', 1, 'Bonne orientation', 'Signalétique à améliorer', '::1', 'Mozilla/5.0', '2025-07-04 00:12:25', '2025-07-04 00:12:25'),
(11, '2025-07-04 10:30:00', 'BAKAYOKO', 'Fanta', '0100000011', 'bakayoko.fanta@example.ci', 'Prise de sang (Bilan)', 'Mécontent', 2, 'Infirmière peu aimable', 'Former le personnel', '::1', 'Mozilla/5.0', '2025-07-04 00:12:25', '2025-07-04 00:12:25'),
(12, '2025-07-04 11:00:00', 'KOUAME', 'Thierry', '0100000012', 'kouame.thierry@example.ci', 'Retrait de résultat', 'Satisfait', 3, 'Tout s’est bien passé', 'RAS', '::1', 'Mozilla/5.0', '2025-07-04 00:12:25', '2025-07-04 00:12:25'),
(13, '2025-07-04 11:45:00', 'ZAHOUI', 'Sylvie', '0100000013', 'zahoui.sylvie@example.ci', 'Information', 'Satisfait', 1, 'Clair et rapide', 'RAS', '::1', 'Mozilla/5.0', '2025-07-04 00:12:25', '2025-07-04 00:12:25'),
(14, '2025-07-04 13:00:00', 'AHOU', 'Pierre', '0100000014', 'ahou.pierre@example.ci', 'Prise de sang (Bilan)', 'Satisfait', 2, 'Bon matériel', 'RAS', '::1', 'Mozilla/5.0', '2025-07-04 00:12:25', '2025-07-04 00:12:25'),
(15, '2025-07-04 14:15:00', 'N\'GUESSAN', 'Cecilia', '0100000015', 'nguessan.cecilia@example.ci', 'Retrait de résultat', 'Satisfait', 3, 'Facile et rapide', 'RAS', '::1', 'Mozilla/5.0', '2025-07-04 00:12:25', '2025-07-04 00:12:25');

-- --------------------------------------------------------

--
-- Structure de la table `logs_activite`
--

DROP TABLE IF EXISTS `logs_activite`;
CREATE TABLE IF NOT EXISTS `logs_activite` (
  `id_log` int NOT NULL AUTO_INCREMENT,
  `id_utilisateur` int DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `adresse_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `date_action` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_log`),
  KEY `idx_utilisateur_log` (`id_utilisateur`),
  KEY `idx_date_action` (`date_action`),
  KEY `idx_action` (`action`)
) ENGINE=MyISAM AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `logs_activite`
--

INSERT INTO `logs_activite` (`id_log`, `id_utilisateur`, `action`, `description`, `adresse_ip`, `user_agent`, `date_action`) VALUES
(1, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 12:58:31'),
(2, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 12:59:37'),
(3, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 13:00:10'),
(4, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 13:02:09'),
(5, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 13:02:11'),
(6, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 13:04:37'),
(7, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 13:09:08'),
(8, 0, 'export_donnees', 'Export enquetes en format excel', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 13:09:45'),
(9, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 13:14:08'),
(10, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 13:16:58'),
(11, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 13:17:26'),
(12, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 13:22:27'),
(13, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 13:27:27'),
(14, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 13:32:28'),
(15, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 13:37:28'),
(16, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 13:42:28'),
(17, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 13:47:28'),
(18, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 13:52:28'),
(19, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 13:57:28'),
(20, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 14:02:28'),
(21, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 14:03:54'),
(22, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 14:08:54'),
(23, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 14:13:55'),
(24, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 14:18:54'),
(25, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 14:23:55'),
(26, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 14:23:56'),
(27, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 14:28:57'),
(28, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 14:33:57'),
(29, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 14:38:58'),
(30, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 14:41:04'),
(31, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 14:41:11'),
(32, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 14:41:24'),
(33, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 14:42:37'),
(34, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 14:42:56'),
(35, 0, 'consultation_statistiques', 'Dashboard statistiques consulté', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 14:47:50'),
(36, 0, 'export_donnees', 'Export enquetes en format excel', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 19:51:28'),
(37, 0, 'export_donnees', 'Export enquetes en format excel', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 19:51:31'),
(38, 0, 'export_donnees', 'Export enquetes en format excel', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 19:51:32'),
(39, 0, 'export_donnees', 'Export enquetes en format excel', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 19:51:32'),
(40, 0, 'export_donnees', 'Export enquetes en format excel', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 20:09:25'),
(41, 0, 'export_donnees', 'Export enquetes en format excel', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', '2025-07-03 22:59:23');

-- --------------------------------------------------------

--
-- Structure de la table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE IF NOT EXISTS `notifications` (
  `id_notification` int NOT NULL AUTO_INCREMENT,
  `type_notification` enum('nouvelle_enquete','enquete_mecontent','rapport_mensuel','alerte_systeme') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'nouvelle_enquete',
  `titre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_enquete` int DEFAULT NULL COMMENT 'ID de l''enquête liée (si applicable)',
  `id_utilisateur_destinataire` int DEFAULT NULL COMMENT 'ID utilisateur destinataire (NULL = tous les admins)',
  `lu` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0 = non lu, 1 = lu',
  `date_creation` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_lecture` timestamp NULL DEFAULT NULL,
  `donnees_supplementaires` json DEFAULT NULL COMMENT 'Données JSON pour infos supplémentaires',
  `actif` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_notification`),
  KEY `idx_type_notification` (`type_notification`),
  KEY `idx_destinataire` (`id_utilisateur_destinataire`),
  KEY `idx_enquete` (`id_enquete`),
  KEY `idx_lu` (`lu`),
  KEY `idx_date_creation` (`date_creation`),
  KEY `idx_actif` (`actif`)
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table pour les notifications système';

--
-- Déchargement des données de la table `notifications`
--

INSERT INTO `notifications` (`id_notification`, `type_notification`, `titre`, `message`, `id_enquete`, `id_utilisateur_destinataire`, `lu`, `date_creation`, `date_lecture`, `donnees_supplementaires`, `actif`) VALUES
(1, 'nouvelle_enquete', 'Nouvelle enquête reçue', 'Une nouvelle enquête de satisfaction a été soumise par ZADJEHI MOAHE', 1, NULL, 0, '2025-07-03 20:15:45', NULL, '{\"service\": \"Résultats\", \"nom_visiteur\": \"ZADJEHI\", \"satisfaction\": \"Satisfait\", \"prenom_visiteur\": \"MOAHE EMMANUEL\"}', 1),
(2, 'nouvelle_enquete', 'Nouvelle enquête reçue', 'Une nouvelle enquête de satisfaction a été soumise par KONE Marie', 2, NULL, 0, '2025-07-03 20:15:45', NULL, '{\"service\": \"Accueil\", \"nom_visiteur\": \"KONE\", \"satisfaction\": \"Mécontent\", \"prenom_visiteur\": \"Marie\"}', 1),
(3, 'enquete_mecontent', 'Enquête mécontente', 'Une enquête avec un niveau de satisfaction \"Mécontent\" a été soumise', 3, NULL, 0, '2025-07-03 20:15:45', NULL, '{\"service\": \"Accueil\", \"commentaires\": \"Attente trop longue\", \"nom_visiteur\": \"TANO\", \"satisfaction\": \"Mécontent\"}', 1),
(4, 'nouvelle_enquete', 'Nouvelle enquête reçue', '✅ Une nouvelle enquête de satisfaction a été soumise par ZANBI MOREL', 7, NULL, 0, '2025-07-03 22:58:26', NULL, '{\"service\": \"Accueil\", \"date_visite\": \"2025-07-03 22:56:00\", \"commentaires\": \"C\'était super\", \"nom_visiteur\": \"ZANBI\", \"satisfaction\": \"Satisfait\", \"prenom_visiteur\": \"MOREL\", \"raison_presence\": \"Information\"}', 1),
(5, 'nouvelle_enquete', 'Nouvelle enquête reçue', '✅ Une nouvelle enquête de satisfaction a été soumise par test test', 8, NULL, 0, '2025-07-04 00:08:30', NULL, '{\"service\": \"Administration\", \"date_visite\": \"2025-07-04 00:07:00\", \"commentaires\": \"test ci 122\", \"nom_visiteur\": \"test\", \"satisfaction\": \"Satisfait\", \"prenom_visiteur\": \"test\", \"raison_presence\": \"Prise de sang (Bilan)\"}', 1);

-- --------------------------------------------------------

--
-- Structure de la table `services`
--

DROP TABLE IF EXISTS `services`;
CREATE TABLE IF NOT EXISTS `services` (
  `id_service` int NOT NULL AUTO_INCREMENT,
  `nom_service` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description_service` text COLLATE utf8mb4_unicode_ci,
  `actif` tinyint(1) DEFAULT '1',
  `date_creation` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modification` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_service`),
  UNIQUE KEY `nom_service` (`nom_service`)
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `services`
--

INSERT INTO `services` (`id_service`, `nom_service`, `description_service`, `actif`, `date_creation`, `date_modification`) VALUES
(1, 'Accueil', 'Service d\'accueil et information générale', 1, '2025-07-02 09:49:26', '2025-07-02 09:49:26'),
(2, 'Laboratoire', 'Service de prélèvement sanguin et analyses', 1, '2025-07-02 09:49:26', '2025-07-02 09:49:26'),
(3, 'Résultats', 'Service de retrait des résultats d\'analyses', 1, '2025-07-02 09:49:26', '2025-07-02 09:49:26'),
(4, 'Administration', 'Service administratif', 1, '2025-07-02 09:49:26', '2025-07-02 09:49:26'),
(5, 'Direction', 'Direction générale', 1, '2025-07-02 09:49:26', '2025-07-02 09:49:26');

-- --------------------------------------------------------

--
-- Structure de la table `sessions_utilisateurs`
--

DROP TABLE IF EXISTS `sessions_utilisateurs`;
CREATE TABLE IF NOT EXISTS `sessions_utilisateurs` (
  `id_session` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_utilisateur` int NOT NULL,
  `donnees_session` text COLLATE utf8mb4_unicode_ci,
  `date_creation` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `date_expiration` timestamp NOT NULL,
  `actif` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_session`),
  KEY `idx_utilisateur_session` (`id_utilisateur`),
  KEY `idx_expiration` (`date_expiration`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `utilisateurs`
--

DROP TABLE IF EXISTS `utilisateurs`;
CREATE TABLE IF NOT EXISTS `utilisateurs` (
  `id_utilisateur` int NOT NULL AUTO_INCREMENT,
  `nom_utilisateur` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mot_de_passe` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('Responsable Qualité','Directrice Générale','Administrateur') COLLATE utf8mb4_unicode_ci NOT NULL,
  `actif` tinyint(1) DEFAULT '1',
  `derniere_connexion` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modification` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_utilisateur`),
  UNIQUE KEY `nom_utilisateur` (`nom_utilisateur`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_nom_utilisateur` (`nom_utilisateur`),
  KEY `idx_role` (`role`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `utilisateurs`
--

INSERT INTO `utilisateurs` (`id_utilisateur`, `nom_utilisateur`, `mot_de_passe`, `nom`, `prenom`, `email`, `role`, `actif`, `derniere_connexion`, `date_creation`, `date_modification`) VALUES
(1, 'zadjehi', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ZADJEHI', 'MOAHE EMMANUEL HYACINTHE JUNIOR', 'zadjehi@hopital.com', 'Administrateur', 1, NULL, '2025-07-03 10:34:42', '2025-07-03 10:34:42');

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `vue_statistiques_mensuelles`
-- (Voir ci-dessous la vue réelle)
--
DROP VIEW IF EXISTS `vue_statistiques_mensuelles`;
CREATE TABLE IF NOT EXISTS `vue_statistiques_mensuelles` (
`annee` year
,`mecontents` decimal(23,0)
,`mois` int
,`nom_mois` varchar(9)
,`nombre_enquetes` bigint
,`satisfaits` decimal(23,0)
,`taux_satisfaction` decimal(29,2)
);

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `vue_statistiques_raisons`
-- (Voir ci-dessous la vue réelle)
--
DROP VIEW IF EXISTS `vue_statistiques_raisons`;
CREATE TABLE IF NOT EXISTS `vue_statistiques_raisons` (
`mecontents` decimal(23,0)
,`nombre_visites` bigint
,`raison_presence` enum('Information','Prise de sang (Bilan)','Retrait de résultat')
,`satisfaits` decimal(23,0)
,`taux_satisfaction` decimal(29,2)
);

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `vue_statistiques_satisfaction`
-- (Voir ci-dessous la vue réelle)
--
DROP VIEW IF EXISTS `vue_statistiques_satisfaction`;
CREATE TABLE IF NOT EXISTS `vue_statistiques_satisfaction` (
`niveau_satisfaction` enum('Satisfait','Mécontent')
,`nombre_reponses` bigint
,`pourcentage` decimal(26,2)
);

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `vue_statistiques_services`
-- (Voir ci-dessous la vue réelle)
--
DROP VIEW IF EXISTS `vue_statistiques_services`;
CREATE TABLE IF NOT EXISTS `vue_statistiques_services` (
`mecontents` decimal(23,0)
,`nom_service` varchar(100)
,`nombre_enquetes` bigint
,`satisfaits` decimal(23,0)
,`taux_satisfaction` decimal(29,2)
);

-- --------------------------------------------------------

--
-- Structure de la vue `vue_statistiques_mensuelles`
--
DROP TABLE IF EXISTS `vue_statistiques_mensuelles`;

DROP VIEW IF EXISTS `vue_statistiques_mensuelles`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vue_statistiques_mensuelles`  AS SELECT year(`enquetes`.`date_heure_visite`) AS `annee`, month(`enquetes`.`date_heure_visite`) AS `mois`, monthname(`enquetes`.`date_heure_visite`) AS `nom_mois`, count(0) AS `nombre_enquetes`, sum((case when (`enquetes`.`niveau_satisfaction` = 'Satisfait') then 1 else 0 end)) AS `satisfaits`, sum((case when (`enquetes`.`niveau_satisfaction` = 'Mécontent') then 1 else 0 end)) AS `mecontents`, round(((sum((case when (`enquetes`.`niveau_satisfaction` = 'Satisfait') then 1 else 0 end)) * 100.0) / count(0)),2) AS `taux_satisfaction` FROM `enquetes` GROUP BY year(`enquetes`.`date_heure_visite`), month(`enquetes`.`date_heure_visite`) ORDER BY `annee` DESC, `mois` DESC ;

-- --------------------------------------------------------

--
-- Structure de la vue `vue_statistiques_raisons`
--
DROP TABLE IF EXISTS `vue_statistiques_raisons`;

DROP VIEW IF EXISTS `vue_statistiques_raisons`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vue_statistiques_raisons`  AS SELECT `enquetes`.`raison_presence` AS `raison_presence`, count(0) AS `nombre_visites`, sum((case when (`enquetes`.`niveau_satisfaction` = 'Satisfait') then 1 else 0 end)) AS `satisfaits`, sum((case when (`enquetes`.`niveau_satisfaction` = 'Mécontent') then 1 else 0 end)) AS `mecontents`, round(((sum((case when (`enquetes`.`niveau_satisfaction` = 'Satisfait') then 1 else 0 end)) * 100.0) / count(0)),2) AS `taux_satisfaction` FROM `enquetes` GROUP BY `enquetes`.`raison_presence` ORDER BY `nombre_visites` DESC ;

-- --------------------------------------------------------

--
-- Structure de la vue `vue_statistiques_satisfaction`
--
DROP TABLE IF EXISTS `vue_statistiques_satisfaction`;

DROP VIEW IF EXISTS `vue_statistiques_satisfaction`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vue_statistiques_satisfaction`  AS SELECT `enquetes`.`niveau_satisfaction` AS `niveau_satisfaction`, count(0) AS `nombre_reponses`, round(((count(0) * 100.0) / (select count(0) from `enquetes`)),2) AS `pourcentage` FROM `enquetes` GROUP BY `enquetes`.`niveau_satisfaction` ;

-- --------------------------------------------------------

--
-- Structure de la vue `vue_statistiques_services`
--
DROP TABLE IF EXISTS `vue_statistiques_services`;

DROP VIEW IF EXISTS `vue_statistiques_services`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vue_statistiques_services`  AS SELECT `s`.`nom_service` AS `nom_service`, count(`e`.`id_enquete`) AS `nombre_enquetes`, sum((case when (`e`.`niveau_satisfaction` = 'Satisfait') then 1 else 0 end)) AS `satisfaits`, sum((case when (`e`.`niveau_satisfaction` = 'Mécontent') then 1 else 0 end)) AS `mecontents`, round(((sum((case when (`e`.`niveau_satisfaction` = 'Satisfait') then 1 else 0 end)) * 100.0) / count(`e`.`id_enquete`)),2) AS `taux_satisfaction` FROM (`services` `s` left join `enquetes` `e` on((`s`.`id_service` = `e`.`id_service`))) GROUP BY `s`.`id_service`, `s`.`nom_service` ORDER BY `nombre_enquetes` DESC ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
