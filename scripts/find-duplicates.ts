#!/usr/bin/env node

import { resolve } from 'path';
import { readFileSync } from 'fs';

/**
 * Unified expense record format
 */
interface ExpenseRecord {
  id: string;
  created_at: number; // Unix timestamp
  label: string;
  value: number;
  updated_at: number; // Unix timestamp
  user_id?: string; // Optional, from Firestore
}

/**
 * Generate deduplication key
 */
function getDedupeKey(record: ExpenseRecord): string {
  const date = new Date(record.created_at * 1000).toISOString().split('T')[0];
  const label = record.label.toLowerCase().trim();
  return `${date}_${label}_${record.value}`;
}

/**
 * Get source from record ID
 */
function getSource(record: ExpenseRecord): string {
  return record.id.startsWith('mysql_') ? 'MySQL' : 'Firestore';
}

/**
 * Main function to find duplicates
 */
async function main(): Promise<void> {
  try {
    console.log('📁 Reading expense data files...\n');

    const firestorePath = resolve(process.cwd(), 'supabase/data/oldies/expense-firestore.json');
    const mysqlPath = resolve(process.cwd(), 'supabase/data/oldies/expense-mysql.json');

    // Read both files
    const firestoreData: ExpenseRecord[] = JSON.parse(readFileSync(firestorePath, 'utf8'));
    const mysqlData: ExpenseRecord[] = JSON.parse(readFileSync(mysqlPath, 'utf8'));

    console.log(`✅ Loaded ${firestoreData.length} Firestore records`);
    console.log(`✅ Loaded ${mysqlData.length} MySQL records\n`);

    // Combine datasets
    const combined = [...firestoreData, ...mysqlData];

    // Find duplicates
    const dedupeMap = new Map<string, ExpenseRecord[]>();

    combined.forEach(record => {
      const key = getDedupeKey(record);
      if (!dedupeMap.has(key)) {
        dedupeMap.set(key, []);
      }
      dedupeMap.get(key)!.push(record);
    });

    // Filter only duplicate groups (more than 1 record with same key)
    const duplicates = Array.from(dedupeMap.entries()).filter(([_, records]) => records.length > 1);

    console.log(`🔍 Found ${duplicates.length} duplicate groups:\n`);
    console.log('=' .repeat(80));

    duplicates.forEach(([key, records], index) => {
      const firstRecord = records[0];
      const date = new Date(firstRecord.created_at * 1000).toLocaleDateString('id-ID');

      console.log(`\n${index + 1}. Duplicate Group:`);
      console.log(`   Key: ${key}`);
      console.log(`   Date: ${date}`);
      console.log(`   Description: ${firstRecord.label}`);
      console.log(`   Amount: Rp ${firstRecord.value.toLocaleString('id-ID')}`);
      console.log(`   Found in ${records.length} sources:`);

      records.forEach(record => {
        console.log(`     - ${getSource(record)} (ID: ${record.id})`);
      });
    });

    console.log('\n' + '='.repeat(80));
    console.log(`\n📊 Summary:`);
    console.log(`   Total duplicate groups: ${duplicates.length}`);
    console.log(`   Total duplicate records: ${duplicates.reduce((sum, [_, records]) => sum + records.length, 0)}`);
    console.log(`   Records that will be removed: ${duplicates.reduce((sum, [_, records]) => sum + records.length - 1, 0)}`);

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
