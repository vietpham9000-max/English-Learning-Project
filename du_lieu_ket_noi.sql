-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 13, 2025 at 06:55 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `du_lieu_ket_noi`
--

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reset_token` varchar(255) DEFAULT NULL,
  `token_expiry` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `created_at`, `reset_token`, `token_expiry`) VALUES
(6, '2311062478', 'abc@gmail.com', '$2b$10$4/08xt/7fD4l6oq2q.A7AuoztZlbub1TcJmnvUPYR.pbRIHFh3raS', 'user', '2025-11-18 06:59:03', NULL, NULL),
(7, 'admin', 'chambomoiem99@gmail.com', '$2b$10$2DM7E9BITK1fcx1gFyxt/eBzMGdRdGHVf2nWH3X.cMUbmqtQfwAGe', 'user', '2025-11-18 07:53:16', NULL, NULL),
(8, 'admin', '2311062478@hunre.edu.vn', '$2b$10$9lhTGB5mV74UbF94L1YHzeDcgqI6Md6nPOIU2ul8Sv26NO/f0xBiK', 'admin', '2025-12-02 02:51:49', NULL, NULL),
(10, 'anh đẹp zai', 'vietpham9000@gmail.com', '$2b$10$q.yncCJba1zPelBwVvYge.yIhHO.tsLTPY7xgj8YOl5LCk7hqJ37C', 'user', '2025-12-11 09:22:10', NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
