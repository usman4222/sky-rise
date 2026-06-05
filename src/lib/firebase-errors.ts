export function getFirebaseErrorMessage(error: any): string {
  if (!error || !error.code) {
    // If it's a backend sync error (not from Firebase directly) or generic error
    return error?.message || "An unexpected error occurred.";
  }
  
  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password is too weak. Must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    default:
      // Remove the "Firebase:" prefix if it exists in the message
      const msg = error.message || 'Authentication failed. Please try again.';
      return msg.replace(/^Firebase:\s*/, '');
  }
}
