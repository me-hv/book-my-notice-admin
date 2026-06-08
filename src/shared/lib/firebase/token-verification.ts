type FirebaseAccountLookupResponse = {
  users?: Array<{
    localId?: string;
    email?: string;
  }>;
};

export type VerifiedFirebaseUser = {
  uid: string;
  email: string | null;
};

export async function verifyFirebaseIdTokenWithRest(
  idToken: string,
): Promise<VerifiedFirebaseUser> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!apiKey) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_API_KEY for token lookup.");
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Firebase token lookup failed with ${response.status}.`);
  }

  const payload = (await response.json()) as FirebaseAccountLookupResponse;
  const user = payload.users?.[0];

  if (!user?.localId) {
    throw new Error("Firebase token lookup did not return a user.");
  }

  return {
    uid: user.localId,
    email: user.email ?? null,
  };
}
