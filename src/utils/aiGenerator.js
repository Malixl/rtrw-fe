import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

let genAI = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

const buildContextString = (context = {}) => {
  const parts = [];

  if (context.klasifikasi) {
    parts.push(`- Klasifikasi/Kategori data: "${context.klasifikasi}"`);
  }

  if (context.geometryType) {
    const typeMap = {
      point: 'Titik (Point) — merepresentasikan lokasi spesifik seperti fasilitas, bangunan, atau titik koordinat penting',
      polyline: 'Garis (Polyline) — merepresentasikan jaringan seperti jalan, sungai, jalur pipa, atau batas linear',
      polygon: 'Area (Polygon) — merepresentasikan kawasan, zona, wilayah, atau batas administrasi'
    };
    parts.push(`- Tipe geometri: ${typeMap[context.geometryType] || context.geometryType}`);
  }

  if (context.color && (context.geometryType === 'polygon' || context.geometryType === 'polyline')) {
    parts.push(`- Warna representasi di peta: ${context.color} (warna ini bisa menandakan fungsi, kelas, atau intensitas kawasan)`);
  }

  if (context.lineType && context.geometryType === 'polyline') {
    const lineMap = {
      bold: 'Garis tebal (menandakan jalur utama/primer)',
      solid: 'Garis solid (jalur standar)',
      dashed: 'Garis putus-putus (biasanya rencana atau batas sementara)',
      'dash-dot-dot': 'Garis dash-dot-dot (biasanya batas khusus)',
      'dash-dot-dash-dot-dot': 'Garis kompleks (biasanya batas zona/kawasan tertentu)'
    };
    parts.push(`- Tipe garis: ${lineMap[context.lineType] || context.lineType}`);
  }

  if (context.hasIcon && context.geometryType === 'point') {
    parts.push(`- Data ini memiliki ikon kustom, yang artinya merupakan objek/fasilitas penting yang perlu dibedakan secara visual di peta`);
  }

  return parts.length > 0 ? `\n\nInformasi konteks tambahan yang harus dipertimbangkan:\n${parts.join('\n')}` : '';
};

/**
 * Panggil Google Gemini (Primary)
 */
const generateWithGemini = async (prompt) => {
  if (!genAI) throw new Error("GEMINI_API_KEY tidak ditemukan");

  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
};

/**
 * Panggil Groq Cloud (Fallback)
 */
const generateWithGroq = async (prompt) => {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY tidak ditemukan");

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1024
    })
  });

  const data = await response.json();
  if (!response.ok) {
    if (response.status === 429) {
      const err = new Error("Quota Groq juga habis");
      err.isQuotaError = true;
      throw err;
    }
    throw new Error(data.error?.message || "Gagal menghubungi Groq");
  }

  return data.choices[0]?.message?.content?.trim() || "";
};

/**
 * Main function dengan sistem Failover (Gemini -> Groq)
 */
export const generateDeskripsiAI = async (title, modul = "Data Rencana Tata Ruang / Infrastruktur", context = {}) => {
  if (!title || title.trim() === '') throw new Error("Judul data masih kosong");

  const contextInfo = buildContextString(context);
  const prompt = `Kamu adalah ahli geografi, tata kota, dan perencanaan tata ruang wilayah (RTRW) Indonesia. 
Buatkan 1 paragraf deskripsi formal, informatif, dan profesional mengenai: "${title}".
Data ini termasuk dalam modul GIS: "${modul}".${contextInfo}

Aturan ketat yang WAJIB diikuti:
- Deskripsi akan dimasukkan langsung ke aplikasi pemetaan WebGIS untuk keperluan informasi publik.
- Bahasa profesional, ringkas, dan kontekstual sesuai bidang tata ruang wilayah Indonesia.
- Jelaskan fungsi, manfaat, dan relevansi data/infrastruktur ini terhadap perencanaan tata ruang dan pembangunan wilayah.
- Jika ada informasi warna atau tipe garis, integrasikan makna representasi visualnya dalam deskripsi.
- Jika ada klasifikasi, jelaskan hubungan data dengan klasifikasi tersebut.
- JANGAN berikan salam, pembuka, atau penutup. Langsung tulis isi deskripsinya.
- JANGAN gunakan simbol markdown bold (**) atau heading (#).
- Tulis dalam Bahasa Indonesia yang baik dan benar.`;

  // --- Step 1: Coba Gemini (Primary) ---
  try {
    console.log("Mencoba generate dengan Gemini (Primary)...");
    return await generateWithGemini(prompt);
  } catch (error) {
    console.warn("Gemini Gagal/Limit, Swiching ke Groq (Fallback)...", error);

    // Cek apakah error karena limit (429)
    const isGeminiQuota = error.message?.includes("429") || error.status === 429 || error.message?.toLowerCase().includes("quota");

    if (isGeminiQuota) {
      // --- Step 2: Coba Groq (Fallback) ---
      try {
        console.log("Mencoba generate dengan Groq...");
        return await generateWithGroq(prompt);
      } catch (groqError) {
        console.error("Groq juga gagal:", groqError);

        if (groqError.isQuotaError) {
          const finalError = new Error("Semua jatah AI (Gemini & Groq) telah habis. Silakan tunggu 1 menit.");
          finalError.isQuotaError = true;
          throw finalError;
        }
        throw groqError;
      }
    }

    // Jika bukan error kuota, lemparkan error asli
    throw new Error("Gagal menggenerate deskripsi. Silakan coba lagi.");
  }
};

export default generateDeskripsiAI;
