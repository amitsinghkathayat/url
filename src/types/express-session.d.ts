import 'express-session';

declare module 'express-session' {
  export interface Session {
    clearSession(): Promise<void>;

    // NOTES: Add your app's custom session properties here:
    authenticatedUser: {
      userId: string;
      username: string;
      isPro: boolean;
      isAdmin: boolean;
    };
    isLoggedIn: boolean;
  }
}
