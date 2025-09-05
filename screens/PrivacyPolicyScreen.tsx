import React from 'react';
import PolicyPageLayout from '../context/components/common/PolicyPageLayout';

const PrivacyPolicyScreen: React.FC = () => {
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <PolicyPageLayout title="Privacy Policy">
            <p className="text-sm"><em>Effective Date: {today}</em><br/><em>Last Updated: {today}</em></p>

            <h2>1. परिचय (Introduction)</h2>
            <p>SakoonApp ("हमारा," "हमारे," या "हम") आपकी privacy को protect करने के लिए committed है। यह Privacy Policy बताती है कि हम आपकी जानकारी को कैसे collect, use, disclose, और safeguard करते हैं।</p>
            
            <h2>2. हम कौन सी जानकारी Collect करते हैं</h2>
            <h3>Personal Information:</h3>
            <ul>
                <li><strong>Registration Data:</strong> नाम, phone number, email address, उम्र</li>
                <li><strong>Profile Information:</strong> Profile picture, bio, preferences</li>
                <li><strong>Identity Verification:</strong> Listeners के लिए - ID documents, background check</li>
                <li><strong>Payment Information:</strong> Banking details, payment history (securely processed)</li>
            </ul>
            <h3>Usage Information:</h3>
            <ul>
                <li><strong>Conversation Data:</strong> Chat messages, call recordings (quality के लिए)</li>
                <li><strong>Activity Logs:</strong> Login times, session duration, feature usage</li>
                <li><strong>Device Information:</strong> Device type, operating system, IP address</li>
            </ul>

            <h2>3. हम आपकी Information का उपयोग कैसे करते हैं</h2>
            <p>हम आपकी जानकारी का उपयोग Service Delivery, Account Management, Payment Processing, और Safety/Security के लिए करते हैं।</p>

            <h2>4. Information Sharing और Disclosure</h2>
            <p>हम Users और listeners के बीच personal contact information शेयर नहीं करते हैं। हम कानूनी आवश्यकताओं या सुरक्षा स्थितियों को छोड़कर आपकी निजी बातचीत को तीसरे पक्ष के साथ साझा नहीं करते हैं।</p>

            <h2>5. Data Security</h2>
            <p>हम आपकी जानकारी की सुरक्षा के लिए Encryption, Access Controls, और Monitoring जैसे सुरक्षा उपायों का उपयोग करते हैं।</p>
            
            <h2>6. Data Retention</h2>
            <p>हम डेटा को तब तक बनाए रखते हैं जब तक आपका खाता सक्रिय रहता है, और कानूनी आवश्यकताओं का पालन करते हैं।</p>

            <h2>7. आपके Privacy Rights</h2>
            <p>आपको अपनी व्यक्तिगत जानकारी देखने, अपडेट करने, डाउनलोड करने और हटाने का अधिकार है।</p>

            <h2>8. Conversation Monitoring</h2>
            <p>Quality और Safety के लिए, बातचीत को monitor किया जा सकता है। इसमें अनुचित सामग्री का पता लगाने के लिए स्वचालित सिस्टम और सुरक्षा उद्देश्यों के लिए मानव समीक्षा शामिल हो सकती है।</p>

            <h2>9. Children's Privacy</h2>
            <p>यह प्लेटफ़ॉर्म 13 वर्ष से कम उम्र के बच्चों के लिए नहीं है। 13-17 वर्ष के उपयोगकर्ताओं को माता-पिता की सहमति की आवश्यकता होती है।</p>

            <h2>10. Contact Information</h2>
            <p>Privacy Concerns के लिए: <a href="mailto:privacy@sakoonapp.com">privacy@sakoonapp.com</a></p>

            <hr/>
            
            <h3>Important Privacy Points for Listeners</h3>
            <ul className="list-none p-0">
                <li><strong className="text-blue-500">🔒 Privacy Protection:</strong> आपकी personal details users के साथ share नहीं होतीं। Banking information fully encrypted रहती है।</li>
                <li><strong className="text-blue-500">📊 Data Usage:</strong> Performance data earning calculation के लिए उपयोग किया जाता है।</li>
                <li><strong className="text-red-500">⚠ Remember:</strong> Personal information sharing = Privacy violation = Account suspension.</li>
            </ul>

             <hr/>
            <p className="italic">SakoonApp का उपयोग करके, आप acknowledge करते हैं कि आपने इस Privacy Policy को पढ़ा और समझा है, और इसमें describe किए गए अनुसार अपनी information के collection, use, और disclosure के लिए consent देते हैं।</p>
            <blockquote>“आपकी Privacy हमारी Priority है - सुरक्षित रूप से connect करें, बिना चिंता के earn करें।”</blockquote>
        </PolicyPageLayout>
    );
};

export default PrivacyPolicyScreen;