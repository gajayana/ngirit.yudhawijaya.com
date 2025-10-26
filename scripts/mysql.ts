#!/usr/bin/env node

import { resolve } from 'path';
import { readFileSync, writeFileSync } from 'fs';

/**
 * MySQL spending record interface
 */
interface MySQLSpending {
  ID: number;
  dt: string;
  event: string;
  spending: number;
}

/**
 * Unified expense record format (matching Firestore structure)
 */
interface ExpenseRecord {
  id: string;
  created_at: number; // Unix timestamp
  label: string;
  value: number;
  updated_at: number; // Unix timestamp
}

/**
 * Parse MySQL INSERT statement to extract values
 */
function parseInsertStatement(line: string): MySQLSpending[] {
  const records: MySQLSpending[] = [];

  // Match INSERT INTO pattern
  const insertMatch = line.match(/INSERT INTO `tblspending` VALUES (.+);/);
  if (!insertMatch) return records;

  const valuesString = insertMatch[1];

  // Split by ),( to get individual records
  const valueGroups = valuesString.split('),(');

  valueGroups.forEach(group => {
    // Remove leading/trailing parentheses
    const cleaned = group.replace(/^\(|\)$/g, '');

    // Parse values: (ID, id_limit, 'dt', 'event', spending)
    const match = cleaned.match(/^(\d+),\d+,'([^']+)','([^']+)',(\d+)$/);

    if (match) {
      records.push({
        ID: parseInt(match[1], 10),
        dt: match[2],
        event: match[3],
        spending: parseInt(match[4], 10),
      });
    }
  });

  return records;
}

/**
 * Convert MySQL datetime to Unix timestamp
 */
function mysqlDateToUnix(mysqlDate: string): number {
  // MySQL format: '2014-08-09 00:00:00'
  const date = new Date(mysqlDate);
  return Math.floor(date.getTime() / 1000);
}

/**
 * Transform MySQL records to unified expense format
 */
function transformToExpenseFormat(mysqlRecords: MySQLSpending[]): ExpenseRecord[] {
  return mysqlRecords.map(record => ({
    id: `mysql_${record.ID}`,
    created_at: mysqlDateToUnix(record.dt),
    label: record.event,
    value: record.spending,
    updated_at: mysqlDateToUnix(record.dt),
  }));
}

/**
 * Main function to parse MySQL dump and save to JSON
 */
async function main(): Promise<void> {
  try {
    console.log('📁 Reading MySQL dump file...');

    const inputPath = resolve(process.cwd(), 'supabase/data/oldies/spendings_18bulan.sql');
    const sqlContent = readFileSync(inputPath, 'utf8');

    console.log('⚙️  Parsing INSERT statements...');

    const lines = sqlContent.split('\n');
    const allRecords: MySQLSpending[] = [];

    lines.forEach(line => {
      if (line.includes('INSERT INTO `tblspending` VALUES')) {
        const records = parseInsertStatement(line);
        allRecords.push(...records);
      }
    });

    console.log(`✅ Parsed ${allRecords.length} MySQL records`);

    // Transform to unified format
    console.log('🔄 Transforming to unified expense format...');
    const expenses = transformToExpenseFormat(allRecords);

    // Calculate statistics
    const totalValue = expenses.reduce((sum, record) => sum + record.value, 0);
    const dates = expenses.map(r => new Date(r.created_at * 1000));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    console.log(`💰 Total spending value: Rp ${totalValue.toLocaleString('id-ID')}`);
    console.log(`📅 Date range: ${minDate.toLocaleDateString('id-ID')} - ${maxDate.toLocaleDateString('id-ID')}`);

    // Save to JSON file
    const outputPath = resolve(process.cwd(), 'supabase/data/oldies/expense-mysql.json');
    const jsonData = JSON.stringify(expenses, null, 2);

    writeFileSync(outputPath, jsonData, 'utf8');

    console.log(`💾 Saved ${expenses.length} expenses to: ${outputPath}`);
    console.log('🎉 MySQL parsing completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  }
}

// Execute main function
main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
