const { json, readBody, requireAdmin, env, supabaseFetch, handleError } = require("./_utils");

const safeName = (name) => name.replace(/[^a-z0-9._-]/gi, "-").toLowerCase();

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
    requireAdmin(req);
    const upload = await readBody(req);
    if (!upload.name || !upload.data) return json(res, 400, { error: "Missing upload name or data" });
    const config = env();
    const ext = upload.name.includes(".") ? upload.name.slice(upload.name.lastIndexOf(".")) : "";
    const filename = `${Date.now()}-${safeName(upload.name.replace(ext, ""))}${ext}`;
    const buffer = Buffer.from(upload.data.replace(/^data:.*;base64,/, ""), "base64");

    const storageResponse = await fetch(`${config.supabaseUrl}/storage/v1/object/prime-uploads/${filename}`, {
      method: "POST",
      headers: {
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`,
        "Content-Type": upload.type || "application/octet-stream",
        "x-upsert": "true",
      },
      body: buffer,
    });
    if (!storageResponse.ok) throw new Error(`Upload failed: ${storageResponse.status}`);

    const record = {
      id: `UP-${Date.now()}`,
      name: upload.name,
      type: upload.type || "",
      url: `${config.supabaseUrl}/storage/v1/object/public/prime-uploads/${filename}`,
      created_at: new Date().toISOString(),
    };
    const rows = await supabaseFetch("/rest/v1/uploads", { method: "POST", body: JSON.stringify([record]) });
    json(res, 201, { ...rows[0], createdAt: rows[0].created_at });
  } catch (error) {
    handleError(res, error);
  }
};
