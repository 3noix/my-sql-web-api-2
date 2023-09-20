DROP TABLE IF EXISTS Entries;

CREATE TABLE Entries (
	id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	description VARCHAR(100) DEFAULT NULL,
	number INTEGER NOT NULL DEFAULT 0,
	last_modif TEXT NOT NULL DEFAULT (datetime())
);

INSERT INTO Entries (id, description, number, last_modif) VALUES
(1,'description test',3,'2020-09-24 23:23:23'),
(2,'rien',4,'2020-09-26 22:06:54');

CREATE TRIGGER trigger_update_entry BEFORE UPDATE
ON Entries FOR EACH ROW
BEGIN
	UPDATE Entries SET last_modif=datetime('now','localtime') WHERE id=NEW.id;
END;

