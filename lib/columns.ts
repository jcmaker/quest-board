import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "@/firebaseDB";

export interface Column {
  id: string;
  name: string;
  order: number;
  color?: string;
  teamId?: string;
  userId: string;
  createdAt: Timestamp;
}

// Default columns for new users/teams
export const DEFAULT_COLUMNS = [
  { name: "To Do", order: 0, color: "#e2e8f0" },
  { name: "In Progress", order: 1, color: "#fef3c7" },
  { name: "Done", order: 2, color: "#d1fae5" },
];

export async function getPersonalColumns(userId: string): Promise<Column[]> {
  try {
    const q = query(
      collection(db, "columns"),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const columns = querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((col: any) => !col.teamId) as Column[];

    // If no columns exist, create defaults
    if (columns.length === 0) {
      const defaultColumns = await createDefaultColumns(userId);
      return defaultColumns;
    }

    return columns.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("Error getting personal columns:", error);
    throw error;
  }
}

export async function getTeamColumns(teamId: string, userId: string): Promise<Column[]> {
  try {
    const q = query(collection(db, "columns"));
    const querySnapshot = await getDocs(q);
    const columns = querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((col: any) => col.teamId === teamId) as Column[];

    // If no columns exist, create defaults for this team
    if (columns.length === 0) {
      const defaultColumns = await createDefaultColumns(userId, teamId);
      return defaultColumns;
    }

    return columns.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("Error getting team columns:", error);
    throw error;
  }
}

async function createDefaultColumns(userId: string, teamId?: string): Promise<Column[]> {
  const createdColumns: Column[] = [];

  for (const defaultCol of DEFAULT_COLUMNS) {
    const docRef = await addDoc(collection(db, "columns"), {
      name: defaultCol.name,
      order: defaultCol.order,
      color: defaultCol.color,
      userId,
      teamId: teamId || null,
      createdAt: Timestamp.now(),
    });

    createdColumns.push({
      id: docRef.id,
      name: defaultCol.name,
      order: defaultCol.order,
      color: defaultCol.color,
      userId,
      teamId,
      createdAt: Timestamp.now(),
    });
  }

  return createdColumns;
}

export async function createColumn(
  userId: string,
  name: string,
  order: number,
  teamId?: string,
  color?: string
): Promise<string> {
  const docRef = await addDoc(collection(db, "columns"), {
    name,
    order,
    color: color || "#e2e8f0",
    userId,
    teamId: teamId || null,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateColumn(
  columnId: string,
  updates: Partial<Column>
): Promise<void> {
  const columnRef = doc(db, "columns", columnId);
  await updateDoc(columnRef, updates);
}

export async function deleteColumn(columnId: string): Promise<void> {
  const columnRef = doc(db, "columns", columnId);
  await deleteDoc(columnRef);
}
