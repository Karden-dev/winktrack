-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost:3306
-- Généré le : mar. 03 fév. 2026 à 09:37
-- Version du serveur : 11.4.9-MariaDB-cll-lve
-- Version de PHP : 8.3.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `csdkqyubnt_wink_track_db`
--

-- --------------------------------------------------------

--
-- Structure de la table `app_settings`
--

CREATE TABLE `app_settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `app_settings`
--

INSERT INTO `app_settings` (`setting_key`, `setting_value`, `description`) VALUES
('currency', 'XAF', 'Devise'),
('trial_days', '0', 'Jours offerts à inscription (si promo)'),
('weekly_price', '150', 'Prix abonnement 7 jours');

-- --------------------------------------------------------

--
-- Structure de la table `gps_logs`
--

CREATE TABLE `gps_logs` (
  `id` int(11) NOT NULL,
  `subscriber_id` int(11) NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `accuracy_meters` int(11) DEFAULT NULL,
  `client_user_agent` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `gps_logs`
--

INSERT INTO `gps_logs` (`id`, `subscriber_id`, `latitude`, `longitude`, `accuracy_meters`, `client_user_agent`, `created_at`) VALUES
(9, 14, 3.82734271, 11.48275854, 14, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2026-02-02 12:23:35'),
(10, 24, 3.82874840, 11.48556340, 300, 'Mozilla/5.0 (Linux; U; Android 14; fr-fr; TECNO CK7n Build/UP1A.231005.007) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.5563.116 Mobile Safari/537.36 PHX/20.3', '2026-02-03 02:23:31'),
(11, 20, 3.80209840, 11.54674320, 88, 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36', '2026-02-03 06:39:54'),
(12, 20, 3.80205000, 11.53289830, 8, 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36', '2026-02-03 06:40:24'),
(13, 35, 3.82728091, 11.48276737, 38, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2026-02-03 07:03:45');

-- --------------------------------------------------------

--
-- Structure de la table `promo_codes`
--

CREATE TABLE `promo_codes` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `days_bonus` int(11) DEFAULT 7,
  `max_uses` int(11) DEFAULT 1000,
  `current_uses` int(11) DEFAULT 0,
  `expires_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `promo_codes`
--

INSERT INTO `promo_codes` (`id`, `code`, `days_bonus`, `max_uses`, `current_uses`, `expires_at`, `created_at`) VALUES
(1, 'WINK2025', 14, 100, 0, '2025-12-31 23:59:59', '2026-02-01 16:37:40'),
(2, 'LANCEMENT', 7, 500, 0, '2025-06-30 23:59:59', '2026-02-01 16:37:40');

-- --------------------------------------------------------

--
-- Structure de la table `subscribers`
--

