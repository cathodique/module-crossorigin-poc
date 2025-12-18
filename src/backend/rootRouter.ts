import { Router } from "express";
import express from "express";
import { join } from "node:path/posix";
import rootDirname from "../rootDirname.js";

const rootRouter = Router();

rootRouter.use("/.common", express.static(
  join(rootDirname, "assets/@/.common"),
  {
    setHeaders (res, path, stat) {
      res.set("Access-Control-Allow-Origin", "*")
    },
  },
));
rootRouter.use(express.static(join(rootDirname, "assets/@/")));

export default rootRouter;
