import React, { useMemo } from 'react';
import type { OnboardingData } from '../../screens/OnboardingScreen';

interface ProfileStepProps {
  nextStep: () => void;
  prevStep: () => void;
  formData: OnboardingData;
  setFormData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}

// Generate the list of 1000 avatar images as requested.
const AVATAR_IMAGES = Array.from({ length: 1000 }, (_, i) => `https://listenerimages.netlify.app/images/listener${i + 1}.webp`);


const ProfileStep: React.FC<ProfileStepProps> = ({ nextStep, prevStep, formData, setFormData }) => {

  const isFormValid = useMemo(() => {
    const ageNum = parseInt(formData.age, 10);
    return formData.selectedAvatar && formData.city.trim().length > 2 && !isNaN(ageNum) && ageNum >= 18 && ageNum <= 100;
  }, [formData]);

  const handleSelectAvatar = (url: string) => {
    setFormData(prev => ({ ...prev, selectedAvatar: url }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 animate-fade-in">
      <h2 className="text-xl font-bold text-center text-slate-800 dark:text-slate-200">प्रोफ़ाइल पूरी करें</h2>
      
      <div className="mt-6">
        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">अपनी प्रोफ़ाइल फोटो चुनें</label>
        
        {/* Selected Image Preview */}
        <div className="mt-4 flex justify-center">
            {formData.selectedAvatar ? (
                <img src={formData.selectedAvatar} alt="Selected Avatar" className="w-32 h-32 rounded-full border-4 border-cyan-500 object-cover shadow-lg" />
            ) : (
                <div className="w-32 h-32 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
            )}
        </div>

        {/* Scrollable Image Selection Grid */}
        <div className="h-48 overflow-y-auto grid grid-cols-5 gap-3 mt-4 p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50">
            {AVATAR_IMAGES.map(avatar => (
                <button 
                    key={avatar} 
                    onClick={() => handleSelectAvatar(avatar)}
                    className={`rounded-full focus:outline-none transition-all duration-200 ${formData.selectedAvatar === avatar ? 'ring-2 ring-cyan-500 ring-offset-2 dark:ring-offset-slate-800' : 'ring-2 ring-transparent hover:ring-slate-300'}`}
                >
                    <img src={avatar} alt="Avatar option" className="w-full h-auto aspect-square rounded-full border-2 border-white dark:border-slate-700 object-cover" loading="lazy" />
                </button>
            ))}
        </div>
      </div>
      
      <div className="mt-6 space-y-4">
        <div>
            <label htmlFor="city" className="text-sm font-medium text-slate-600 dark:text-slate-400">शहर का नाम</label>
            <input 
                type="text"
                name="city"
                id="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="अपना शहर दर्ज करें"
                className="mt-1 w-full p-3 h-14 bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
        </div>
         <div>
            <label htmlFor="age" className="text-sm font-medium text-slate-600 dark:text-slate-400">उम्र</label>
            <input 
                type="number"
                name="age"
                id="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="अपनी उम्र दर्ज करें (e.g., 25)"
                className="mt-1 w-full p-3 h-14 bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
        </div>
      </div>

      <div className="flex items-center gap-4 mt-8">
        <button
            onClick={prevStep}
            className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold py-3 px-4 rounded-xl transition-colors"
        >
            वापस
        </button>
        <button
            onClick={nextStep}
            disabled={!isFormValid}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-colors"
        >
            आगे बढ़ें
        </button>
      </div>
    </div>
  );
};

export default ProfileStep;