CREATE TABLE `subscribers` (
  `id` int(11) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `magic_slug` varchar(20) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `country` varchar(50) DEFAULT 'Cameroun',
  `city` varchar(50) DEFAULT NULL,
  `is_independent` tinyint(1) DEFAULT 1,
  `company_name` varchar(100) DEFAULT NULL,
  `is_registered_full` tinyint(1) DEFAULT 0,
  `subscription_expires_at` datetime DEFAULT NULL,
  `total_gps_captures` int(11) DEFAULT 0,
  `reputation_score` decimal(3,2) DEFAULT 5.00,
  `referral_code` varchar(20) DEFAULT NULL,
  `referred_by` varchar(20) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_online` tinyint(1) DEFAULT 0,
  `custom_message_template` varchar(255) DEFAULT '? Voici ma position exacte.',
  `photo_url` varchar(255) DEFAULT NULL,
  `vehicle_type` varchar(50) DEFAULT 'Moto'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `subscribers`
--

INSERT INTO `subscribers` (`id`, `phone_number`, `magic_slug`, `first_name`, `last_name`, `country`, `city`, `is_independent`, `company_name`, `is_registered_full`, `subscription_expires_at`, `total_gps_captures`, `reputation_score`, `referral_code`, `referred_by`, `created_at`, `updated_at`, `is_online`, `custom_message_template`, `photo_url`, `vehicle_type`) VALUES
(12, '123456789', 'bardon-6341', 'BARDON', '', 'CAMEROUN', 'YAOUNDE', 1, '', 1, NULL, 0, 5.00, 'BARDON-1491', NULL, '2026-02-01 13:52:44', '2026-02-01 13:52:55', 1, '? Voici ma position exacte.', NULL, 'Moto'),
(14, '674327482', 'ZlfH', 'JUNIOR', '', 'CAMEROUN', 'ER', 1, '', 1, '2026-02-15 19:36:41', 1, 5.00, 'JUNIOR-9305', NULL, '2026-02-01 14:35:46', '2026-02-02 12:23:35', 1, 'Voici ma position exacte.', NULL, 'Moto'),
(15, '690484981', '8JtP', 'Bardon', '', 'Cameroon ', 'Yaounde', 1, '', 1, '2026-02-10 13:07:08', 0, 5.00, 'BARDON-8493', NULL, '2026-02-01 15:56:58', '2026-02-03 08:07:08', 1, '? Voici ma position exacte.', NULL, 'Moto'),
(16, '694926390', 'nkoumyvan-7644', 'Nkoum yvan', '', 'Cameroun ', 'Yaoundé', 1, '', 1, '2026-02-08 09:46:56', 0, 5.00, 'NKOUMY-9566', NULL, '2026-02-01 17:51:11', '2026-02-02 03:47:54', 0, '? Voici ma position exacte.', NULL, 'Moto'),
(17, '695692085', 'juinobam-9590', 'Juin obam', '', 'Cameroun ', 'Yaoundé', 0, 'Wink express', 1, '2026-02-08 09:46:56', 0, 5.00, 'JUINOB-6239', NULL, '2026-02-01 18:04:15', '2026-02-02 03:47:54', 1, '? Voici ma position exacte.', NULL, 'Moto'),
(18, '677231983', 'ntetnguuchiracjephte', 'Ntetngu\'u Chirac jephte', '', 'Cameroun', 'Yaoundé', 0, 'Wink express', 1, '2026-02-08 09:46:56', 0, 5.00, 'NTETNG-7176', NULL, '2026-02-02 01:12:33', '2026-02-02 03:47:54', 1, '? Voici ma position exacte.', NULL, 'Moto'),
(19, '699350145', 'jeanmodeste-7578', 'Jean Modeste', '', 'Cameroun ', 'Yaoundé', 0, '', 1, '2026-02-08 09:46:56', 0, 5.00, 'JEANMO-2192', NULL, '2026-02-02 01:58:18', '2026-02-02 04:28:28', 1, '? Voici ma position exacte.', NULL, 'Moto'),
(20, '693567255', 'metilageorges-9786', 'Metila Georges', '', 'Cameroun ', 'Yaoundé', 1, '', 1, '2026-02-08 10:27:16', 2, 5.00, 'METILA-8226', NULL, '2026-02-02 04:21:59', '2026-02-03 06:40:24', 1, '? Voici ma position exacte.', NULL, 'Moto'),
(21, '690644696', 'aramiben-3376', 'ARAMI BEN', '', 'Cameroun ', 'Douala', 0, 'KENZA EXPRESS', 1, '2026-02-08 10:43:01', 0, 5.00, 'ARAMIB-6053', NULL, '2026-02-02 04:41:18', '2026-02-02 04:43:52', 1, '? Voici ma position exacte.', NULL, 'Moto'),
(22, '694932382', 'gallusonanaonana-659', 'gallus onana onana', '', 'Cameroun ', 'Yde', 0, 'Wink express', 1, '2026-02-08 08:14:30', 0, 5.00, 'GALLUS-9634', NULL, '2026-02-02 06:58:59', '2026-02-03 02:15:07', 1, '? Voici ma position exacte.', NULL, 'Moto'),
(24, '671075722', 'simemichel-9045', 'Sime Michel', '', 'Cameroun ', 'Yaoundé', 0, 'Wink express', 1, '2026-02-08 08:21:24', 1, 5.00, 'SIMEMI-1117', NULL, '2026-02-03 02:19:35', '2026-02-03 02:23:31', 1, '? Voici ma position exacte.', NULL, 'Moto'),
(25, '692260821', 'julio-9147', 'Julio', '', 'Cameroun ', 'Yaoundé', 0, 'WINK EXPRESS', 1, '2026-02-08 08:36:46', 0, 5.00, 'JULIO-3068', NULL, '2026-02-03 02:36:23', '2026-02-03 02:37:13', 1, '? Voici ma position exacte.', NULL, 'Moto'),
(26, '693493548', 'franckvincent-7181', 'Franck Vincent', '', 'Cameroun', 'Yaoundé', 0, '', 1, '2026-02-08 08:39:03', 0, 5.00, 'FRANCK-4553', NULL, '2026-02-03 02:38:42', '2026-02-03 02:39:35', 1, '? Voici ma position exacte.', NULL, 'Moto'),
(35, '691670375', 'richkardking-2056', 'Richkard king', '', 'Cameroun', 'Douala', 1, '', 1, '2026-12-31 12:57:49', 1, 5.00, 'RICHKA-4361', NULL, '2026-02-03 06:50:02', '2026-02-03 07:03:45', 1, '? Voici ma position exacte.', NULL, 'Moto'),
(36, '000000000', 'bardon-5224', 'BARDON', '', 'YAOUNDE', 'DOUALA', 1, '', 1, NULL, 0, 5.00, 'BARDON-4106', NULL, '2026-02-03 09:24:06', '2026-02-03 09:24:06', 0, '? Voici ma position exacte.', NULL, 'Moto');

-- --------------------------------------------------------

--
-- Structure de la table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `subscriber_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) DEFAULT 'mobile_money',
  `external_ref` varchar(100) DEFAULT NULL,
  `status` enum('pending','success','failed') DEFAULT 'pending',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `transactions`
