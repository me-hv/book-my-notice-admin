import type { AdminUserDocument } from "@/shared/types/firestore";

type FirestoreValue =
  | { stringValue?: string }
  | { booleanValue?: boolean }
  | { mapValue?: { fields?: Record<string, FirestoreValue> } };

type FirestoreDocumentResponse = {
  fields?: Record<string, FirestoreValue>;
};

export class FirestoreRestError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

function readString(fields: Record<string, FirestoreValue>, key: string) {
  const value = fields[key];

  return "stringValue" in value ? value.stringValue : undefined;
}

function readBoolean(fields: Record<string, FirestoreValue>, key: string) {
  const value = fields[key];

  return "booleanValue" in value ? value.booleanValue : undefined;
}

export async function getAdminUserWithUserToken(
  idToken: string,
  uid: string,
): Promise<AdminUserDocument | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID.");
  }

  const url = new URL(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/adminUsers/${uid}`,
  );

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: { message?: string; status?: string };
    } | null;

    throw new FirestoreRestError(
      payload?.error?.message ?? `Firestore read failed with ${response.status}.`,
      payload?.error?.status ?? String(response.status),
      response.status,
    );
  }

  const payload = (await response.json()) as FirestoreDocumentResponse;
  const fields = payload.fields;

  if (!fields) {
    return null;
  }

  return {
    uid,
    email: readString(fields, "email") ?? "",
    role: (readString(fields, "role") ?? "VIEWER") as AdminUserDocument["role"],
    active: readBoolean(fields, "active") ?? false,
  };
}
