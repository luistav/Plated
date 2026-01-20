
import { db } from '../firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

// Generic database service handling the 'users/{uid}/{collection}' structure
// This ensures strict data privacy as requested.
export const DbService = {
  
  // Real-time listener
  subscribe: (userId: string, collectionName: string, onData: (data: any[]) => void, onError?: (error: any) => void) => {
    const q = collection(db, 'users', userId, collectionName);
    return onSnapshot(q, (snapshot) => {
      // Map doc.id explicitly to ensure the object always has a valid ID
      // This is crucial because sometimes the ID isn't stored in the document body
      const data = snapshot.docs.map(doc => ({ 
        ...doc.data(), 
        id: doc.id 
      }));
      onData(data);
    }, (error) => {
      console.error(`Error subscribing to ${collectionName}:`, error);
      if (onError) onError(error);
    });
  },

  // Create (Injects userId automatically)
  add: async (userId: string, collectionName: string, data: any) => {
    // 1. Inject userId
    const dataWithUser = { ...data, userId };
    
    // 2. Deep sanitize to remove 'undefined' values which crash Firestore
    const cleanData = JSON.parse(JSON.stringify(dataWithUser));
    
    // Use data.id as the document key to ensure consistency
    await setDoc(doc(db, 'users', userId, collectionName, data.id), cleanData);
  },

  // Update
  update: async (userId: string, collectionName: string, data: any) => {
    const cleanData = JSON.parse(JSON.stringify(data));
    await updateDoc(doc(db, 'users', userId, collectionName, data.id), cleanData);
  },

  // Delete
  delete: async (userId: string, collectionName: string, id: string) => {
    console.log(`Deleting document: users/${userId}/${collectionName}/${id}`);
    
    if (!id) {
        console.error("Delete operation failed: Invalid ID");
        alert("Cannot delete item: Item ID is missing. Please refresh the page and try again.");
        return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId, collectionName, id));
      console.log(`Successfully deleted ${id}`);
    } catch (error) {
      console.error(`Error deleting document ${id}:`, error);
      alert("Failed to delete item. Please check your connection.");
      throw error;
    }
  },

  // Batch Seeding Helper
  seed: async (userId: string, collectionName: string, items: any[], batch: any) => {
     items.forEach(item => {
        const cleanItem = JSON.parse(JSON.stringify({ ...item, userId }));
        const ref = doc(db, 'users', userId, collectionName, item.id);
        batch.set(ref, cleanItem);
     });
  }
};
