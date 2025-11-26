import express from "express";
import {
  githubAuth,
  githubCallback,
  facebookAuth,
  facebookCallback,
} from "../controllers/oauth.controller.js";

const router = express.Router();

// GitHub OAuth
router.get("/authorization/github", githubAuth);
router.get("/callback/github", githubCallback);

// Facebook OAuth
router.get("/authorization/facebook", facebookAuth);
router.get("/callback/facebook", facebookCallback);

export default router;
