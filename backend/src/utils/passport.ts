import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { upsertUser } from "./userStore";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      callbackURL: `${process.env.SERVER_ORIGIN ?? "http://localhost:3001"}/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const user = {
          id: profile.id,
          email: profile.emails?.[0]?.value ?? "",
          display_name: profile.displayName ?? null,
          avatar_url: profile.photos?.[0]?.value ?? null,
        };
        await upsertUser(user);
        done(null, user);
      } catch (err) {
        done(err as Error);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, (user as { id: string }).id);
});

passport.deserializeUser((id: string, done) => {
  // We store the full user in the session, just pass id back
  done(null, { id });
});

export default passport;
