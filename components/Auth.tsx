
import React, { useState, useRef } from 'react';
import { auth, db, storage } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
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

  const uploadProfilePhoto = async (uid: string, dataUrl: string) => {
    try {
      const storageRef = ref(storage, `profile_photos/${uid}`);
      await uploadString(storageRef, dataUrl, 'data_url');
      return await getDownloadURL(storageRef);
    } catch (e) {
      console.error("Error uploading photo", e);
      return null;
    }
  };

  const syncUserToFirestore = async (user: any, additionalData: any = {}) => {
     const userRef = doc(db, "users", user.uid);
     const userSnap = await getDoc(userRef);

     if (!userSnap.exists()) {
       // Create new document
       await setDoc(userRef, {
         uid: user.uid,
         email: user.email,
         displayName: user.displayName || additionalData.displayName || '',
         photoURL: user.photoURL || additionalData.photoURL || '',
         role: 'Head Chef', // Default role
         createdAt: Date.now(),
         ...additionalData
       });
     } else {
       // Optional: Update last login
       await setDoc(userRef, { lastLogin: Date.now() }, { merge: true });
     }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // LOGIN FLOW
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          // Sync on login ensures existing users get a doc if they don't have one
          await syncUserToFirestore(userCredential.user);
        } catch (err: any) {
          console.error("Login Error", err.code);
          if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-email') {
             throw new Error("Password or Email Incorrect");
          }
          throw err;
        }
      } else {
        // REGISTRATION FLOW
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          
          let photoURL = '';
          if (photoPreview) {
             const url = await uploadProfilePhoto(user.uid, photoPreview);
             if (url) photoURL = url;
          }

          // Update Firebase Auth Profile
          await updateProfile(user, { 
            displayName: name,
            photoURL: photoURL 
          });

          // Create Firestore Document
          await syncUserToFirestore(user, { displayName: name, photoURL });

        } catch (err: any) {
           console.error("Register Error", err.code);
           if (err.code === 'auth/email-already-in-use') {
             throw new Error("User already exists. Sign in?");
           }
           throw err;
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email) {
      setError("Please enter your email address.");
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
    } catch (err: any) {
      console.error("Reset Password Error", err.code);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchToLogin = () => {
    setIsLogin(true);
    setIsForgotPassword(false);
    setResetEmailSent(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-500">
        
        {/* Header Graphic */}
        <div className="bg-stone-900 text-stone-300 p-8 text-center relative overflow-hidden">
          <div className="relative z-10">
             <div className="w-12 h-12 bg-white text-stone-900 rounded-lg flex items-center justify-center font-bold text-2xl mx-auto mb-4">M</div>
             <h1 className="text-2xl font-bold serif text-white">Mise en Place</h1>
             <p className="text-xs uppercase tracking-widest mt-2">Culinary R&D Engine</p>
          </div>
          <i className="fas fa-utensils absolute -bottom-6 -right-6 text-9xl text-stone-800 opacity-50 transform rotate-12"></i>
        </div>

        <div className="p-8">
           {isForgotPassword ? (
             <>
                <h2 className="text-xl font-bold text-stone-900 mb-6 text-center">Reset Password</h2>
                
                {error && (
                  <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-sm text-rose-600">
                      <i className="fas fa-exclamation-circle"></i>
                      <p>{error}</p>
                  </div>
                )}

                {resetEmailSent ? (
                  <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom duration-300">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl shadow-sm">
                        <i className="fas fa-check"></i>
                    </div>
                    <div>
                        <p className="text-stone-600 mb-2">We sent you a password change link to:</p>
                        <p className="font-bold text-stone-900 bg-stone-50 py-2 px-4 rounded-lg inline-block border border-stone-200">{email}</p>
                        <p className="text-xs text-stone-400 mt-2">Check your spam folder if you don't see it.</p>
                    </div>
                    <button 
                      onClick={switchToLogin} 
                      className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold text-sm shadow-lg hover:bg-stone-800 transition-all"
                    >
                      Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordReset} className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
                    <p className="text-sm text-stone-500 text-center mb-4">Enter your email address and we'll send you a link to reset your password.</p>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-stone-400">Email Address</label>
                      <input 
                        type="email" 
                        required
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-stone-900 transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold text-sm shadow-lg hover:bg-stone-800 transition-all disabled:opacity-50 mt-2"
                    >
                      {loading ? <i className="fas fa-circle-notch fa-spin"></i> : 'Get Reset Link'}
                    </button>

                    <div className="text-center mt-4">
                      <button 
                        type="button" 
                        onClick={switchToLogin} 
                        className="text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </form>
                )}
             </>
           ) : (
             <>
               <h2 className="text-xl font-bold text-stone-900 mb-6 text-center">
                 {isLogin ? 'Chef Login' : 'New Kitchen Profile'}
               </h2>

               {error && (
                 <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-sm text-rose-600">
                    <i className="fas fa-exclamation-circle"></i>
                    <div className="flex-1">
                      <p>{error}</p>
                      {error === "User already exists. Sign in?" && (
                        <button onClick={switchToLogin} className="text-xs font-bold underline mt-1 hover:text-rose-800">
                          Go to Sign In
                        </button>
                      )}
                    </div>
                 </div>
               )}

               <form onSubmit={handleSubmit} className="space-y-4">
                 
                 {!isLogin && (
                   <div className="flex justify-center mb-6">
                     <div 
                       onClick={() => fileInputRef.current?.click()}
                       className="w-24 h-24 rounded-full bg-stone-100 border-2 border-dashed border-stone-300 flex items-center justify-center cursor-pointer hover:bg-stone-50 overflow-hidden relative group transition-all"
                     >
                        {photoPreview ? (
                          <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center text-stone-400">
                            <i className="fas fa-camera text-xl mb-1"></i>
                            <p className="text-[8px] uppercase font-bold">Photo</p>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 hidden group-hover:flex items-center justify-center">
                           <i className="fas fa-edit text-white"></i>
                        </div>
                     </div>
                     <input 
                       type="file" 
                       ref={fileInputRef} 
                       onChange={handlePhotoUpload} 
                       className="hidden" 
                       accept="image/*"
                     />
                   </div>
                 )}

                 {!isLogin && (
                   <div className="space-y-1">
                     <label className="text-[10px] font-bold uppercase text-stone-400">Chef Name</label>
                     <input 
                       type="text" 
                       required
                       className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-stone-900 transition-all"
                       value={name}
                       onChange={(e) => setName(e.target.value)}
                     />
                   </div>
                 )}

                 <div className="space-y-1">
                   <label className="text-[10px] font-bold uppercase text-stone-400">Email Address</label>
                   <input 
                     type="email" 
                     required
                     className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-stone-900 transition-all"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                   />
                 </div>

                 <div className="space-y-1">
                   <div className="flex justify-between items-center">
                     <label className="text-[10px] font-bold uppercase text-stone-400">Password</label>
                     {isLogin && (
                       <button 
                         type="button" 
                         onClick={() => { setIsForgotPassword(true); setError(null); }} 
                         className="text-[10px] font-bold text-stone-400 hover:text-stone-600"
                       >
                         Forgot password?
                       </button>
                     )}
                   </div>
                   <input 
                     type="password" 
                     required
                     className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-stone-900 transition-all"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                   />
                 </div>

                 {!isLogin && (
                   <div className="space-y-1">
                     <label className="text-[10px] font-bold uppercase text-stone-400">Repeat Password</label>
                     <input 
                       type="password" 
                       required
                       className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-stone-900 transition-all"
                       value={confirmPassword}
                       onChange={(e) => setConfirmPassword(e.target.value)}
                     />
                   </div>
                 )}

                 <button 
                   type="submit" 
                   disabled={loading}
                   className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold text-sm shadow-lg hover:bg-stone-800 transition-all disabled:opacity-50 mt-4"
                 >
                   {loading ? <i className="fas fa-circle-notch fa-spin"></i> : (isLogin ? 'ENTER KITCHEN' : 'CREATE ACCOUNT')}
                 </button>
               </form>

               <div className="mt-6 text-center">
                 <button 
                   onClick={() => {
                     setIsLogin(!isLogin); 
                     setError(null);
                     setPhotoPreview(null);
                     setName('');
                     setEmail('');
                     setPassword('');
                     setConfirmPassword('');
                   }} 
                   className="text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors"
                 >
                   {isLogin ? "New here? Create Profile" : "Already have an account? Sign In"}
                 </button>
               </div>
             </>
           )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
