
import React, { useState, useRef } from 'react';
import { auth } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from "firebase/auth";

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // LOGIN FLOW
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
          console.error("Login Error", err.code);
          // Specific requirement: Display "Password or Email Incorrect"
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
          // Optional: Update display name immediately if we were saving user info contextually
          if (name) {
            await updateProfile(userCredential.user, { displayName: name });
          }
        } catch (err: any) {
           console.error("Register Error", err.code);
           // Specific requirement
           if (err.code === 'auth/email-already-in-use') {
             throw new Error("User already exists. Sign in?");
           }
           throw err;
        }
      }
    } catch (err: any) {
      // If error message is "User already exists...", we want to show it but maybe link to login
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchToLogin = () => {
    setIsLogin(true);
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
               <label className="text-[10px] font-bold uppercase text-stone-400">Password</label>
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
        </div>
      </div>
    </div>
  );
};

export default Auth;
