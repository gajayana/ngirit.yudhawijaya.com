#!/usr/bin/env node

import type { FirebaseApp } from 'firebase/app';
import { initializeApp } from 'firebase/app';
import type { DocumentData, Firestore } from 'firebase/firestore';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync } from 'fs';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

/**
 * Firebase configuration interface
 */
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

/**
 * Firebase service class for Firestore operations
 */
class FirestoreService {
  private app: FirebaseApp;
  private db: Firestore;

  constructor() {
    const firebaseConfig: FirebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY || '',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
      databaseURL: process.env.FIREBASE_DATABASE_URL || '',
      projectId: process.env.FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.FIREBASE_APP_ID || '',
    };

    // Validate required configuration
    this.validateConfig(firebaseConfig);

    // Initialize Firebase
    this.app = initializeApp(firebaseConfig);
    this.db = getFirestore(this.app);

    console.log('✅ Firebase initialized successfully');
    console.log(`📊 Connected to project: ${firebaseConfig.projectId}`);
  }

  /**
   * Validate Firebase configuration
   */
  private validateConfig(config: FirebaseConfig): void {
    const requiredFields = [
      'apiKey',
      'authDomain',
      'projectId',
      'storageBucket',
      'messagingSenderId',
      'appId',
    ];

    const missingFields = requiredFields.filter(field => !config[field as keyof FirebaseConfig]);

    if (missingFields.length > 0) {
      console.error('❌ Missing required Firebase configuration:');
      missingFields.forEach(field => console.error(`   - ${field.toUpperCase()}`));
      console.error('\nPlease check your .env file and ensure all Firebase variables are set.');
      process.exit(1);
    }
  }

  /**
   * Authenticate with email and password
   */
  async authenticate(email: string, password: string): Promise<void> {
    try {
      console.log('🔐 Authenticating user...');
      const auth = getAuth(this.app);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log(`✅ Authenticated as: ${userCredential.user.email}`);
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      throw error;
    }
  }

  /**
   * Fetch all documents from spendings collection
   */
  async fetchSpendings(): Promise<DocumentData[]> {
    try {
      console.log('📁 Fetching spendings collection...');

      const collectionRef = collection(this.db, 'spendings');
      const querySnapshot = await getDocs(collectionRef);

      const documents: DocumentData[] = [];
      querySnapshot.forEach(doc => {
        documents.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      console.log(`✅ Fetched ${documents.length} spendings documents`);
      return documents;
    } catch (error) {
      console.error('❌ Error fetching spendings collection:', error);
      throw error;
    }
  }
}

/**
 * Main function to fetch spendings and save to JSON
 */
async function main(): Promise<void> {
  try {
    const firestore = new FirestoreService();

    // Authenticate if credentials are provided
    const email = process.env.FIREBASE_AUTH_EMAIL;
    const password = process.env.FIREBASE_AUTH_PASSWORD;

    if (email && password) {
      await firestore.authenticate(email, password);
    } else {
      console.log('⚠️  No authentication credentials provided.');
      console.log('💡 Add FIREBASE_AUTH_EMAIL and FIREBASE_AUTH_PASSWORD to your .env file.');
      process.exit(1);
    }

    // Fetch spendings data
    const spendings = await firestore.fetchSpendings();

    // Save to JSON file
    const outputPath = resolve(process.cwd(), 'supabase/data/spendings.json');
    const jsonData = JSON.stringify(spendings, null, 2);

    writeFileSync(outputPath, jsonData, 'utf8');

    console.log(`💾 Saved ${spendings.length} spendings to: ${outputPath}`);
    console.log('🎉 Data fetch completed successfully!');
  } catch (error) {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  }
}

// Execute main function
main().catch(console.error);

export { FirestoreService };
