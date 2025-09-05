import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useListener } from '../context/ListenerContext';
import { db, storage, serverTimestamp } from '../utils/firebase';
import firebase from 'firebase/compat/app';
import type { CommunityPost, PostComment, ListenerProfile } from '../types';

// --- Helper Functions & Hooks ---
const timeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m ago`;
    return `just now`;
};

const useLike = (postId: string, currentUserId: string) => {
    const [liked, setLiked] = useState(false);
    const [localLikeCount, setLocalLikeCount] = useState(0);

    useEffect(() => {
        const likeRef = db.collection('communityPosts').doc(postId).collection('likes').doc(currentUserId);
        const unsubscribe = likeRef.onSnapshot(doc => {
            setLiked(doc.exists);
        });
        return unsubscribe;
    }, [postId, currentUserId]);

    const toggleLike = useCallback(async () => {
        const postRef = db.collection('communityPosts').doc(postId);
        const likeRef = postRef.collection('likes').doc(currentUserId);

        setLiked(prev => !prev);
        setLocalLikeCount(prev => liked ? prev -1 : prev + 1);

        await db.runTransaction(async (transaction) => {
            const postDoc = await transaction.get(postRef);
            if (!postDoc.exists) throw "Post does not exist!";

            const currentLikeCount = postDoc.data()?.likeCount || 0;
            const likeDoc = await transaction.get(likeRef);

            if (likeDoc.exists) {
                transaction.delete(likeRef);
                transaction.update(postRef, { likeCount: Math.max(0, currentLikeCount - 1) });
            } else {
                transaction.set(likeRef, { likedAt: serverTimestamp() });
                transaction.update(postRef, { likeCount: currentLikeCount + 1 });
            }
        }).catch(err => {
            console.error("Like transaction failed: ", err);
            // Revert optimistic update
            setLiked(prev => !prev);
            setLocalLikeCount(prev => liked ? prev + 1 : prev - 1);
        });
    }, [postId, currentUserId, liked]);
    
    return { liked, toggleLike, localLikeCount, setLocalLikeCount };
};


// --- UI Components ---
const HeartIcon: React.FC<{ solid?: boolean }> = ({ solid }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform duration-200 ${solid ? 'text-red-500 scale-110' : ''}`} viewBox="0 0 20 20" fill={solid ? "currentColor" : "none"} stroke="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
);
const CommentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const Avatar: React.FC<{ src: string | null, name: string }> = ({ src, name }) => {
    if (src) return <img src={src} alt={name} className="w-10 h-10 rounded-full object-cover" />;
    return (
        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-500 dark:text-primary-400 font-bold">
            {name.charAt(0).toUpperCase()}
        </div>
    );
};

const PostCard: React.FC<{ post: CommunityPost; onCommentClick: () => void; currentUserId: string }> = ({ post, onCommentClick, currentUserId }) => {
    const { liked, toggleLike, localLikeCount, setLocalLikeCount } = useLike(post.id, currentUserId);
    
    useEffect(() => {
        setLocalLikeCount(post.likeCount);
    }, [post.likeCount, setLocalLikeCount]);
    
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4">
                <div className="flex items-center gap-3">
                    <Avatar src={post.authorPhotoURL} name={post.authorName} />
                    <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{post.authorName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{timeSince(post.timestamp.toDate())}</p>
                    </div>
                </div>
                <p className="my-4 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{post.text}</p>
            </div>
            {post.imageUrl && (
                <img src={post.imageUrl} alt="Post content" className="w-full h-auto max-h-[50vh] object-cover" />
            )}
            <div className="p-2 flex justify-around border-t border-slate-200 dark:border-slate-700">
                <button onClick={toggleLike} className="flex items-center gap-2 py-2 px-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                    <HeartIcon solid={liked} /> <span>{localLikeCount}</span>
                </button>
                <button onClick={onCommentClick} className="flex items-center gap-2 py-2 px-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                    <CommentIcon /> <span>{post.commentCount}</span>
                </button>
            </div>
        </div>
    );
};

