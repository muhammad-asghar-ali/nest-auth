import "dotenv/config"
import "reflect-metadata";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./user.resolvers";
import { AppDataSource } from "./data-source";

(async () => {
  const app = express();
  app.get("/", (_req, res) => {
    res.send("hello world");
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
