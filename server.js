const http = require("http");
const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data.json");

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // GET /items — return all items
  if (req.method === "GET" && req.url === "/items") {
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(data);
    return;
  }

  // POST /items — add a new item
  if (req.method === "POST" && req.url === "/items") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const items = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      const newItem = JSON.parse(body);
      newItem.id = Date.now();
      newItem.createdAt = new Date().toISOString().split("T")[0];
      items.push(newItem);
      fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2));
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify(newItem));
    });
    return;
  }

  // PUT /items/:id — edit an item
  if (req.method === "PUT" && req.url.startsWith("/items/")) {
    const id = Number(req.url.split("/")[2]);
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      let items = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      const updated = JSON.parse(body);
      items = items.map((item) => (item.id === id ? { ...item, ...updated } : item));
      fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true }));
    });
    return;
  }

  // DELETE /items/:id — delete an item
  if (req.method === "DELETE" && req.url.startsWith("/items/")) {
    const id = Number(req.url.split("/")[2]);
    let items = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    items = items.filter((item) => item.id !== id);
    fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2));
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // Serve static files
  let filePath = path.join(__dirname, req.url === "/" ? "index.html" : req.url);
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200);
    res.end(content);
  });
});

server.listen(3000, () => {
  console.log("InventoryManagement running at http://localhost:3000");
});
