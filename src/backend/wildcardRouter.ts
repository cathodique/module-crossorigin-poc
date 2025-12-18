import express from "express";
import { stat } from "fs/promises";
import { join, normalize } from "path/posix";
import rootDirname from "../rootDirname.js";

const wildcardRouter = express.Router();

wildcardRouter.get("/", (req, res) => res.redirect(308, '/index.html'));

wildcardRouter.get<{ everything: string[] }>('/.common/*everything', (req, res) => {
  // Redirect to root so we can take advantage of caching mechanisms
  const justTheSubdomainPart = `${req.subdomains.toReversed().join('.')}.`;
  const justTheActualDomain = req.host.replace(justTheSubdomainPart, '');

  const associatedUrlAtActualDomain = `${req.protocol}://${justTheActualDomain}/.common/${req.params.everything.join('/')}`;

  res.redirect(308, associatedUrlAtActualDomain);
});

wildcardRouter.get("/*everything", async (req, res) => {
  const subdomainRevdns = req.subdomains.join('.');

  const normalizedPathElements = normalize(req.path).split('/');

  if (normalizedPathElements.includes('.') || normalizedPathElements.includes('..')) {
    return res.status(403).send('Path-like traversal is not allowed');
  }

  const resultingFile = join(rootDirname, 'assets', subdomainRevdns, normalizedPathElements.join('/'));

  if (req.get('service-worker') === 'script') {
    return res.status(403).send('Service workers are not allowed in this origin');
  }

  if (!(await stat(resultingFile).catch(() => ({ isFile: false })).then((v) => v.isFile))) {
    return res.status(404).send('File not found');
  }

  res.sendFile(resultingFile);
});

export default wildcardRouter;
