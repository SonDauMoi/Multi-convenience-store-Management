import jwt from "jsonwebtoken";
import passport from "../config/passport.js";

// Generate JWT tokens
const generateTokens = (user) => {
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  return { token, refreshToken };
};

// Generic OAuth callback handler
const handleOAuthCallback = (strategyName) => (req, res, next) => {
  console.log(`🔍 ${strategyName} callback received`);
  console.log(`Request URL: ${req.url}`);
  console.log(`Request Query:`, req.query);

  passport.authenticate(strategyName, { session: false }, (err, user, info) => {
    try {
      if (err) {
        console.error(`${strategyName} OAuth error:`, err);
        const errorMessage = encodeURIComponent(
          err.message || "Authentication failed"
        );
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=${errorMessage}`
        );
      }

      if (!user) {
        console.error(`No user returned from ${strategyName} OAuth`);
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=Authentication%20failed`
        );
      }

      console.log(`✅ ${strategyName} user authenticated:`, user.username);

      // Generate JWT tokens
      const { token, refreshToken } = generateTokens(user);

      // Redirect to frontend with tokens
      const redirectUrl = `${process.env.FRONTEND_URL}/oauth2/callback?accessToken=${token}&refreshToken=${refreshToken}`;

      console.log(`🔄 Redirecting to: ${redirectUrl.substring(0, 100)}...`);

      res.redirect(redirectUrl);
    } catch (error) {
      console.error(`${strategyName} callback error:`, error);
      res.redirect(
        `${process.env.FRONTEND_URL}/login?error=Something%20went%20wrong`
      );
    }
  })(req, res, next);
};

// GitHub OAuth
export const githubAuth = passport.authenticate("github", {
  session: false,
  scope: ["user:email"],
});

export const githubCallback = handleOAuthCallback("github");

// Facebook OAuth
export const facebookAuth = passport.authenticate("facebook", {
  session: false,
  scope: ["email"],
});

export const facebookCallback = handleOAuthCallback("facebook");