--

INSERT INTO `transactions` (`id`, `subscriber_id`, `amount`, `payment_method`, `external_ref`, `status`, `created_at`) VALUES
(2, 12, 150.00, 'orange', 'WINK-b19ab83b-1769971980318', 'pending', '2026-02-01 13:53:00'),
(3, 12, 150.00, 'orange', 'WINK-70190a2f-1769972252301', 'pending', '2026-02-01 13:57:32'),
(9, 14, 150.00, 'mtn', 'WINK-f67cbdc3-1769974554056', 'success', '2026-02-01 14:35:54'),
(10, 15, 150.00, 'mtn', 'WINK-0705400e-1769979427566', 'pending', '2026-02-01 15:57:07'),
(11, 14, 150.00, 'mtn', 'WINK-e62f5d0d-1769979459012', 'success', '2026-02-01 15:57:39'),
(12, 17, 150.00, 'orange', 'WINK-5e42f40b-1770012801353', 'pending', '2026-02-02 01:13:21'),
(13, 15, 150.00, 'orange', 'WINK-d334c4cc-1770023139995', 'pending', '2026-02-02 04:05:40'),
(14, 15, 150.00, 'campay', 'WINK-7b94e4cc-1770123028925', 'pending', '2026-02-03 07:50:28'),
(15, 15, 150.00, 'campay', 'WINK-ed440de6-1770123070937', 'pending', '2026-02-03 07:51:10'),
(16, 15, 150.00, 'campay', 'WINK-cf4c6108-1770123101425', 'pending', '2026-02-03 07:51:41'),
(17, 15, 150.00, 'campay', 'WINK-98fdd0c5-1770124008089', 'success', '2026-02-03 08:06:48');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `app_settings`
--
ALTER TABLE `app_settings`
  ADD PRIMARY KEY (`setting_key`);

--
-- Index pour la table `gps_logs`
--
ALTER TABLE `gps_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `subscriber_id` (`subscriber_id`);

--
-- Index pour la table `promo_codes`
--
ALTER TABLE `promo_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Index pour la table `subscribers`
--
ALTER TABLE `subscribers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `phone_number` (`phone_number`),
  ADD UNIQUE KEY `magic_slug` (`magic_slug`),
  ADD UNIQUE KEY `referral_code` (`referral_code`);

--
-- Index pour la table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `subscriber_id` (`subscriber_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `gps_logs`
--
ALTER TABLE `gps_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT pour la table `promo_codes`
--
ALTER TABLE `promo_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `subscribers`
--
ALTER TABLE `subscribers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT pour la table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `gps_logs`
--
ALTER TABLE `gps_logs`
  ADD CONSTRAINT `gps_logs_ibfk_1` FOREIGN KEY (`subscriber_id`) REFERENCES `subscribers` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`subscriber_id`) REFERENCES `subscribers` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
