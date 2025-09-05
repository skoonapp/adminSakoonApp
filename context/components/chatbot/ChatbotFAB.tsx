import React from 'react';

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
    <path fill="currentColor" d="M19.05 4.91A9.816 9.816 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91v.01c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91a9.85 9.85 0 0 0-2.91-7.01zM12.04 20.13c-1.53 0-3.03-.38-4.38-1.12l-.31-.18-3.24.85.87-3.18-.2-.33a8.168 8.168 0 0 1-1.26-4.38c0-4.49 3.62-8.12 8.12-8.12 2.18 0 4.22.86 5.74 2.38s2.38 3.56 2.38 5.74c0 4.49-3.63 8.12-8.12 8.12zm4.2-6.11c-.24-.12-1.42-.7-1.64-.78s-.38-.12-.54.12c-.16.24-.62.78-.76.94s-.28.18-.52.06c-.24-.12-1.02-.38-1.94-1.2c-.72-.64-1.2-1.42-1.35-1.66s-.02-.38.11-.5c.11-.1.24-.26.37-.39s.16-.24.24-.4c.08-.16.04-.3-.02-.42s-.54-1.29-.74-1.76c-.2-.48-.4-.41-.55-.41h-.48c-.16 0-.42.06-.64.3s-.84.82-.84 2c0 1.18.86 2.32 1 2.48s1.69 2.58 4.1 3.59c.58.24 1.03.38 1.4.48s.66.15.91-.09c.28-.27.62-.7.71-1.34s.09-1.2-.01-1.32z" />
  </svg>
);

interface ChatbotFABProps {
  onClick: () => void;
}

const ChatbotFAB: React.FC<ChatbotFABProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 transform hover:scale-110 transition-all duration-200"
      aria-label="Open AI Support Chat"
    >
      <WhatsAppIcon className="w-8 h-8" />
    </button>
  );
};

export default ChatbotFAB;