export function getFirebaseErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred.";

  const errorMessage = error.message || "";
  if (errorMessage.includes("auth/user-token-expired") || error.code === "auth/user-token-expired") {
    return "Your session has expired. Please log in again.";
  }

  if (!error.code) {
    // If it's a backend sync error (not from Firebase directly) or generic error
    return errorMessage || "An unexpected error occurred.";
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
      return errorMessage.replace(/^Firebase:\s*/, '');
  }
}
