--======================================
--  Pull By ID From Table Template
--  RUN-ORDER -1
--======================================
USE [<database_name>]

SELECT * FROM [<table_name>] WHERE [<primary_key>] = @<primary_key>