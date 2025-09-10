import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { auth } from '../utils/firebase';
import ApplyAsListener from '../components/auth/ApplyAsListener';

// --- Icon Components ---
const LockIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
);

const WarningIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M8.257 3.099a.75.75 0 011.486 0l5.575 10.655a.75.75 0 01-.643 1.11H3.32a.75.75 0 01-.643-1.11L8.257 3.1zM9 12a1 1 0 112 0 1 1 0 01-2 0zm1-4a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0V8z" clipRule="evenodd" />
    </svg>
);

const SecurityBadge: React.FC = () => (
    <div className="flex justify-center items-center space-x-8 my-6 text-slate-300 animate-fade-in">
        <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-400">
                <path fillRule="evenodd" d="M9.661 2.231a.75.75 0 0 1 .678 0 11.947 11.947 0 0 0 7.078 2.802.75.75 0 0 1 .466.71-12.034 12.034 0 0 1-7.58 10.923.75.75 0 0 1-.662 0A12.034 12.034 0 0 1 2.117 5.743a.75.75 0 0 1 .466-.71 11.947 11.947 0 0 0 7.078-2.802ZM12.23 8.23a.75.75 0 0 0-1.06-1.06L9.5 8.94 8.23 7.67a.75.75 0 0 0-1.06 1.06l1.75 1.75a.75.75 0 0 0 1.06 0l2.25-2.25Z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium">Secure Login</span>
        </div>
        <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-indigo-400">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium">Privacy Protected</span>
        </div>
    </div>
);


declare global {
  interface Window {
    recaptchaVerifier?: firebase.auth.RecaptchaVerifier;
    confirmationResult?: firebase.auth.ConfirmationResult;
  }
}

const LoginScreen: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [resendTimer, setResendTimer] = useState(60);
  const [resendAttempts, setResendAttempts] = useState(0);
  const [showFinalError, setShowFinalError] = useState(false);

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

  useEffect(() => {
    // Use `number` for interval ID type in browser environments instead of `NodeJS.Timeout`.
    let interval: number;
    if (step === 'otp' && resendTimer > 0) {
      interval = window.setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  useEffect(() => {
      if (step === 'phone') {
          setResendTimer(60);
          setResendAttempts(0);
          setShowFinalError(false);
          setError('');
      }
  }, [step]);

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

  const handleResendOtp = async () => {
    if (resendTimer > 0 || resendAttempts >= 2) return;
    setLoading(true);
    setError('');
    setShowFinalError(false);

    try {
      const confirmationResult = await auth.signInWithPhoneNumber(`+91${phoneNumber}`, window.recaptchaVerifier!);
      window.confirmationResult = confirmationResult;
      const newAttempts = resendAttempts + 1;
      setResendAttempts(newAttempts);
      
      if (newAttempts === 1) {
        setResendTimer(120);
      } else {
        setShowFinalError(true);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-start pt-20 p-4 relative overflow-hidden">
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
        <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white">SakoonApp Admin</h1>
            <p className="mt-3 text-lg text-cyan-200">Listener Portal Login</p>
        </div>
        {step === 'phone' ? (
           <div className="w-full bg-slate-800/50 backdrop-blur-sm border border-white/20 p-8 rounded-2xl">
               <form onSubmit={handlePhoneSubmit}>
                   <div className="relative mb-4">
                       <input 
                         type="tel" 
                         value={phoneNumber} 
                         onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))} 
                         placeholder="📞 +91  मोबाइल नंबर"
                         className="w-full bg-white/10 border border-white/20 text-white placeholder-cyan-200/50 text-lg rounded-xl block p-3.5 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none transition-colors" 
                         required 
                         maxLength={10}
                       />
                   </div>
                   <button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl transition-colors disabled:bg-cyan-800 disabled:cursor-not-allowed">
                       {loading ? 'Sending OTP...' : 'OTP पाएं'}
                   </button>
               </form>

               <div className="relative flex py-5 items-center">
                  <div className="flex-grow border-t border-white/20"></div>
                  <span className="flex-shrink mx-4 text-slate-400 text-sm">OR</span>
                  <div className="flex-grow border-t border-white/20"></div>
                </div>

                <ApplyAsListener />

               {error && <p className="text-red-300 bg-red-900/50 p-3 rounded-lg text-center mt-4 text-sm">{error}</p>}
               <SecurityBadge />
                <div className="text-center pt-6 border-t border-white/10 text-slate-300">
                    <p className="text-sm flex items-center justify-center gap-2">
                        <span>🔐</span>
                        <span>Secure Login with OTP Authentication</span>
                    </p>
                    <p className="text-xs mt-2 text-slate-400">App Version: 1.0.0 (Beta)</p>
                </div>
           </div>
        ) : (
          <>
            <div className="w-full bg-slate-800/50 backdrop-blur-sm border border-white/20 p-8 rounded-2xl">
              <div className="text-center mb-6">
                <p className="text-slate-300">Enter the code sent to:</p>
                <p className="font-bold text-white text-lg mt-1">+91 {phoneNumber}</p>
              </div>
              <form onSubmit={handleOtpSubmit} className="mb-4">
                  <div className="relative mb-4">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                          <LockIcon className="w-5 h-5"/>
                      </div>
                      <input
                          type="tel"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                          placeholder="6-Digit OTP"
                          className="w-full bg-white/10 border border-white/20 text-white placeholder-cyan-200/50 text-lg rounded-xl tracking-[0.5em] text-center p-3.5 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none transition-colors"
                          required
                          maxLength={6}
                      />
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl transition-colors disabled:bg-cyan-800 disabled:cursor-not-allowed">
                      {loading ? 'Verifying...' : 'Verify'}
                  </button>
              </form>
              {error && <p className="text-red-300 bg-red-900/50 p-3 rounded-lg text-center mt-4 text-sm">{error}</p>}
              <SecurityBadge />
              <hr className="border-t border-white/10" />
              <div className="text-center pt-6">
                {showFinalError ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-yellow-300">
                        <WarningIcon className="w-5 h-5 flex-shrink-0"/>
                        <span>Please check your mobile number and try again after 15 minutes.</span>
                    </div>
                ) : resendTimer > 0 ? (
                    <p className="text-sm text-slate-400">Resend OTP in {resendTimer}s</p>
                ) : (
                    <button onClick={handleResendOtp} disabled={loading || resendAttempts >= 2} className="text-sm text-cyan-200 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">Resend OTP</button>
                )}
              </div>
              <button onClick={() => setStep('phone')} className="w-full text-center mt-6 text-sm text-slate-400 hover:text-cyan-200">
                Change Number
              </button>
            </div>
          </>
        )}
      </div>
      
      <footer className="absolute bottom-0 left-0 right-0 p-4 text-center text-xs text-slate-400 z-10">
        <p>SakoonApp by Metxfitt Pvt. Ltd. | © 2025 All Rights Reserved</p>
        <p className="mt-1">Contact: support@sakoonapp.com | Follow us: @SakoonApp</p>
      </footer>
    </div>
  );
};

export default LoginScreen;