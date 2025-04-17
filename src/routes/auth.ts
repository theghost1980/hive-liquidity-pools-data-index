import crypto from "crypto";
import { Request, Response, Router } from "express";
import * as hiveTx from "hive-tx";
import jwt from "jsonwebtoken";
import { admins } from "../config/admin";
import { generateChallenge } from "../utils/generateChallenge";

const authRouter = Router();

const pendingChallenges: Record<string, string> = {};

authRouter.post("/challenge", (req, res) => {
  const { username } = req.body;

  if (!admins.includes(username)) {
    return res.status(403).json({ error: "User is not an admin" });
  }

  const challenge = generateChallenge(username);
  pendingChallenges[username] = challenge;

  return res.json({ challenge });
});

authRouter.post("/verify", async (req: Request, res: Response) => {
  const { username, signature } = req.body;
  const challenge = pendingChallenges[username];

  if (!challenge) {
    return res.status(400).json({ error: "No challenge found" });
  }

  try {
    // Recuperar la firma desde string
    const sig = hiveTx.Signature.from(signature);

    const challengeHash = crypto
      .createHash("sha256")
      .update(challenge)
      .digest();
    const pubKey = sig.getPublicKey(challengeHash);

    // Validar si esa clave pública corresponde al usuario
    const accounts = await fetch(`https://api.hive.blog`, {
      method: "POST",
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "condenser_api.get_accounts",
        params: [[username]],
        id: 1,
      }),
      headers: { "Content-Type": "application/json" },
    }).then((res) => res.json());

    const userPostingKeys = accounts.result?.[0]?.posting?.key_auths?.map(
      ([key]: any[]) => key
    );

    if (!userPostingKeys?.includes(pubKey.toString())) {
      return res.status(401).json({ error: "Public key does not match user" });
    }

    // Autenticado correctamente
    delete pendingChallenges[username];

    const secret = process.env.secret;
    if (secret) {
      const token = jwt.sign({ username, role: "admin" }, secret, {
        expiresIn: "1h",
      });

      return res.json({ success: true, token });
    }
    return res.json({ hiveLPIndex_says: "Roses are red, violets violate!!!!" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", details: err });
  }
});

export default authRouter;
