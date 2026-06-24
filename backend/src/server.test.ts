/**
 * Tests for the Bun API Gateway
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";

const GATEWAY_URL = "http://localhost:4000";

describe("Gateway Health", () => {
  test("GET /api/health returns gateway status", async () => {
    const res = await fetch(`${GATEWAY_URL}/api/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.gateway).toBe("ok");
  });
});

describe("Upload Validation", () => {
  test("POST /api/upload rejects non-feather files", async () => {
    const formData = new FormData();
    formData.append("file", new Blob(["test"]), "test.csv");

    const res = await fetch(`${GATEWAY_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });
    expect(res.status).toBe(400);
  });

  test("POST /api/upload without file returns 400", async () => {
    const res = await fetch(`${GATEWAY_URL}/api/upload`, {
      method: "POST",
      body: new FormData(),
    });
    expect(res.status).toBe(400);
  });
});

describe("Metadata & Filter (requires uploaded file)", () => {
  test("GET /api/metadata returns metadata after upload", async () => {
    // First check if a file was already uploaded
    const res = await fetch(`${GATEWAY_URL}/api/metadata`);
    if (res.status === 200) {
      const data = await res.json();
      expect(data.instruments).toBeInstanceOf(Array);
      expect(data.names).toBeInstanceOf(Array);
      expect(data.expiries_by_instrument).toBeDefined();
      expect(data.total_rows).toBeGreaterThan(0);
    } else {
      // No file uploaded yet, expect 400
      expect(res.status).toBe(400);
    }
  });

  test("POST /api/filter returns paginated data", async () => {
    const res = await fetch(`${GATEWAY_URL}/api/filter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: 1, page_size: 5 }),
    });

    if (res.status === 200) {
      const data = await res.json();
      expect(data.data).toBeInstanceOf(Array);
      expect(data.total).toBeGreaterThanOrEqual(0);
      expect(data.page).toBe(1);
      expect(data.page_size).toBe(5);
    } else {
      // No file uploaded yet
      expect(res.status).toBe(400);
    }
  });

  test("GET /api/preview returns paginated preview", async () => {
    const res = await fetch(`${GATEWAY_URL}/api/preview?page=1&page_size=5`);

    if (res.status === 200) {
      const data = await res.json();
      expect(data.data).toBeInstanceOf(Array);
      expect(data.total_pages).toBeGreaterThanOrEqual(1);
    } else {
      expect(res.status).toBe(400);
    }
  });
});
