--======================================
--  Save Into Table Template
--  RUN-ORDER -1
--======================================
USE [<database_name>]

UPDATE [<table_name>]
SET
  <table_set_fields>
WHERE [<primary_key>] = @<primary_key>;

IF @@ROWCOUNT=0
BEGIN
  INSERT INTO [<table_name>] (
    <table_insert_fields>
  )
  VALUES (
    <table_insert_values>
  )
END