import {
  type CollectionReference,
  type DocumentData,
} from "firebase-admin/firestore";

import { getAdminFirestore } from "@/shared/lib/firebase/admin";
import type {
  BaseRepository,
  ListOptions,
  PaginatedResult,
} from "@/shared/repositories/base-repository";
import type { CollectionMap, CollectionName } from "@/shared/types/firestore";

export class FirestoreRepository<TCollection extends CollectionName>
  implements BaseRepository<CollectionMap[TCollection]>
{
  constructor(private readonly collectionName: TCollection) {}

  private collection(): CollectionReference<DocumentData> {
    return getAdminFirestore().collection(this.collectionName);
  }

  async findById(id: string): Promise<CollectionMap[TCollection] | null> {
    const snapshot = await this.collection().doc(id).get();

    if (!snapshot.exists) {
      return null;
    }

    return snapshot.data() as CollectionMap[TCollection];
  }

  async list(
    options: ListOptions = {},
  ): Promise<PaginatedResult<CollectionMap[TCollection]>> {
    const limit = options.limit ?? 50;
    let query = this.collection().orderBy("createdAt", "desc").limit(limit + 1);

    if (options.cursor) {
      const cursorSnapshot = await this.collection().doc(options.cursor).get();

      if (cursorSnapshot.exists) {
        query = query.startAfter(cursorSnapshot);
      }
    }

    const snapshot = await query.get();
    const docs = snapshot.docs.slice(0, limit);

    return {
      items: docs.map((doc) => doc.data() as CollectionMap[TCollection]),
      nextCursor:
        snapshot.docs.length > limit ? docs[docs.length - 1]?.id ?? null : null,
    };
  }

  async create(id: string, data: CollectionMap[TCollection]): Promise<void> {
    await this.collection().doc(id).set(data);
  }

  async update(
    id: string,
    data: Partial<CollectionMap[TCollection]>,
  ): Promise<void> {
    await this.collection().doc(id).update(data);
  }
}
