import "dotenv/config";
import "reflect-metadata";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./user.resolvers";
import { AppDataSource } from "./data-source";
import cookieParser from "cookie-parser";
import { verify } from "jsonwebtoken";
import { User } from "./entity/User";
import { createAccessToken, createRefreshToken } from "./auth";
import { sendRefreshToken } from "./sendRefreshToken";

(async () => {
  const app = express();
  app.use(cookieParser());
  app.get("/", (_req, res) => {
    res.send("hello world");
  });

  // refresh a token
  app.post("/refresh-token", async (req, res) => {
    const token = req.cookies.jid;
    if (!token) {
      return res.send({ ok: false, accessToken: "" });
    }

    let payload: any = null;
    try {
      payload = verify(token, process.env.REFRESH_TOKEN_SECRET!);
    } catch (err) {
      console.log(err);
      return res.send({ ok: false, accessToken: "" });
    }

    // token is valid and
    // we can send back an access token
    const user = await User.findOne({where: { id: payload.userId }});
    console.log(user)
    if (!user) {
      return res.send({ ok: false, accessToken: "" });
    }

    // refresh the refresh token
    if (user.tokenVersion !== payload.tokenVersion) {
      return res.send({ ok: false, accessToken: "" });
    }

    sendRefreshToken(res, createRefreshToken(user));

    // refresh the access token 
    return res.send({ ok: true, accessToken: createAccessToken(user) });
  });

  // database connection
  await AppDataSource.initialize();

  // apollo server instance
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver],
    }),
    // in graphql resolver we access both req and res
    context: ({ req, res }) => ({ req, res }),
  });
  // start the apollo server
  await apolloServer.start();

  apolloServer.applyMiddleware({ app });
  app.listen(4000, () => {
    console.log("express server");
  });
})();
