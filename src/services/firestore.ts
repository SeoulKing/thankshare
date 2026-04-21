import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Draw, NewShareInput, Share } from "../types";

export function getFirestoreErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes("permission-denied")) {
    return "Firestore 권한이 막혀 있습니다. Firebase Console에서 firestore.rules를 배포해주세요.";
  }

  if (error instanceof Error && error.message.includes("Missing or insufficient permissions")) {
    return "Firestore 권한이 막혀 있습니다. Firebase Console에서 firestore.rules를 배포해주세요.";
  }

  return error instanceof Error ? error.message : "Firebase 요청 중 문제가 생겼습니다.";
}

function requireDb(): Firestore {
  if (!db) {
    throw new Error("Firebase 설정이 필요합니다.");
  }

  return db;
}

function mapShare(doc: QueryDocumentSnapshot<DocumentData>): Share {
  const data = doc.data();

  return {
    id: doc.id,
    groupName: String(data.groupName ?? ""),
    name: String(data.name ?? ""),
    content: String(data.content ?? ""),
    dateKey: String(data.dateKey ?? ""),
    createdAt: data.createdAt ?? null,
  };
}

function mapDraw(doc: QueryDocumentSnapshot<DocumentData>): Draw {
  const data = doc.data();

  return {
    id: doc.id,
    shareId: String(data.shareId ?? ""),
    dateKey: String(data.dateKey ?? ""),
    drawnAt: data.drawnAt ?? null,
  };
}

export async function createShare(input: NewShareInput, dateKey: string) {
  const firestore = requireDb();

  return addDoc(collection(firestore, "shares"), {
    groupName: input.groupName.trim(),
    name: input.name.trim(),
    content: input.content.trim(),
    dateKey,
    createdAt: serverTimestamp(),
  });
}

export function subscribeShares(
  onNext: (shares: Share[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const firestore = requireDb();
  const sharesQuery = query(
    collection(firestore, "shares"),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(
    sharesQuery,
    (snapshot) => onNext(snapshot.docs.map(mapShare)),
    onError,
  );
}

export function subscribeDraws(
  onNext: (draws: Draw[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const firestore = requireDb();
  const drawsQuery = query(collection(firestore, "draws"));

  return onSnapshot(
    drawsQuery,
    (snapshot) => onNext(snapshot.docs.map(mapDraw)),
    onError,
  );
}

export async function getSharesByDate(dateKey: string) {
  const firestore = requireDb();
  const sharesQuery = query(
    collection(firestore, "shares"),
    where("dateKey", "==", dateKey),
  );
  const snapshot = await getDocs(sharesQuery);

  return snapshot.docs.map(mapShare);
}

export async function getDrawsByDate(dateKey: string) {
  const firestore = requireDb();
  const drawsQuery = query(
    collection(firestore, "draws"),
    where("dateKey", "==", dateKey),
  );
  const snapshot = await getDocs(drawsQuery);

  return snapshot.docs
    .map(mapDraw)
    .sort((a, b) => (a.drawnAt?.toMillis() ?? 0) - (b.drawnAt?.toMillis() ?? 0));
}

export async function createDraw(shareId: string, dateKey: string) {
  const firestore = requireDb();

  return addDoc(collection(firestore, "draws"), {
    shareId,
    dateKey,
    drawnAt: serverTimestamp(),
  });
}
