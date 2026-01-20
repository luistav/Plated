
import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { auth, db, storage } from '../firebase';
import { updateProfile, deleteUser } from 'firebase/auth';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

interface ProfileModuleProps {
  userProfile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
}

const ProfileModule: React.FC<ProfileModuleProps> = ({ userProfile, onUpdateProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>(userProfile);
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = async () => {
     setLoading(true);
     try {
       const user = auth.currentUser;
       if (!user) return;

       let newPhotoURL = userProfile.photoURL;

       // 1. Upload new photo if selected
       if (photoPreview) {
          const storageRef = ref(storage, `profile_photos/${user.uid}`);
          await uploadString(storageRef, photoPreview, 'data_url');
          newPhotoURL = await getDownloadURL(storageRef);
       }

       // 2. Update Auth Profile
       await updateProfile(user, {
          displayName: formData.displayName,
          photoURL: newPhotoURL
       });

       // 3. Update Firestore Document
       const docRef = doc(db, "users", user.uid);
       const updatedData = {
          displayName: formData.displayName,
          email: formData.email, // Note: Changing email in Auth requires different flow, we update DB record here for consistency if they match
          role: formData.role,
          bio: formData.bio || '',
          photoURL: newPhotoURL
       };
       
       await updateDoc(docRef, updatedData);

       onUpdateProfile({ ...userProfile, ...updatedData } as UserProfile);
       setIsEditing(false);
       setPhotoPreview(null);

     } catch (e) {
        console.error("Error updating profile", e);
        alert("Failed to update profile.");
     } finally {
        setLoading(false);
     }
  };

  const handleDeleteAccount = async () => {
     if (!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
     
     const user = auth.currentUser;
     if (!user) return;

     setLoading(true);
     try {
        // Delete Firestore Doc
        await deleteDoc(doc(db, "users", user.uid));
        // Delete Auth User
        await deleteUser(user);
     } catch (e) {
        console.error("Error deleting account", e);
        alert("Failed to delete account. You may need to sign in again recently.");
        setLoading(false);
     }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500 pb-20">
       {/* Header Card */}
       <div className="bg-white rounded-[2rem] border border-stone-200 shadow-xl overflow-hidden relative">
          <div className="h-32 bg-stone-900"></div>
          <div className="px-8 pb-8 relative">
             <div className="absolute -top-12 left-8">
                <div className="relative group">
                   <img 
                     src={photoPreview || formData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.displayName || 'Chef')}&background=random`} 
                     className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover bg-white"
                     alt="Profile"
                   />
                   {isEditing && (
                     <div 
                       onClick={() => fileInputRef.current?.click()}
                       className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                     >
                        <i className="fas fa-camera"></i>
                     </div>
                   )}
                   <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handlePhotoUpload} 
                      className="hidden" 
                      accept="image/*"
                   />
                </div>
             </div>
             
             <div className="pt-16 flex justify-between items-start">
                <div>
                   <h1 className="text-2xl font-bold serif text-stone-900">{userProfile.displayName}</h1>
                   <p className="text-stone-500 font-medium">{userProfile.role || 'Chef'}</p>
                   <p className="text-xs text-stone-400 mt-1">{userProfile.email}</p>
                </div>
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="bg-stone-100 text-stone-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-stone-200 transition-colors"
                  >
                     EDIT PROFILE
                  </button>
                )}
             </div>
          </div>
       </div>

       {/* Edit Form */}
       {isEditing ? (
          <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-6">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-stone-900">Edit Details</h3>
               <button onClick={() => { setIsEditing(false); setPhotoPreview(null); setFormData(userProfile); }} className="text-xs text-stone-400 font-bold hover:text-stone-600">CANCEL</button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Display Name</label>
                   <input 
                     className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-stone-900"
                     value={formData.displayName || ''}
                     onChange={e => setFormData({...formData, displayName: e.target.value})}
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Role / Title</label>
                   <input 
                     className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-stone-900"
                     value={formData.role || ''}
                     onChange={e => setFormData({...formData, role: e.target.value})}
                   />
                </div>
                <div className="md:col-span-2 space-y-2">
                   <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Bio / Kitchen Philosophy</label>
                   <textarea 
                     className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-stone-900 h-24"
                     value={formData.bio || ''}
                     onChange={e => setFormData({...formData, bio: e.target.value})}
                     placeholder="Share a bit about your culinary background..."
                   />
                </div>
             </div>

             <div className="pt-4 flex justify-end">
                <button 
                  onClick={saveProfile}
                  disabled={loading}
                  className="bg-stone-900 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg hover:bg-stone-800 transition-all disabled:opacity-50"
                >
                   {loading ? <i className="fas fa-circle-notch fa-spin"></i> : 'SAVE CHANGES'}
                </button>
             </div>
          </div>
       ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm">
                <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
                   <i className="fas fa-quote-left text-stone-300"></i> Bio
                </h3>
                <p className="text-stone-600 text-sm leading-relaxed italic">
                   {userProfile.bio || "No bio added yet."}
                </p>
             </div>
             
             <div className="bg-stone-50 p-8 rounded-[2rem] border border-stone-200 space-y-4">
                <h3 className="font-bold text-stone-900 mb-2">Account Settings</h3>
                <div className="space-y-2 text-xs">
                   <p className="text-stone-500"><span className="font-bold text-stone-700">User ID:</span> <span className="font-mono">{userProfile.uid}</span></p>
                   <p className="text-stone-500"><span className="font-bold text-stone-700">Email:</span> {userProfile.email}</p>
                </div>
                <button 
                  onClick={handleDeleteAccount}
                  className="mt-6 w-full border border-rose-200 bg-rose-50 text-rose-600 py-3 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors"
                >
                   DELETE ACCOUNT
                </button>
             </div>
          </div>
       )}
    </div>
  );
};

export default ProfileModule;
