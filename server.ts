import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser with 50mb limit for multiple image base64 uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Single or Batch Parcel Label Analysis with Gemini
app.post("/api/gemini/analyze-parcel", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", images } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY is not configured on the server. Please configure it in AI Studio settings or check environment variables.",
        code: "NO_API_KEY",
      });
    }

    // Determine if batch or single
    const imageList: Array<{ data: string; mimeType: string }> = [];

    if (Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        if (img.data) {
          imageList.push({
            data: img.data.replace(/^data:image\/[a-zA-Z+]+;base64,/, ""),
            mimeType: img.mimeType || "image/jpeg",
          });
        }
      }
    } else if (imageBase64) {
      imageList.push({
        data: imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, ""),
        mimeType: mimeType || "image/jpeg",
      });
    } else {
      return res.status(400).json({ error: "No image data provided" });
    }

    const results = [];

    for (let i = 0; i < imageList.length; i++) {
      const item = imageList[i];
      try {
        const prompt = `You are an expert OCR and parcel logistics assistant specialized in German parcel delivery labels (DHL, DPD, Hermes, GLS, UPS, Amazon Logistics).
Analyze this parcel label image carefully and extract all relevant German delivery information into structured JSON.

Extract:
1. recipientName: Full name of the recipient (e.g. "Max Mustermann", "Dr. Julia Schmidt", "Firma Tech GmbH").
2. street: German street name (e.g. "Hauptstraße", "Musterweg", "Berliner Allee", "Friedrichstr.").
3. houseNumber: House number and optional addition (e.g. "12", "45a", "7 B", "12-14", "Wohnung 3").
4. postalCode: 5-digit German PLZ (e.g. "10115", "80331", "50667").
5. city: German city / town (e.g. "Berlin", "München", "Köln", "Hamburg", "Frankfurt am Main").
6. country: Always "Deutschland" or "Germany" unless explicitly stated otherwise.
7. phone: Recipient phone number or mobile if printed on the label, or null.
8. trackingNumber: Barcode or tracking identifier (e.g. "00340434161094043685", "1Z9999999999999999", "JJD0000000000000000", "01234567890123"), or null.
9. notes: Any specific delivery instructions printed on label (e.g. "Ablagevertrag Garage", "Hinterhaus 2. OG", "Vorsicht Glas", "Nachbar Herr Meyer", "Identitätsprüfung"), or null.
10. rawExtractedText: Key text snippets recognized from the label for audit.

If a field is unclear, make your best intelligent estimate based on German address conventions, but do NOT make up fake cities. If postal code and city are found, ensure they match German geography.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: {
            parts: [
              {
                inlineData: {
                  data: item.data,
                  mimeType: item.mimeType,
                },
              },
              { text: prompt },
            ],
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                recipientName: { type: Type.STRING, description: "Recipient name" },
                street: { type: Type.STRING, description: "German street name" },
                houseNumber: { type: Type.STRING, description: "House number" },
                postalCode: { type: Type.STRING, description: "5-digit German postal code" },
                city: { type: Type.STRING, description: "German city" },
                country: { type: Type.STRING, description: "Country" },
                phone: { type: Type.STRING, description: "Phone number if present", nullable: true },
                trackingNumber: { type: Type.STRING, description: "Tracking or barcode number if present", nullable: true },
                notes: { type: Type.STRING, description: "Delivery instructions or notes", nullable: true },
                rawExtractedText: { type: Type.STRING, description: "Raw OCR text snippets" },
                confidence: { type: Type.NUMBER, description: "Confidence score from 0.0 to 1.0" },
              },
              required: ["recipientName", "street", "houseNumber", "postalCode", "city"],
            },
          },
        });

        const textOutput = response.text;
        if (textOutput) {
          const parsed = JSON.parse(textOutput);
          results.push({
            success: true,
            index: i,
            data: {
              recipientName: parsed.recipientName || "Unbekannter Empfänger",
              street: parsed.street || "",
              houseNumber: parsed.houseNumber || "",
              postalCode: parsed.postalCode || "",
              city: parsed.city || "",
              country: parsed.country || "Deutschland",
              phone: parsed.phone || null,
              trackingNumber: parsed.trackingNumber || `PKG-${Date.now().toString().slice(-6)}-${i + 1}`,
              notes: parsed.notes || null,
              rawExtractedText: parsed.rawExtractedText || "",
              confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.95,
            },
          });
        } else {
          results.push({
            success: false,
            index: i,
            error: "No text returned from AI analysis",
          });
        }
      } catch (err: any) {
        console.error(`Error processing image ${i}:`, err);
        results.push({
          success: false,
          index: i,
          error: err.message || "Failed to analyze image with AI",
        });
      }
    }

    return res.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error: any) {
    console.error("Gemini API handler error:", error);
    return res.status(500).json({
      error: error.message || "Internal server error during parcel analysis",
    });
  }
});

// Geocoding endpoint with German address validation & fallback
app.post("/api/geocode", async (req, res) => {
  try {
    const { street, houseNumber, postalCode, city, country = "Deutschland" } = req.body;

    if (!city && !postalCode && !street) {
      return res.status(400).json({ error: "Missing address parameters" });
    }

    const queryParts = [
      street ? `${street} ${houseNumber || ""}`.trim() : "",
      postalCode ? postalCode.trim() : "",
      city ? city.trim() : "",
      country || "Deutschland",
    ].filter(Boolean);

    const fullQuery = queryParts.join(", ");

    // 1. Try Nominatim OpenStreetMap Geocoding
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        fullQuery
      )}&format=json&addressdetails=1&limit=3&countrycodes=de`;

      const geoRes = await fetch(nominatimUrl, {
        headers: {
          "User-Agent": "ProDeliveryApp/1.0 (logistics-routing-system)",
          Accept: "application/json",
        },
      });

      if (geoRes.ok) {
        const data = await geoRes.json();
        if (Array.isArray(data) && data.length > 0) {
          const match = data[0];
          const lat = parseFloat(match.lat);
          const lng = parseFloat(match.lon);

          // Validate that coordinates are inside Germany bounding box (Lat: ~47.0 to 55.2, Lng: ~5.8 to 15.2)
          if (lat >= 47.0 && lat <= 55.2 && lng >= 5.8 && lng <= 15.2) {
            return res.json({
              success: true,
              lat,
              lng,
              displayName: match.display_name,
              geocodingStatus: "verified",
              confidence: 0.98,
            });
          }
        }
      }
    } catch (nominatimErr) {
      console.warn("Nominatim geocoding failed, trying Photon fallback:", nominatimErr);
    }

    // 2. Try Photon Komoot API fallback (fast OpenStreetMap index for Germany)
    try {
      const photonQuery = `${street || ""} ${houseNumber || ""} ${postalCode || ""} ${city || ""}`.trim();
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
        photonQuery
      )}&limit=3&lang=de`;

      const photonRes = await fetch(photonUrl, {
        headers: { "User-Agent": "ProDeliveryApp/1.0" },
      });

      if (photonRes.ok) {
        const pData = await photonRes.json();
        if (pData?.features && pData.features.length > 0) {
          const feature = pData.features[0];
          const [lng, lat] = feature.geometry.coordinates;

          if (lat >= 47.0 && lat <= 55.2 && lng >= 5.8 && lng <= 15.2) {
            return res.json({
              success: true,
              lat,
              lng,
              displayName: `${feature.properties.name || ""}, ${feature.properties.city || city || ""}, Germany`,
              geocodingStatus: "verified",
              confidence: 0.92,
            });
          }
        }
      }
    } catch (photonErr) {
      console.warn("Photon geocoding failed:", photonErr);
    }

    // 3. Fallback: German Major City / Postal Code approximate coordinates
    const cityCoords = getGermanCityApproxCoords(city, postalCode);
    if (cityCoords) {
      return res.json({
        success: true,
        lat: cityCoords.lat,
        lng: cityCoords.lng,
        displayName: `${street || ""} ${houseNumber || ""}, ${postalCode || ""} ${city || ""}, Deutschland (Approximate)`,
        geocodingStatus: "approximate",
        confidence: 0.7,
      });
    }

    // Could not verify
    return res.json({
      success: false,
      geocodingStatus: "failed",
      error: "Could not locate German address with high precision. Please verify street/PLZ.",
    });
  } catch (error: any) {
    console.error("Geocode route error:", error);
    return res.status(500).json({ error: error.message || "Geocoding failed" });
  }
});

// Helper for known German postal code zones & major cities
function getGermanCityApproxCoords(
  city?: string,
  postalCode?: string
): { lat: number; lng: number } | null {
  const normCity = (city || "").toLowerCase().trim();
  const plzPrefix = (postalCode || "").slice(0, 2);

  const cityTable: Record<string, { lat: number; lng: number }> = {
    berlin: { lat: 52.52, lng: 13.405 },
    hamburg: { lat: 53.5511, lng: 9.9937 },
    münchen: { lat: 48.1351, lng: 11.582 },
    munich: { lat: 48.1351, lng: 11.582 },
    köln: { lat: 50.9375, lng: 6.9603 },
    cologne: { lat: 50.9375, lng: 6.9603 },
    frankfurt: { lat: 50.1109, lng: 8.6821 },
    "frankfurt am main": { lat: 50.1109, lng: 8.6821 },
    stuttgart: { lat: 48.7758, lng: 9.1829 },
    düsseldorf: { lat: 51.2277, lng: 6.7735 },
    leipzig: { lat: 51.3397, lng: 12.3731 },
    dortmund: { lat: 51.5136, lng: 7.4653 },
    essen: { lat: 51.4556, lng: 7.0116 },
    bremen: { lat: 53.0793, lng: 8.8017 },
    dresden: { lat: 51.0504, lng: 13.7373 },
    hannover: { lat: 52.3759, lng: 9.732 },
    nürnberg: { lat: 49.4521, lng: 11.0767 },
    duisburg: { lat: 51.4344, lng: 6.7623 },
    bochum: { lat: 51.4818, lng: 7.2162 },
    wuppertal: { lat: 51.2562, lng: 7.1508 },
    bonn: { lat: 50.7374, lng: 7.0982 },
    münster: { lat: 51.9607, lng: 7.6261 },
    karlsruhe: { lat: 49.0069, lng: 8.4037 },
    mannheim: { lat: 49.4875, lng: 8.466 },
    augsburg: { lat: 48.3705, lng: 10.8978 },
    wiesbaden: { lat: 50.0782, lng: 8.2398 },
    potsdam: { lat: 52.3906, lng: 13.0645 },
  };

  for (const [key, coords] of Object.entries(cityTable)) {
    if (normCity.includes(key)) {
      return coords;
    }
  }

  // Postal code regions (PLZ 0-9)
  const plzTable: Record<string, { lat: number; lng: number }> = {
    "10": { lat: 52.52, lng: 13.4 }, // Berlin
    "12": { lat: 52.44, lng: 13.43 }, // Berlin South
    "13": { lat: 52.57, lng: 13.35 }, // Berlin North
    "20": { lat: 53.55, lng: 9.99 }, // Hamburg
    "22": { lat: 53.6, lng: 10.05 }, // Hamburg North
    "30": { lat: 52.37, lng: 9.73 }, // Hannover
    "40": { lat: 51.22, lng: 6.77 }, // Düsseldorf
    "50": { lat: 50.93, lng: 6.96 }, // Köln
    "60": { lat: 50.11, lng: 8.68 }, // Frankfurt
    "70": { lat: 48.77, lng: 9.18 }, // Stuttgart
    "80": { lat: 48.13, lng: 11.58 }, // München
    "90": { lat: 49.45, lng: 11.07 }, // Nürnberg
    "01": { lat: 51.05, lng: 13.73 }, // Dresden
    "04": { lat: 51.33, lng: 12.37 }, // Leipzig
  };

  if (plzPrefix && plzTable[plzPrefix]) {
    return plzTable[plzPrefix];
  }

  return null;
}

// Vite middleware & Production static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Pro Delivery] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
