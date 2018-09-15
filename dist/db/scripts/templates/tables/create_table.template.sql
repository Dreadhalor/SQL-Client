--======================================
--  Create Table Template
--  RUN-ORDER 0
--======================================
USE [<database_name>]

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES where TABLE_NAME = '<table_name>')
BEGIN
  CREATE TABLE [<table_name>] (
    <table_init_fields>
  )
END