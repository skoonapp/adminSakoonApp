import React, { useEffect, useState } from 'react';
// Fix: Import 'functions' to call the cloud function for approval.
import { db, auth, functions } from '../utils/firebase';
import type { ListenerProfile } from '../types';

const AdminDashboard: React.FC = () => {
  const [pendingListeners, setPendingListeners] = useState<ListenerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        setLoading(true);
        const snapshot = await db.collection("listeners")
          .where("status", "==", "pending")
          .get();
        
        const listenersData = snapshot.docs.map(doc => ({
          ...(doc.data() as ListenerProfile),
          uid: doc.id,
        }));
        setPendingListeners(listenersData);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch pending listeners:", err);
        setError("Could not load pending listeners.");
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, []);

  const approveListener = async (listenerId: string) => {
    if (!window.confirm(`Are you sure you want to approve this listener? This will assign a new profile image.`)) {
      return;
    }
    setUpdatingId(listenerId);
    try {
      // This implementation is based on the user's provided code snippet.
      // It assumes a Firebase Function named 'assignListenerImage' is deployed.
      // This function should handle updating the listener's status to 'active'
      // and assigning a new image URL to their profile.
      const assignListenerImage = functions.httpsCallable('assignListenerImage');
      
      // The user's code snippet used 'pendingId', so we use that as the key.
      const result = await assignListenerImage({ pendingId: listenerId });

      const imageUrl = (result.data as any)?.imageUrl;
      
      // Remove the approved listener from the local state to update the UI.
      setPendingListeners(prev => prev.filter(l => l.uid !== listenerId));
      alert(`Listener approved! Image assigned: ${imageUrl || '(No URL returned)'}`);

    } catch (err) {
        console.error("Failed to approve listener via cloud function:", err);
        alert("An error occurred while approving. Please ensure the 'assignListenerImage' function is deployed correctly and check the function logs.");
    } finally {
        setUpdatingId(null);
    }
  };

  const rejectListener = async (listenerId: string) => {
    if (!window.confirm(`Are you sure you want to REJECT listener ${listenerId}? This is a permanent action.`)) {
      return;
    }
    setUpdatingId(listenerId);
    try {
        // Change status from 'pending' to 'rejected'
        await db.collection("listeners").doc(listenerId).update({
            status: 'rejected'
        });

        setPendingListeners(prev => prev.filter(l => l.uid !== listenerId));
        alert("Listener rejected successfully.");
    } catch (err) {
        console.error("Failed to reject listener:", err);
        alert("An error occurred while rejecting the listener.");
    } finally {
        setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-cyan-400">Admin Dashboard</h1>
                <p className="text-slate-400 mt-1">Review and approve new listener applications.</p>
            </div>
            <button onClick={() => auth.signOut()} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors">Logout</button>
        </header>

        {loading && <p>Loading pending applications...</p>}
        {error && <p className="text-red-400">{error}</p>}
        
        {!loading && pendingListeners.length === 0 && (
          <div className="text-center p-8 bg-slate-800 rounded-lg">
            <h3 className="text-xl font-semibold">All Clear!</h3>
            <p className="text-slate-400 mt-2">There are no pending listener applications at the moment.</p>
          </div>
        )}

        {!loading && pendingListeners.length > 0 && (
          <div className="space-y-4">
            {pendingListeners.map(listener => (
              <div key={listener.uid} className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img src={listener.avatarUrl} alt={listener.displayName} className="w-16 h-16 rounded-full object-cover" />
                  <div>
                    <h2 className="text-lg font-bold">{listener.displayName}</h2>
                    <p className="text-sm text-slate-400">UID: {listener.uid}</p>
                    <p className="text-sm text-slate-400">City: {listener.city}, Age: {listener.age}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  <button 
                    onClick={() => approveListener(listener.uid)}
                    disabled={updatingId === listener.uid}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-600 disabled:cursor-wait"
                  >
                    {updatingId === listener.uid ? 'Approving...' : 'Approve'}
                  </button>
                  <button 
                    onClick={() => rejectListener(listener.uid)}
                    disabled={updatingId === listener.uid}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-600 disabled:cursor-wait"
                  >
                     {updatingId === listener.uid ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;