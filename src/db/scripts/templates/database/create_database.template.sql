--======================================
--  Create Database Template
--======================================
USE [master]

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name LIKE '<database_name>')
BEGIN
  CREATE DATABASE [<database_name>]
END