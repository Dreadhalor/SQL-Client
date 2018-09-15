--======================================
--  Create T-SQL Trigger Template
--  RUN-ORDER 1
--======================================
USE [<database_name>]

IF OBJECT_ID ('[<trigger_name>]','TR') IS NOT NULL
  DROP TRIGGER [<trigger_name>]

EXEC('
  CREATE TRIGGER [<trigger_name>]
    ON "<table_name>"
    FOR UPDATE, INSERT, DELETE
  AS
    BEGIN
      IF EXISTS (SELECT * FROM DELETED UNION ALL SELECT * FROM INSERTED)
      SELECT * FROM DELETED UNION ALL SELECT * FROM INSERTED
    END
')