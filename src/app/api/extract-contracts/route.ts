import { NextResponse } from "next/server";
import { extractContracts, MissingApiKeyError, type UploadedPdf } from "@/lib/ai/extract";

// Extraction can take a while for several PDFs.
export const maxDuration = 300;

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const assetId = String(form.get("assetId") ?? "");
  const files = form.getAll("files").filter((f): f is File => f instanceof File);

  const pdfs = files.filter(
    (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
  );

  if (pdfs.length === 0) {
    return NextResponse.json({ error: "No PDF files provided." }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Extraction is not configured. Add ANTHROPIC_API_KEY to .env.local and restart the dev server.",
      },
      { status: 400 },
    );
  }

  const uploads: UploadedPdf[] = await Promise.all(
    pdfs.map(async (f) => ({
      name: f.name,
      data: new Uint8Array(await f.arrayBuffer()),
    })),
  );

  const results = await Promise.allSettled(
    uploads.map((u) => extractContracts(u, assetId)),
  );

  // Each PDF can yield several contracts — flatten them into one draft list.
  const drafts = results
    .filter((r) => r.status === "fulfilled")
    .flatMap(
      (r) =>
        (r as PromiseFulfilledResult<Awaited<ReturnType<typeof extractContracts>>>)
          .value,
    );

  const failures = results.flatMap((r, i) =>
    r.status === "rejected" ? [{ file: uploads[i].name, reason: String(r.reason) }] : [],
  );

  if (drafts.length === 0) {
    const missingKey = results.some(
      (r) => r.status === "rejected" && r.reason instanceof MissingApiKeyError,
    );
    return NextResponse.json(
      {
        error: missingKey
          ? "ANTHROPIC_API_KEY is not set."
          : "Could not extract any contracts from the uploaded PDFs.",
        failures,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ drafts, failures });
}
