DROP SCHEMA IF EXISTS test_db_web_api;
CREATE SCHEMA test_db_web_api;
USE test_db_web_api;


SET AUTOCOMMIT=1;
SET NAMES utf8;


CREATE TABLE Entries (
	id MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
	description VARCHAR(100) DEFAULT NULL,
	number INT UNSIGNED NOT NULL DEFAULT 0,
	last_modif DATETIME NOT NULL,
	PRIMARY KEY(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO Entries (id, description, number, last_modif) VALUES
(1,'description test',3,'2020-09-24 23:23:23'),
(2,'rien',4,'2020-09-26 22:06:54');



DELIMITER |
CREATE TRIGGER trigger_insert_entry BEFORE INSERT
ON Entries FOR EACH ROW
BEGIN
	SET NEW.last_modif = NOW();
END |

CREATE TRIGGER trigger_update_entry BEFORE UPDATE
ON Entries FOR EACH ROW
BEGIN
	SET NEW.last_modif = NOW();
END |
DELIMITER ;


SET AUTOCOMMIT=1;

