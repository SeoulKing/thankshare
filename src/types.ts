import type { Timestamp } from "firebase/firestore";

export type Share = {
  id: string;
  groupName: string;
  name: string;
  content: string;
  dateKey: string;
  createdAt: Timestamp | null;
};

export type Draw = {
  id: string;
  shareId: string;
  dateKey: string;
  drawnAt: Timestamp | null;
};

export type NewShareInput = {
  groupName: string;
  name: string;
  content: string;
};
