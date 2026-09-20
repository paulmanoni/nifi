-- Legacy-style MySQL fixture for the MySQL → PostgreSQL integration test.
SET SESSION cte_max_recursion_depth = 1000000;
SET SESSION sql_mode = '';
DROP DATABASE IF EXISTS legacy; CREATE DATABASE legacy CHARACTER SET utf8mb4; USE legacy;
CREATE TABLE Departments (DeptId int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY, DeptName varchar(80) NOT NULL, Budget decimal(14,2), UNIQUE KEY uq_name (DeptName)) ENGINE=InnoDB;
CREATE TABLE Employees (
  id bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY, DeptId int unsigned, FullName varchar(100), IsActive tinyint(1) DEFAULT 1,
  Flags bit(8), Deleted bit(1) DEFAULT b'0', Hired date, UpdatedAt datetime DEFAULT CURRENT_TIMESTAMP, LastSeen timestamp NULL,
  Shift time, BornYear year, Status enum('active','on leave','gone') DEFAULT 'active', Skills set('go','sql','python'),
  Meta json, Photo blob, Bio text, Salary double, Rating float, Big bigint unsigned,
  KEY idx_dept (DeptId), KEY idx_name (FullName),
  CONSTRAINT fk_emp_dept FOREIGN KEY (DeptId) REFERENCES Departments(DeptId)) ENGINE=InnoDB;
CREATE TABLE Translations (Code varchar(20), Lang char(2), Label varchar(200), PRIMARY KEY (Code, Lang));
CREATE TABLE AuditLog (Msg varchar(255), At datetime);
INSERT INTO Departments (DeptName, Budget) VALUES ('Engineering', 1000000.50), ('Sales', 25.00), ('Ops', NULL);
SET FOREIGN_KEY_CHECKS=0;
INSERT INTO Employees (DeptId, FullName, IsActive, Flags, Deleted, Hired, UpdatedAt, LastSeen, Shift, BornYear, Status, Skills, Meta, Photo, Bio, Salary, Rating, Big)
WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM seq WHERE n < 100000)
SELECT 1 + n % 3, CONCAT('Employee ', n), n % 2, n % 256, n % 7 = 0,
  IF(n % 50 = 0, '0000-00-00', DATE_ADD('2000-01-01', INTERVAL n % 8000 DAY)),
  IF(n % 97 = 0, '0000-00-00 00:00:00', TIMESTAMP('2020-01-01') + INTERVAL n MINUTE),
  IF(n % 3 = 0, NULL, TIMESTAMP('2024-06-01') + INTERVAL n SECOND),
  SEC_TO_TIME(n % 86400), 1950 + n % 60, ELT(1 + n % 3, 'active','on leave','gone'), IF(n%2=0,'go,sql','python'),
  JSON_OBJECT('n', n, 'tags', JSON_ARRAY('a', 'b')), UNHEX(MD5(n)),
  IF(n % 1000 = 0, CONCAT('bio', CHAR(0), 'with nul'), CONCAT('Bio ', n)), n * 1.5, n / 3, 18446744073709551615 - n
FROM seq;
INSERT INTO Employees (id, DeptId, FullName) VALUES (100500, 99, 'orphan dept');
SET FOREIGN_KEY_CHECKS=1;
INSERT INTO Translations WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM seq WHERE n < 5000) SELECT CONCAT('k', n), 'en', CONCAT('Label ', n) FROM seq;
INSERT INTO Translations WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM seq WHERE n < 5000) SELECT CONCAT('k', n), 'sw', CONCAT('Lebo ', n) FROM seq;
INSERT INTO AuditLog VALUES ('x', NOW()), ('y', '0000-00-00 00:00:00');
ANALYZE TABLE Departments, Employees, Translations, AuditLog;

-- Enrichment fixture: users get first/last name from applicant, else employer_users.
USE legacy;
CREATE TABLE `user` (id int NOT NULL AUTO_INCREMENT PRIMARY KEY, username varchar(60) NOT NULL, email varchar(120), is_active tinyint(1) DEFAULT 1);
CREATE TABLE applicant (id int NOT NULL AUTO_INCREMENT PRIMARY KEY, user_id int NOT NULL, first_name varchar(60), last_name varchar(60), KEY (user_id));
CREATE TABLE employer_users (id int NOT NULL AUTO_INCREMENT PRIMARY KEY, user_id int NOT NULL, first_name varchar(60), last_name varchar(60), phone varchar(20), deleted tinyint(1) DEFAULT 0, KEY (user_id));
INSERT INTO `user` (username, email) WITH RECURSIVE s(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM s WHERE n < 300) SELECT CONCAT('u', n), CONCAT('u', n, '@x.io') FROM s;
INSERT INTO applicant (user_id, first_name, last_name) WITH RECURSIVE s(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM s WHERE n < 150) SELECT n, CONCAT('AppFirst', n), CONCAT('AppLast', n) FROM s;
-- users 151-160 also have an applicant row with empty names: the employer name must win
INSERT INTO applicant (user_id, first_name, last_name) WITH RECURSIVE s(n) AS (SELECT 151 UNION ALL SELECT n+1 FROM s WHERE n < 160) SELECT n, '', NULL FROM s;
INSERT INTO employer_users (user_id, first_name, last_name, phone) WITH RECURSIVE s(n) AS (SELECT 151 UNION ALL SELECT n+1 FROM s WHERE n < 250) SELECT n, CONCAT('EmpFirst', n), CONCAT('EmpLast', n), CONCAT('+255', n) FROM s;
-- a deleted duplicate employer row for user 151 that must be ignored by the lookup filter
INSERT INTO employer_users (user_id, first_name, last_name, deleted) VALUES (151, 'Deleted', 'Row', 1);
UPDATE employer_users SET deleted = 1 WHERE user_id = 250;
