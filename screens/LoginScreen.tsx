import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { auth } from '../utils/firebase';

// --- Icon Components ---
const PhoneIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.298-.083.465a7.48 7.48 0 003.429 3.429c.167.081.364.052.465-.083l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C6.542 22.5 1.5 17.458 1.5 9.75V4.5z" clipRule="evenodd" />
    </svg>
);

const LockIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
);


declare global {
  interface Window {
    recaptchaVerifier?: firebase.auth.RecaptchaVerifier;
    confirmationResult?: firebase.auth.ConfirmationResult;
  }
}

const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (!document.getElementById('recaptcha-container')) {
        const container = document.createElement('div');
        container.id = 'recaptcha-container';
        document.body.appendChild(container);
    }

    window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
      'size': 'invisible',
      'callback': () => { /* reCAPTCHA solved */ }
    });

    return () => {
      window.recaptchaVerifier?.clear();
    };
  }, []);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number.');
      setLoading(false);
      return;
    }
    try {
      const confirmationResult = await auth.signInWithPhoneNumber(`+91${phoneNumber}`, window.recaptchaVerifier!);
      window.confirmationResult = confirmationResult;
      setStep('otp');
    } catch (err: any) {
      console.error(err);
      setError('Failed to send OTP. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      setLoading(false);
      return;
    }
    try {
      await window.confirmationResult?.confirm(otp);
      // On successful login, the App.tsx router will handle navigation.
    } catch (err) {
      console.error(err);
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div id="recaptcha-container" className="hidden"></div>

       {/* Background Image and Overlay */}
      <div className="absolute inset-0 z-0">
          <div 
              className="absolute inset-0 bg-cover bg-center opacity-30" 
              style={{backgroundImage: `url('https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1888&auto=format&fit=crop')`}}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-sm">
        {step === 'phone' ? (
           <>
              <div className="text-center mb-8">
                <h1 className="text-5xl font-bold text-white">SakoonApp Admin</h1>
                <p className="mt-3 text-lg text-cyan-200">Listener Portal Login</p>
              </div>
              <div className="w-full bg-slate-800/50 backdrop-blur-sm border border-white/20 p-8 rounded-2xl">
                  <form onSubmit={handlePhoneSubmit}>
                      <div className="relative mb-4">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                              <PhoneIcon className="w-5 h-5" />
                              <span className="ml-2 font-semibold">+91</span>
                          </div>
                          <input 
                            type="tel" 
                            value={phoneNumber} 
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))} 
                            placeholder="मोबाइल नंबर" 
                            className="w-full bg-white/10 border border-white/20 text-white placeholder-cyan-200/50 text-lg rounded-xl block pl-24 p-3.5 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none transition-colors" 
                            required 
                            maxLength={10}
                          />
                      </div>
                      <button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl transition-colors disabled:bg-cyan-800 disabled:cursor-not-allowed">
                          {loading ? 'भेजा जा रहा है...' : 'OTP पाएं'}
                      </button>
                  </form>
                  {error && <p className="text-red-300 bg-red-900/50 p-3 rounded-lg text-center mt-4 text-sm">{error}</p>}
              </div>
           </>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white">OTP Verification</h1>
              <p className="mt-3 text-lg text-cyan-200">Enter the code sent to +91 {phoneNumber}</p>
            </div>
            <div className="w-full bg-slate-800/50 backdrop-blur-sm border border-white/20 p-8 rounded-2xl">
              <form onSubmit={handleOtpSubmit}>
                  <div className="relative mb-4">
                       <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                          <LockIcon className="w-5 h-5"/>
                      </div>
                      <input
                          type="tel"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                          placeholder="6-अंकीय OTP"
                          className="w-full bg-white/10 border border-white/20 text-white placeholder-cyan-200/50 text-lg rounded-xl tracking-[0.5em] text-center p-3.5 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none transition-colors"
                          required
                          maxLength={6}
                      />
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl transition-colors disabled:bg-cyan-800 disabled:cursor-not-allowed">
                      {loading ? 'सत्यापित हो रहा है...' : 'सत्यापित करें'}
                  </button>
              </form>
               {error && <p className="text-red-300 bg-red-900/50 p-3 rounded-lg text-center mt-4 text-sm">{error}</p>}
               <button onClick={() => { setStep('phone'); setError(''); }} className="w-full text-center mt-6 text-sm text-cyan-200 hover:text-white">
                Change Number
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
