import express from "express";
import { PORT } from "./config.js";
import { mockSysacadRouter } from "./mock-sysacad/router.js";
import { alumnosRouter } from "./api/alumnosRouter.js";

const app = express();

app.use("/mock-sysacad", mockSysacadRouter);
app.use("/api", alumnosRouter);

app.listen(PORT, () => {
  console.log(`SimUTN escuchando en http://localhost:${PORT}`);
});
