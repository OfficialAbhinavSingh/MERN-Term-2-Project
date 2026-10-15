import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import customerRoutes from "./routes/customer.routes.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  }
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(cookieParser());

app.use("/customers", customerRoutes);

app.get("/", (req, res) => {
  res.json({ message: "ShopKart API is running" });
});

const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  const port = process.env.PORT || 8081;
  const dbUrl = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shopkart";

  connectDB(dbUrl)
    .then(() => console.log("DB Connected Successfully"))
    .catch((err) => console.error("DB Connection Error:", err.message || err));

  app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
  });
}

export default app;
