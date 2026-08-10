const { json, readBody, supabaseFetch, handleError } = require("./_utils");

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      const rows = await supabaseFetch("/rest/v1/bookings?select=*&order=created_at.desc&limit=200");
      return json(res, 200, rows.map((item) => ({ ...item, createdAt: item.created_at })));
    }
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
    const body = await readBody(req);
    const record = {
      id: `PC-${Date.now()}`,
      status: "New",
      service: body.service || "",
      package: body.package || "",
      name: body.name || "",
      company: body.company || "",
      email: body.email || "",
      phone: body.phone || "",
      meeting: body.meeting || "",
      timeline: body.timeline || "",
      notes: body.notes || "",
      created_at: new Date().toISOString(),
    };
    const rows = await supabaseFetch("/rest/v1/bookings", { method: "POST", body: JSON.stringify([record]) });
    json(res, 201, { ...rows[0], createdAt: rows[0].created_at });
  } catch (error) {
    handleError(res, error);
  }
};
