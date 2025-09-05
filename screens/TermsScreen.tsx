import React from 'react';
import PolicyPageLayout from '../context/components/common/PolicyPageLayout';

const TermsScreen: React.FC = () => {
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <PolicyPageLayout title="Terms & Conditions">
            <p className="text-sm"><em>Effective Date: {today}</em><br/><em>Last Updated: {today}</em></p>
            
            <h2>1. परिचय (Introduction)</h2>
            <p>SakoonApp ("हमारा," "हमारे," या "हम") में आपका स्वागत है। ये नियम और शर्तें ("Terms") हमारे emotional support और listening platform के उपयोग को नियंत्रित करती हैं। SakoonApp का उपयोग करके, आप इन Terms से बाध्य होने के लिए सहमत हैं।</p>

            <h2>2. परिभाषाएं (Definitions)</h2>
            <ul>
                <li><strong>"User"</strong> - भावनात्मक सहायता या बातचीत की तलाश करने वाला व्यक्ति</li>
                <li><strong>"Listener"</strong> - सुनने और सहायता सेवाएं प्रदान करने वाला verified व्यक्ति</li>
                <li><strong>"Platform"</strong> - SakoonApp mobile application और संबंधित सेवाएं</li>
                <li><strong>"Services"</strong> - Platform के माध्यम से प्रदान की जाने वाली सभी सुविधाएं</li>
            </ul>

            <h2>3. योग्यता (Eligibility)</h2>
            <h3>Users के लिए:</h3>
            <ul>
                <li>कम से कम 13 वर्ष की आयु (13-17 को parental consent चाहिए)</li>
                <li>सटीक registration जानकारी प्रदान करनी होगी</li>
                <li>कानून के तहत सेवा का उपयोग करने से प्रतिबंधित नहीं होना चाहिए</li>
            </ul>
            <h3>Listeners के लिए:</h3>
            <ul>
                <li>कम से-कम 18 वर्ष की आयु</li>
                <li>हमारी verification और training process पास करना होगा</li>
                <li>Platform guidelines के साथ good standing बनाए रखना होगा</li>
            </ul>

            <h2>4. Listener Guidelines और Compensation</h2>
            <h3>Listener की जिम्मेदारियां:</h3>
            <ul>
                <li>Professional और respectful communication बनाए रखें</li>
                <li>Call या chat को बीच में disconnect न करें बिना valid reason के</li>
                <li>User privacy और confidentiality को protect करें</li>
                <li>सभी platform guidelines और admin instructions follow करें</li>
                <li>Misbehavior, abusing, sexual content या offensive language पूरी तरह prohibited है</li>
            </ul>

            <h3>Performance और Earnings:</h3>
            <ul>
                <li>Compensation performance-based होगी</li>
                <li>Engagement जितना ज़्यादा, earning उतनी ज़्यादा</li>
                <li>Engagement कम → income decrease</li>
                <li>Quality interactions के लिए bonus incentives मिल सकते हैं</li>
                <li>Poor performance के लिए earning reduce हो सकती है</li>
            </ul>

            <h3>Payment Structure:</h3>
            <h4>Weekly Payment Schedule:</h4>
            <ul>
                <li><strong>Payment dates:</strong> हर महीने की <strong>10, 20, और 30 तारीख</strong></li>
                <li><strong>Transaction fee:</strong> हर payment से <strong>15 रुपए transaction fee</strong> काटा जाएगा</li>
                <li><strong>Payment method:</strong> Bank transfer या UPI के माध्यम से</li>
            </ul>
            <h4>Hold Account Policy:</h4>
            <ul>
                <li><strong>Hold account का payment:</strong> महीने की <strong>आखिरी तारीख (30) को</strong> दिया जाएगा</li>
                <li><strong>Penalty:</strong> <strong>40% penalty</strong> + <strong>15 रुपए transaction fee</strong> काटा जाएगा</li>
                <li><strong>Hold होने के कारण:</strong> Rule violation, user complaints, suspicious activity</li>
            </ul>

            <h3>Violations और Consequences:</h3>
            <ul>
                <li><strong>Minor violations:</strong> Warnings या temporary earning suspension</li>
                <li><strong>Personal details share करना:</strong> Immediate account suspension → Hold account</li>
                <li><strong>Serious violations:</strong> Permanent account termination</li>
                <li>सभी activities admin द्वारा monitor की जाती हैं</li>
            </ul>

            <h2>5. User Conduct</h2>
            <h3>Prohibited Activities:</h3>
            <ul>
                <li>Harassment, abuse, या inappropriate behavior</li>
                <li>Personal contact information share करना</li>
                <li>Sexual content या romantic advances</li>
                <li>Threats, violence, या harmful content</li>
                <li>Spam, scams, या fraudulent activities</li>
            </ul>

            <h2>6. Platform Services</h2>
            <h3>Service की सीमाएं:</h3>
            <ul>
                <li>हम professional mental health service नहीं हैं</li>
                <li>Listeners licensed therapists या counselors नहीं हैं</li>
                <li>Emergency situations के लिए professional intervention की आवश्यकता</li>
            </ul>

            <h2>7. Payment Terms विस्तार से</h2>
            <h3>Listeners के लिए Payment Rules:</h3>
            <h4>Regular Payment (सामान्य भुगतान):</h4>
            <ul>
                <li>Payment Schedule: 10th, 20th, 30th of every month</li>
                <li>Amount: Earned amount - 15 Rs transaction fee</li>
                <li>Minimum payout: 100 Rs</li>
                <li>Payment method: Bank transfer/UPI</li>
            </ul>
            <h4>Hold Account Payment:</h4>
            <ul>
                <li>Payment date: 30th of the month only</li>
                <li>Penalty: 40% of total earned amount</li>
                <li>Transaction fee: 15 Rs additional</li>
            </ul>

            <h2>8. Privacy और Data Protection</h2>
            <p>Personal information हमारी Privacy Policy के अनुसार protected है। Conversations को quality और safety के लिए monitor किया जा सकता है।</p>
            
            <h2>9. Account Termination</h2>
            <p>हम इन Terms का violation करने पर, suspicious activity के लिए, या legal/safety concerns के लिए accounts terminate कर सकते हैं।</p>

            <h2>10. Emergency Situations</h2>
            <p>Platform crisis intervention के लिए suitable नहीं है। Users को emergencies के लिए immediate professional help लेनी चाहिए।</p>
            
            <h2>11. Terms में बदलाव</h2>
            <p>हम इन Terms को update करने का अधिकार रखते हैं। Material changes की users को notification दी जाएगी।</p>

            <h2>12. Contact Information</h2>
            <p>Terms के बारे में questions के लिए: <a href="mailto:sakoonapp.help@gmail.com">sakoonapp.help@gmail.com</a></p>

            <h2>13. Important Reminders for Listeners</h2>
            <ul className="list-none p-0">
                <li><strong className="text-red-500">❌ बिल्कुल न करें:</strong> Calls/chats बीच में disconnect करना, User के साथ misbehavior, Personal contact details share करना, Abusive या sexual content, Rules ignore करना।</li>
                <li><strong className="text-green-500">✅ हमेशा करें:</strong> Respectful और professional behavior, Quality engagement maintain करें, Admin instructions follow करें, User satisfaction पर focus करें, Privacy maintain करें।</li>
                <li><strong className="text-yellow-500">💰 Payment याद रखें:</strong> Regular payment: 10, 20, 30 तारीख को (-15 Rs fee). Hold payment: 30 तारीख को (-40% penalty -15 Rs fee). Violation = Hold account = कम payment.</li>
            </ul>

            <hr/>
            <p className="italic">SakoonApp का उपयोग करके, आप acknowledge करते हैं कि आपने इन Terms and Conditions को पढ़ा, समझा है, और इनसे बाध्य होने के लिए सहमत हैं।</p>
            <blockquote>“Respect users, maintain engagement, follow rules, grow your income safely.”</blockquote>
        </PolicyPageLayout>
    );
};

export default TermsScreen;