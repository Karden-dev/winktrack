-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : ven. 06 fév. 2026 à 11:34
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `wink_track_db`
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

-- --------------------------------------------------------

--
-- Structure de la table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL COMMENT 'Lien vers la table subscribers',
  `recipient_phone` varchar(20) NOT NULL,
  `recipient_name` varchar(100) DEFAULT NULL,
  `pickup_lat` decimal(10,8) NOT NULL,
  `pickup_lng` decimal(11,8) NOT NULL,
  `pickup_desc` text DEFAULT NULL COMMENT 'Description du colis',
  `dropoff_lat` decimal(10,8) DEFAULT NULL,
  `dropoff_lng` decimal(11,8) DEFAULT NULL,
  `distance_km` decimal(5,2) DEFAULT 0.00,
  `estimated_price` decimal(10,2) DEFAULT 0.00,
  `status` enum('DRAFT','WAITING_DROPOFF','READY_TO_PAY','PAID','ASSIGNED','COMPLETED','CANCELLED') DEFAULT 'DRAFT',
  `magic_token` varchar(64) DEFAULT NULL COMMENT 'Token unique pour le lien du destinataire',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `delivery_otp` varchar(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `orders`
--

INSERT INTO `orders` (`id`, `sender_id`, `recipient_phone`, `recipient_name`, `pickup_lat`, `pickup_lng`, `pickup_desc`, `dropoff_lat`, `dropoff_lng`, `distance_km`, `estimated_price`, `status`, `magic_token`, `created_at`, `updated_at`, `delivery_otp`) VALUES
(4, 16, '656029845', 'KAMGA', 3.86150212, 11.52072321, 'TELEPHONE', 3.83127435, 11.47133771, 8.77, 1850.00, 'READY_TO_PAY', '816ff09c', '2026-02-05 13:30:36', '2026-02-05 13:31:37', NULL),
(5, 15, '123456666', '3R3', 3.86528224, 11.51793368, 'dccd', 3.89095359, 11.51473008, 3.41, 1050.00, 'READY_TO_PAY', 'cfa6589f', '2026-02-05 13:38:26', '2026-02-05 13:38:36', NULL),
(6, 15, '656029845', 'SZ', 3.90966107, 11.62132183, 'QW', NULL, NULL, 0.00, 0.00, 'WAITING_DROPOFF', '7a9b6a9a', '2026-02-05 14:25:28', '2026-02-05 14:25:28', NULL),
(7, 15, '656029845', 'SZ', 3.90966107, 11.62132183, 'QW', 3.86485051, 11.50809938, 17.85, 2300.00, 'READY_TO_PAY', 'aa661f41', '2026-02-05 14:26:13', '2026-02-05 14:26:34', NULL),
(8, 17, '123456789', 'CDCD', 3.86610000, 11.51540000, 'SAC', 3.86610000, 11.51540000, 0.00, 500.00, 'READY_TO_PAY', '5505c7e5', '2026-02-05 15:28:07', '2026-02-05 15:29:05', NULL),
(9, 18, '656093843', 'KALAS', 3.86165433, 11.58628464, 'SAC', 3.83122720, 11.47128582, 17.38, 2250.00, 'READY_TO_PAY', '9ebcc271', '2026-02-05 18:19:10', '2026-02-05 18:21:02', NULL),
(10, 18, '123332228', 'SAX', 3.82838542, 11.47962570, 'sax', 3.94590773, 11.52232468, 17.41, 2250.00, 'READY_TO_PAY', '974a9104', '2026-02-05 18:23:33', '2026-02-05 18:25:03', NULL),
(11, 18, '123456789', 'CDCD', 3.91565979, 11.52421117, 'tel', 3.94587740, 11.52212620, 4.02, 950.00, 'READY_TO_PAY', '293a21cc', '2026-02-05 18:30:24', '2026-02-05 18:31:09', NULL),
(12, 19, '123456789', 'SZ', 3.86140049, 11.52089596, 'xx', 3.88403263, 11.51910782, 3.33, 800.00, 'READY_TO_PAY', '6022d62b', '2026-02-05 18:35:51', '2026-02-05 18:36:12', NULL);

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
  `default_payment_number` varchar(20) DEFAULT NULL,
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

INSERT INTO `subscribers` (`id`, `phone_number`, `default_payment_number`, `magic_slug`, `first_name`, `last_name`, `country`, `city`, `is_independent`, `company_name`, `is_registered_full`, `subscription_expires_at`, `total_gps_captures`, `reputation_score`, `referral_code`, `referred_by`, `created_at`, `updated_at`, `is_online`, `custom_message_template`, `photo_url`, `vehicle_type`) VALUES
(15, '690484981', NULL, 'user-1770291951855', '', NULL, 'Cameroun', NULL, 0, NULL, 1, NULL, 0, 5.00, NULL, NULL, '2026-02-05 12:45:51', '2026-02-05 12:45:51', 0, '📍 Voici ma position exacte.', NULL, 'Moto'),
(16, '656029845', NULL, 'user-1770294636143', '', NULL, 'Cameroun', NULL, 0, NULL, 1, NULL, 0, 5.00, NULL, NULL, '2026-02-05 13:30:36', '2026-02-05 13:30:36', 0, '📍 Voici ma position exacte.', NULL, 'Moto'),
(17, '23422233333333333333', NULL, 'user-1770301687748', NULL, NULL, 'Cameroun', NULL, 0, NULL, 1, NULL, 0, 5.00, NULL, NULL, '2026-02-05 15:28:07', '2026-02-05 15:28:07', 0, '📍 Voici ma position exacte.', NULL, 'Moto'),
(18, '894320133', NULL, 'user-1770311950518', NULL, NULL, 'Cameroun', NULL, 0, NULL, 1, NULL, 0, 5.00, NULL, NULL, '2026-02-05 18:19:10', '2026-02-05 18:19:10', 0, '📍 Voici ma position exacte.', NULL, 'Moto'),
(19, '', NULL, 'user-1770312951052', NULL, NULL, 'Cameroun', NULL, 0, NULL, 1, NULL, 0, 5.00, NULL, NULL, '2026-02-05 18:35:51', '2026-02-05 18:35:51', 0, '📍 Voici ma position exacte.', NULL, 'Moto');

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
-- Index pour la table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sender_id` (`sender_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT pour la table `promo_codes`
--
ALTER TABLE `promo_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `subscribers`
--
ALTER TABLE `subscribers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT pour la table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `gps_logs`
--
ALTER TABLE `gps_logs`
  ADD CONSTRAINT `gps_logs_ibfk_1` FOREIGN KEY (`subscriber_id`) REFERENCES `subscribers` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_sender` FOREIGN KEY (`sender_id`) REFERENCES `subscribers` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`subscriber_id`) REFERENCES `subscribers` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
