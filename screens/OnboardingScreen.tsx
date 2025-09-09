import React, { useState, useEffect } from 'react';
// FIX: Use named imports for react-router-dom v6 hooks.
import { useNavigate } from 'react-router-dom';
import firebase from 'firebase/compat/app';
import { db, serverTimestamp } from '../utils/firebase';
import type { ListenerProfile } from '../types';

import WelcomeStep from '../components/onboarding/WelcomeStep';
import ProfileStep from '../components/onboarding/ProfileStep';
import RulesStep from '../components/onboarding/RulesStep';
import ConsentStep from '../components/onboarding/ConsentStep';
import StepProgress from '../components/onboarding/StepProgress';

interface OnboardingScreenProps {
  user: firebase.User;
}

export interface OnboardingData {
  selectedAvatar: string;
  city: string;
  age: string;
  agreedToTerms: boolean;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ user }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [listenerData, setListenerData] = useState<ListenerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<OnboardingData>({
    selectedAvatar: '',
    city: '',
    age: '',
    agreedToTerms: false,
  });

  useEffect(() => {
    const fetchListenerData = async () => {
      try {
        const docRef = db.collection('listeners').doc(user.uid);
        const doc = await docRef.get();
        if (doc.exists) {
          setListenerData(doc.data() as ListenerProfile);
        } else {
          setError('Your partially approved profile was not found. Please contact support.');
        }
      } catch (err) {
        console.error("Error fetching listener data:", err);
        setError('Could not load your information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchListenerData();
  }, [user.uid]);

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const listenerUpdate = {
        avatarUrl: formData.selectedAvatar,
        city: formData.city,
        age: parseInt(formData.age, 10),
        status: 'pending', // Set to pending for final admin approval
        onboardingComplete: true,
      };

      await db.collection('listeners').doc(user.uid).update(listenerUpdate);
      
      navigate('/pending-approval', { replace: true });

    } catch (err) {
      console.error("Failed to submit onboarding data:", err);
      setError('An error occurred during submission. Please try again.');
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <WelcomeStep nextStep={nextStep} userData={listenerData} />;
      case 2:
        return <ProfileStep nextStep={nextStep} prevStep={prevStep} formData={formData} setFormData={setFormData} />;
      case 3:
        return <RulesStep nextStep={nextStep} prevStep={prevStep} />;
      case 4:
        return <ConsentStep handleSubmit={handleSubmit} prevStep={prevStep} formData={formData} setFormData={setFormData} isSubmitting={loading} />;
      default:
        return <div>Unknown step</div>;
    }
  };
  
  const totalSteps = 4;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md mx-auto">
            <header className="text-center mb-4">
                <h1 className="text-3xl font-bold text-cyan-700 dark:text-cyan-400">SakoonApp</h1>
                <p className="text-slate-500 dark:text-slate-400">Listener Onboarding</p>
            </header>
            
            <StepProgress currentStep={step} totalSteps={totalSteps} />

            <main className="mt-4">
                {loading && step === 1 && <div className="text-center p-8">Loading your details...</div>}
                {error && <div className="text-center p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}
                {!loading && !error && renderStep()}
            </main>
        </div>
    </div>
  );
};

export default OnboardingScreen;