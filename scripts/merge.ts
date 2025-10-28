#!/usr/bin/env node

import { resolve } from 'path';
import { readFileSync, writeFileSync } from 'fs';

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
 * Main function to merge expense datasets
 */
async function main(): Promise<void> {
  try {
    console.log('📁 Reading expense data files...');

    const firestorePath = resolve(process.cwd(), 'supabase/data/oldies/expense-firestore.json');
    const mysqlPath = resolve(process.cwd(), 'supabase/data/oldies/expense-mysql.json');

    // Read both files
    const firestoreData: ExpenseRecord[] = JSON.parse(readFileSync(firestorePath, 'utf8'));
    const mysqlData: ExpenseRecord[] = JSON.parse(readFileSync(mysqlPath, 'utf8'));

    console.log(`✅ Loaded ${firestoreData.length} Firestore records`);
    console.log(`✅ Loaded ${mysqlData.length} MySQL records`);

    // Combine datasets
    console.log('🔄 Merging datasets...');
    const combined = [...firestoreData, ...mysqlData];

    console.log(`📊 Total combined: ${combined.length} records`);
    console.log('ℹ️  Keeping all records (no deduplication)');

    // Sort by created_at ascending (oldest first)
    console.log('🔄 Sorting by date (oldest first)...');
    combined.sort((a, b) => a.created_at - b.created_at);

    // Calculate statistics
    const totalValue = combined.reduce((sum, record) => sum + record.value, 0);
    const dates = combined.map(r => new Date(r.created_at * 1000));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    console.log('\n📈 Merge Statistics:');
    console.log(`   Firestore: ${firestoreData.length} records`);
    console.log(`   MySQL: ${mysqlData.length} records`);
    console.log(`   Final total: ${combined.length} records`);
    console.log(`   Total value: Rp ${totalValue.toLocaleString('id-ID')}`);
    console.log(`   Date range: ${minDate.toLocaleDateString('id-ID')} - ${maxDate.toLocaleDateString('id-ID')}`);

    // Save to combined file
    const outputPath = resolve(process.cwd(), 'supabase/data/combined-expense.json');
    const jsonData = JSON.stringify(combined, null, 2);

    writeFileSync(outputPath, jsonData, 'utf8');

    console.log(`\n💾 Saved ${combined.length} expenses to: ${outputPath}`);
    console.log('🎉 Data merge completed successfully!');
    console.log('\n📤 Next step: Upload combined-expense.json at /dashboard/import');

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
