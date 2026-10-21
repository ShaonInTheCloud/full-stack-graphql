const http = require("node:http");
const express = require("express"),
  cors = require("cors"),
  mongoose = require("mongoose");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@as-integrations/express5");
const {
  ApolloServerPluginDrainHttpServer,
} = require("@apollo/server/plugin/drainHttpServer");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/use/ws");
const createContext = require("./context");
async function start() {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET)
    throw new Error("Set MONGODB_URI and JWT_SECRET before starting");
  if (
    process.env.NODE_ENV === "test" &&
    !/^mongodb:\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(process.env.MONGODB_URI)
  )
    throw new Error("Test mode only accepts an isolated loopback database");
  await mongoose.connect(process.env.MONGODB_URI);
  const app = express(),
    httpServer = http.createServer(app);
  const schema = makeExecutableSchema({
    typeDefs: require("./schema"),
    resolvers: require("./resolvers"),
  });
  const ws = new WebSocketServer({ server: httpServer, path: "/graphql" });
  const cleanup = useServer(
    {
      schema,
      context: async (ctx) =>
        createContext(ctx.connectionParams?.authorization),
    },
    ws,
  );
  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await cleanup.dispose();
            },
          };
        },
      },
    ],
  });
  await server.start();
  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use(
    "/",
    cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => createContext(req.headers.authorization),
    }),
  );
  await new Promise((resolve) =>
    httpServer.listen(Number(process.env.PORT) || 4000, "127.0.0.1", resolve),
  );
  console.log("Library GraphQL server ready");
  const stop = async () => {
    await server.stop();
    await mongoose.disconnect();
    process.exit(0);
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}
start().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