const CreatePostModal: React.FC<{ isOpen: boolean; onClose: () => void; profile: ListenerProfile }> = ({ isOpen, onClose, profile }) => {
    const [text, setText] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isPosting, setIsPosting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handlePost = async () => {
        if (!text.trim() && !imageFile) return;
        setIsPosting(true);
        try {
            const postRef = db.collection('communityPosts').doc();
            let imageUrl: string | undefined = undefined;

            if (imageFile) {
                const storageRef = storage.ref(`community_posts/${postRef.id}/${imageFile.name}`);
                const uploadTask = await storageRef.put(imageFile);
                imageUrl = await uploadTask.ref.getDownloadURL();
            }

            const newPost: Omit<CommunityPost, 'id'> = {
                authorId: profile.uid,
                authorName: profile.displayName,
                authorPhotoURL: profile.photoURL,
                text: text,
                imageUrl,
                timestamp: serverTimestamp() as firebase.firestore.Timestamp,
                likeCount: 0,
                commentCount: 0,
            };

            await postRef.set(newPost);
            handleClose();
        } catch (error) {
            console.error("Error creating post: ", error);
        } finally {
            setIsPosting(false);
        }
    };
    
    const handleClose = () => {
        setText('');
        setImageFile(null);
        setImagePreview(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" aria-modal="true">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
                <header className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Create Post</h2>
                    <button onClick={handleClose}><CloseIcon /></button>
                </header>
                <div className="p-4 flex-grow overflow-y-auto">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={`What's on your mind, ${profile.displayName}?`}
                        className="w-full h-32 bg-slate-100 dark:bg-slate-700 border-none rounded-lg p-3 focus:ring-2 focus:ring-primary-500"
                    />
                    {imagePreview && (
                        <div className="mt-4 relative">
                            <img src={imagePreview} alt="Preview" className="w-full rounded-lg max-h-60 object-contain" />
                            <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"><CloseIcon /></button>
                        </div>
                    )}
                </div>
                <footer className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-500 hover:text-primary-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <ImageIcon />
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" hidden />
                    </button>
                    <button onClick={handlePost} disabled={isPosting || (!text.trim() && !imageFile)} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-primary-400 disabled:cursor-not-allowed">
                        {isPosting ? 'Posting...' : 'Post'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

const CommentSheet: React.FC<{ post: CommunityPost | null; isOpen: boolean; onClose: () => void; profile: ListenerProfile | null }> = ({ post, isOpen, onClose, profile }) => {
    const [comments, setComments] = useState<PostComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    
    useEffect(() => {
        if (!post) return;
        setLoadingComments(true);
        const unsubscribe = db.collection('communityPosts').doc(post.id).collection('comments')
            .orderBy('timestamp', 'asc')
            .onSnapshot(snapshot => {
                const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostComment));
                setComments(commentsData);
                setLoadingComments(false);
            });
        return () => unsubscribe();
    }, [post]);
    
    const handlePostComment = async () => {
        if (!newComment.trim() || !post || !profile) return;
        setIsPosting(true);

        const postRef = db.collection('communityPosts').doc(post.id);
        const commentRef = postRef.collection('comments').doc();

        const commentData: Omit<PostComment, 'id'> = {
            authorId: profile.uid,
            authorName: profile.displayName,
            authorPhotoURL: profile.photoURL,
            text: newComment,
            timestamp: serverTimestamp() as firebase.firestore.Timestamp,
        };

        try {
            await db.runTransaction(async transaction => {
                const postDoc = await transaction.get(postRef);
                const newCommentCount = (postDoc.data()?.commentCount || 0) + 1;
                transaction.set(commentRef, commentData);
                transaction.update(postRef, { commentCount: newCommentCount });
            });
            setNewComment('');
        } catch (error) {
            console.error("Error posting comment: ", error);
        } finally {
            setIsPosting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end" aria-modal="true">
            <div onClick={onClose} className="flex-grow"></div>
            <div className="bg-white dark:bg-slate-800 rounded-t-2xl w-full max-w-2xl mx-auto shadow-xl flex flex-col h-[75vh]">
                <header className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Comments</h2>
                    <button onClick={onClose}><CloseIcon /></button>
                </header>
                <div className="flex-grow p-4 overflow-y-auto">
                    {loadingComments ? <p>Loading comments...</p> : comments.length === 0 ? <p className="text-center text-slate-500 mt-8">No comments yet. Be the first!</p> :
                        comments.map(comment => (
                            <div key={comment.id} className="flex items-start gap-3 mb-4">
                                <Avatar src={comment.authorPhotoURL} name={comment.authorName} />
                                <div className="bg-slate-100 dark:bg-slate-700 rounded-xl p-3 flex-grow">
                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{comment.authorName}</p>
                                    <p className="text-slate-700 dark:text-slate-300">{comment.text}</p>
                                </div>
                            </div>
                        ))
                    }
                </div>
                <footer className="p-2 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-grow bg-slate-100 dark:bg-slate-700 border-none rounded-lg p-3"
                        />
                        <button onClick={handlePostComment} disabled={isPosting || !newComment.trim()} className="bg-primary-600 text-white rounded-lg px-4 disabled:bg-primary-400">
                            <SendIcon />
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
}

// --- Main Screen ---
const CommunityScreen: React.FC = () => {
    const { profile } = useListener();
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [commentingPost, setCommentingPost] = useState<CommunityPost | null>(null);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = db.collection('communityPosts')
            .orderBy('timestamp', 'desc')
            .onSnapshot(snapshot => {
                const postsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                })) as CommunityPost[];
                setPosts(postsData);
                setLoading(false);
            }, error => {
                console.error("Error fetching posts: ", error);
                setLoading(false);
            });
        return () => unsubscribe();
    }, []);

    if (!profile) {
        return <div className="p-4 text-center">Loading profile...</div>;
    }

    return (
        <div className="relative min-h-full">
            <header className="p-4">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Community Feed</h1>
                <p className="text-slate-500 dark:text-slate-400">Connect with fellow listeners.</p>
            </header>

            <div className="p-4 space-y-4">
                {loading ? (
                     <p className="text-center text-slate-500">Loading posts...</p>
                ) : posts.length > 0 ? (
                    posts.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                            onCommentClick={() => setCommentingPost(post)}
                            currentUserId={profile.uid}
                        />
                    ))
                ) : (
                    <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl">
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">It's quiet here...</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Be the first to share something with the community!</p>
                    </div>
                )}
            </div>

            <button
                onClick={() => setShowCreateModal(true)}
                className="fixed bottom-20 right-4 bg-primary-600 hover:bg-primary-700 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-40"
                aria-label="Create new post"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
            </button>
            
            <CreatePostModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} profile={profile} />
            <CommentSheet post={commentingPost} isOpen={!!commentingPost} onClose={() => setCommentingPost(null)} profile={profile} />
        </div>
    );
};

export default CommunityScreen;
