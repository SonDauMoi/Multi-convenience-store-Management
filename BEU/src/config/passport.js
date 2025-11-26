import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { User } from "../models/index.js";

// Validate environment variables for GitHub
const requiredGitHubVars = [
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GITHUB_CALLBACK_URL",
];

// Validate environment variables for Facebook
const requiredFacebookVars = [
  "FACEBOOK_APP_ID",
  "FACEBOOK_APP_SECRET",
  "FACEBOOK_CALLBACK_URL",
];

// Check GitHub OAuth config
const hasGitHubConfig = requiredGitHubVars.every(
  (envVar) => process.env[envVar]
);
if (!hasGitHubConfig) {
  console.warn(
    "⚠️  GitHub OAuth not configured. Missing:",
    requiredGitHubVars.filter((v) => !process.env[v])
  );
}

// Check Facebook OAuth config
const hasFacebookConfig = requiredFacebookVars.every(
  (envVar) => process.env[envVar]
);
if (!hasFacebookConfig) {
  console.warn(
    "⚠️  Facebook OAuth not configured. Missing:",
    requiredFacebookVars.filter((v) => !process.env[v])
  );
}

// Configure GitHub OAuth Strategy
if (hasGitHubConfig) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL,
        scope: ["user:email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const githubId = profile.id;
          const name = profile.displayName || profile.username;
          const avatar = profile.photos?.[0]?.value;

          if (!githubId) {
            return done(new Error("GitHub ID not found in profile"), null);
          }

          // Check if user already exists with this GitHub ID
          let user = await User.findOne({ where: { githubId } });

          if (user) {
            // User exists, update info if needed
            if (user.avatar !== avatar) {
              user.avatar = avatar;
              await user.save();
            }
            return done(null, user);
          }

          // Check if user exists with same email but different provider
          if (email) {
            user = await User.findOne({ where: { email } });
            if (user && user.provider === "local") {
              return done(
                new Error(
                  "Email already registered with local account. Please login with username and password."
                ),
                null
              );
            }
          }

          // Create new user
          user = await User.create({
            username: profile.username || "github_" + githubId.slice(-6),
            email: email || `github_${githubId}@placeholder.com`,
            name,
            avatar,
            provider: "github",
            githubId,
            role: "user",
            password: null,
          });

          return done(null, user);
        } catch (error) {
          console.error("GitHub OAuth error:", error);
          return done(error, null);
        }
      }
    )
  );
  console.log("✅ GitHub OAuth strategy configured");
}

// Configure Facebook OAuth Strategy
if (hasFacebookConfig) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL,
        profileFields: ["id", "displayName", "emails", "photos"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const facebookId = profile.id;
          const name = profile.displayName;
          const avatar = profile.photos?.[0]?.value;

          if (!facebookId) {
            return done(new Error("Facebook ID not found in profile"), null);
          }

          // Check if user already exists with this Facebook ID
          let user = await User.findOne({ where: { facebookId } });

          if (user) {
            // User exists, update info if needed
            if (user.avatar !== avatar) {
              user.avatar = avatar;
              await user.save();
            }
            return done(null, user);
          }

          // Check if user exists with same email but different provider
          if (email) {
            user = await User.findOne({ where: { email } });
            if (user && user.provider === "local") {
              return done(
                new Error(
                  "Email already registered with local account. Please login with username and password."
                ),
                null
              );
            }
          }

          // Create new user
          user = await User.create({
            username: `facebook_${facebookId.slice(-6)}`,
            email: email || `facebook_${facebookId}@placeholder.com`,
            name,
            avatar,
            provider: "facebook",
            facebookId,
            role: "user",
            password: null,
          });

          return done(null, user);
        } catch (error) {
          console.error("Facebook OAuth error:", error);
          return done(error, null);
        }
      }
    )
  );
  console.log("✅ Facebook OAuth strategy configured");
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
