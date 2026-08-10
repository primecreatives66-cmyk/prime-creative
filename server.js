const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const dataDir = path.join(root, "data");
const uploadDir = path.join(root, "uploads");
const dataFile = path.join(dataDir, "cms-data.json");
const port = Number(process.env.PORT || 5174);
const adminPassword = process.env.ADMIN_PASSWORD || "";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".pps": "application/vnd.ms-powerpoint",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

const ensureFiles = () => {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(uploadDir, { recursive: true });
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({ settings: {}, services: [], courses: [], uploads: [], bookings: [] }, null, 2));
  }
};

const readCms = () => {
  ensureFiles();
  return JSON.parse(fs.readFileSync(dataFile, "utf8"));
};

const writeCms = (cms) => {
  ensureFiles();
  fs.writeFileSync(dataFile, JSON.stringify(cms, null, 2));
};

const send = (res, status, payload, type = "application/json; charset=utf-8") => {
  res.writeHead(status, { "Content-Type": type, "Access-Control-Allow-Origin": "*" });
  res.end(type.includes("json") ? JSON.stringify(payload) : payload);
};

const readBody = (req) => new Promise((resolve, reject) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > 25_000_000) {
      reject(new Error("Request too large"));
      req.destroy();
    }
  });
  req.on("end", () => {
    try {
      resolve(body ? JSON.parse(body) : {});
    } catch {
      reject(new Error("Invalid JSON"));
    }
  });
});

const safeName = (name) => name.replace(/[^a-z0-9._-]/gi, "-").toLowerCase();
const requireAdmin = (req) => {
  if (!adminPassword) return;
  if (req.headers["x-admin-password"] !== adminPassword) {
    const error = new Error("Admin password required");
    error.status = 401;
    throw error;
  }
};

const handleApi = async (req, res, url) => {
  if (req.method === "OPTIONS") return send(res, 200, {});
  const cms = readCms();

  if (req.method === "GET" && url.pathname === "/api/cms") return send(res, 200, cms);
  if (req.method === "GET" && url.pathname === "/api/bookings") return send(res, 200, cms.bookings || []);

  if (req.method === "POST" && url.pathname === "/api/bookings") {
    const booking = await readBody(req);
    const record = { id: `PC-${Date.now()}`, createdAt: new Date().toISOString(), status: "New", ...booking };
    cms.bookings = [record, ...(cms.bookings || [])].slice(0, 500);
    writeCms(cms);
    return send(res, 201, record);
  }

  if (req.method === "PUT" && url.pathname === "/api/settings") {
    requireAdmin(req);
    cms.settings = { ...(cms.settings || {}), ...(await readBody(req)) };
    writeCms(cms);
    return send(res, 200, cms.settings);
  }

  if (req.method === "PUT" && url.pathname === "/api/services") {
    requireAdmin(req);
    cms.services = await readBody(req);
    writeCms(cms);
    return send(res, 200, cms.services);
  }

  if (req.method === "PUT" && url.pathname === "/api/courses") {
    requireAdmin(req);
    cms.courses = await readBody(req);
    writeCms(cms);
    return send(res, 200, cms.courses);
  }

  if (req.method === "POST" && url.pathname === "/api/uploads") {
    requireAdmin(req);
    const upload = await readBody(req);
    if (!upload.name || !upload.data) return send(res, 400, { error: "Missing upload name or data" });
    const ext = path.extname(upload.name) || ".bin";
    const filename = `${Date.now()}-${safeName(path.basename(upload.name, ext))}${ext}`;
    const buffer = Buffer.from(upload.data.replace(/^data:.*;base64,/, ""), "base64");
    fs.writeFileSync(path.join(uploadDir, filename), buffer);
    const record = { id: `UP-${Date.now()}`, name: upload.name, url: `/uploads/${filename}`, type: upload.type || "", createdAt: new Date().toISOString() };
    cms.uploads = [record, ...(cms.uploads || [])];
    writeCms(cms);
    return send(res, 201, record);
  }

  return send(res, 404, { error: "API route not found" });
};

const serveStatic = (req, res, url) => {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  if (pathname.endsWith("/")) pathname += "index.html";
  const filePath = path.normalize(path.join(root, pathname));
  if (!filePath.startsWith(root)) return send(res, 403, "Forbidden", "text/plain; charset=utf-8");
  fs.readFile(filePath, (error, data) => {
    if (error) return send(res, 404, "Not found", "text/plain; charset=utf-8");
    res.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);
    return serveStatic(req, res, url);
  } catch (error) {
    return send(res, 500, { error: error.message || "Server error" });
  }
});

server.listen(port, () => {
  console.log(`Prime Creative backend running at http://127.0.0.1:${port}`);
});
