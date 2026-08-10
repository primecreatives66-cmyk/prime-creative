const { json, readBody, requireAdmin, setCmsValue, handleError } = require("./_utils");

module.exports = async (req, res) => {
  try {
    if (req.method !== "PUT") return json(res, 405, { error: "Method not allowed" });
    requireAdmin(req);
    const services = await setCmsValue("services", await readBody(req));
    json(res, 200, services);
  } catch (error) {
    handleError(res, error);
  }
};
