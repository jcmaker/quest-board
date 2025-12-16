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
} from "firebase/firestore";
import { db } from "@/firebaseDB";

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  status?: string; // Column ID for kanban board
  createdAt: Timestamp;
  userId: string;
  teamId?: string;
  assignedTo?: string;
}

export async function getPersonalTodos(userId: string): Promise<Todo[]> {
  try {
    // Using client-side filtering to avoid index issues temporarily
    const q = query(
      collection(db, "todos"),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((todo: any) => !todo.teamId) as Todo[];
  } catch (error) {
    console.error("Error getting personal todos:", error);
    throw error;
  }
}

export async function getTeamTodos(teamId: string): Promise<Todo[]> {
  try {
    // Client-side filtering to avoid index/permission complexity during dev
    const q = query(collection(db, "todos")); 
    // Note: In production, you MUST use server-side filtering (where clause) 
    // and proper security rules for performance and security.
    // This fetches ALL todos, which is bad for scale but good for debugging.
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((todo: any) => todo.teamId === teamId) as Todo[];
  } catch (error) {
    console.error("Error getting team todos:", error);
    throw error;
  }
}

export async function createPersonalTodo(
  userId: string,
  title: string,
  status?: string
): Promise<string> {
  const docRef = await addDoc(collection(db, "todos"), {
    title,
    completed: false,
    status: status || null,
    createdAt: Timestamp.now(),
    userId,
    teamId: null,
  });
  return docRef.id;
}

export async function createTeamTodo(
  userId: string,
  teamId: string,
  title: string,
  assignedTo?: string,
  status?: string
): Promise<string> {
  const docRef = await addDoc(collection(db, "todos"), {
    title,
    completed: false,
    status: status || null,
    createdAt: Timestamp.now(),
    userId,
    teamId,
    assignedTo: assignedTo || null,
  });
  return docRef.id;
}

export async function updateTodo(
  todoId: string,
  updates: Partial<Todo>
): Promise<void> {
  const todoRef = doc(db, "todos", todoId);
  await updateDoc(todoRef, updates);
}

export async function deleteTodo(todoId: string): Promise<void> {
  const todoRef = doc(db, "todos", todoId);
  await deleteDoc(todoRef);
}

export async function createTeamTodosBatch(
  userId: string,
  teamId: string,
  todos: { title: string; assignedTo?: string }[],
  defaultColumnId: string
): Promise<string[]> {
  const createdIds: string[] = [];

  for (const todo of todos) {
    const docRef = await addDoc(collection(db, "todos"), {
      title: todo.title,
      completed: false,
      status: defaultColumnId,
      createdAt: Timestamp.now(),
      userId,
      teamId,
      assignedTo: todo.assignedTo || null,
    });
    createdIds.push(docRef.id);
  }

  return createdIds;
}

