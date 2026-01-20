
import { db } from '../firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';

// Generic database service handling the 'users/{uid}/{collection}' structure
export const DbService = {
  
  // Real-time listener
  subscribe: (userId: string, collectionName: string, onData: (data: any[]) => void, onError?: (error: any) => void) => {
    const q = collection(db, 'users', userId, collectionName);
    return onSnapshot(q, (snapshot) => {
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

  // Create
  add: async (userId: string, collectionName: string, data: any) => {
    const dataWithUser = { ...data, userId };
    const cleanData = JSON.parse(JSON.stringify(dataWithUser));
    
    if (!data.id) {
        throw new Error("Cannot save item: Missing ID");
    }

    await setDoc(doc(db, 'users', userId, collectionName, data.id), cleanData);
  },

  // Update
  update: async (userId: string, collectionName: string, data: any) => {
    const cleanData = JSON.parse(JSON.stringify(data));
    await updateDoc(doc(db, 'users', userId, collectionName, data.id), cleanData);
  },

  // Delete
  delete: async (userId: string, collectionName: string, id: string) => {
    if (!id || typeof id !== 'string') {
        throw new Error("Cannot delete item: Item ID is invalid.");
    }
    await deleteDoc(doc(db, 'users', userId, collectionName, id));
  },

  // Bulk Delete
  bulkDelete: async (userId: string, collectionName: string, ids: string[]) => {
    if (!ids.length) return;
    const batch = writeBatch(db);
    ids.forEach(id => {
      const ref = doc(db, 'users', userId, collectionName, id);
      batch.delete(ref);
    });
    await batch.commit();
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
