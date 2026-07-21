import "server-only";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { MODEL_CLASSIFY, MODEL_EXTRACT } from "./config";
import { SegmentationSchema, extractionSchema } from "./schemas";
import {
  contractTypeDef,
  knowledgeBaseText,
  paramsKindFor,
  defaultTimeWindow,
} from "@/lib/contract-types";
import type { ContractParameters, DraftContract } from "@/lib/types";

export class MissingApiKeyError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY is not set");
    this.name = "MissingApiKeyError";
  }
}

export interface UploadedPdf {
  name: string;
  data: Uint8Array;
}

interface Segment {
  type: string;
  title: string;
  confidence: number;
}

// Read one PDF and extract EVERY contract it contains. A single PDF may bundle
// multiple contracts, so we first segment the document into individual contracts
// (with their type), then extract the type-specific fields for each.
export async function extractContracts(
  file: UploadedPdf,
  assetId: string,
): Promise<DraftContract[]> {
  if (!process.env.ANTHROPIC_API_KEY) throw new MissingApiKeyError();

  const filePart = {
    type: "file" as const,
    data: file.data,
    mediaType: "application/pdf",
    filename: file.name,
  };

  // 1) Segment: find every distinct contract in the document and classify each.
  const segmentation = await generateObject({
    model: anthropic(MODEL_CLASSIFY),
    schema: SegmentationSchema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "This document may contain one OR MORE distinct energy contracts. " +
              "Identify EVERY distinct contract. For each, return its contract-type value, " +
              "a short title that uniquely identifies it within the document, and a confidence (0-1). " +
              "Do not merge different contracts into one entry, and do not split a single contract into several.\n\n" +
              "Contract types:\n" +
              knowledgeBaseText(),
          },
          filePart,
        ],
      },
    ],
  });

  const segments: Segment[] = segmentation.object.contracts;
  if (segments.length === 0) return [];

  const multiple = segments.length > 1;

  // 2) Extract each identified contract with the schema for its type.
  const drafts = await Promise.all(
    segments.map(async (seg) => {
      const kind = paramsKindFor(seg.type);
      const def = contractTypeDef(seg.type);

      const focus = multiple
        ? `The document contains ${segments.length} contracts. Extract ONLY the contract identified as "${seg.title}". Ignore the other contracts in the document.`
        : "Extract the single contract in this document.";

      const extraction = await generateObject({
        model: anthropic(MODEL_EXTRACT),
        schema: extractionSchema(kind),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  `${focus}\n\n` +
                  `It is a "${def?.label ?? seg.type}" contract. ${def?.description ?? ""}\n\n` +
                  "Extract its fields and type-specific parameters. " +
                  "Use empty strings for values you cannot find; do not invent values.",
              },
              filePart,
            ],
          },
        ],
      });

      const o = extraction.object;
      const draft: DraftContract = {
        name: o.name || seg.title || file.name.replace(/\.pdf$/i, ""),
        supplier: o.supplier ?? "",
        type: seg.type,
        startDate: o.startDate ?? "",
        endDate: o.endDate ?? "",
        assetId,
        timeWindow: o.timeWindow?.mode ? o.timeWindow : defaultTimeWindow(),
        parameters: o.parameters as ContractParameters,
        confidence: seg.confidence,
        sourceFileName: file.name,
      };
      return draft;
    }),
  );

  return drafts;
}
