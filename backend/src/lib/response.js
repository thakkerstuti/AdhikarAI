const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export function ok(body, statusCode = 200) {
  return { statusCode, headers: HEADERS, body: JSON.stringify(body) };
}

export function fail(err, statusCode = 500) {
  console.error(err);
  return ok({ error: err.message || "Something went wrong. Please try again." }, statusCode);
}
