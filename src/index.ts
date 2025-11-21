import express from "express";
import expressSubdomain from "@immjs/express-subdomain";

import wildcardRouter from "./backend/wildcardRouter.js";
import rootRouter from "./backend/rootRouter.js";

const app = express();

app.use(expressSubdomain('@', rootRouter));
app.use(expressSubdomain('*', wildcardRouter));

app.listen(8080, "0.0.0.0", () => console.log("Ready"));
