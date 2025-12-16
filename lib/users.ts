import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  Timestamp,
  documentId,
} from "firebase/firestore";
import { db } from "@/firebaseDB";
import { User as FirebaseUser } from "firebase/auth";

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export async function createOrUpdateUserProfile(
  user: FirebaseUser
): Promise<void> {
  const userRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userRef);

  const displayName =
    user.displayName || user.email?.split("@")[0] || "Anonymous";

  if (userDoc.exists()) {
    // Update existing profile
    await setDoc(
      userRef,
      {
        displayName,
        email: user.email || "",
        photoURL: user.photoURL || null,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  } else {
    // Create new profile
    await setDoc(userRef, {
      id: user.uid,
      displayName,
      email: user.email || "",
      photoURL: user.photoURL || null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
}

export async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data(),
      } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
}

export async function getTeamMemberProfiles(
  memberIds: string[]
): Promise<UserProfile[]> {
  if (memberIds.length === 0) return [];

  try {
    // Firestore 'in' query supports max 30 items, so we batch if needed
    const profiles: UserProfile[] = [];
    const batches = [];

    for (let i = 0; i < memberIds.length; i += 30) {
      batches.push(memberIds.slice(i, i + 30));
    }

    for (const batch of batches) {
      const q = query(
        collection(db, "users"),
        where(documentId(), "in", batch)
      );
      const snapshot = await getDocs(q);
      snapshot.docs.forEach((doc) => {
        profiles.push({
          id: doc.id,
          ...doc.data(),
        } as UserProfile);
      });
    }

    return profiles;
  } catch (error) {
    console.error("Error getting team member profiles:", error);
    throw error;
  }
}

export function matchNameToMember(
  name: string,
  members: UserProfile[]
): UserProfile | null {
  if (!name) return null;

  const normalizedName = name.toLowerCase().trim();

  // Exact match on display name
  const exactMatch = members.find(
    (m) => m.displayName.toLowerCase() === normalizedName
  );
  if (exactMatch) return exactMatch;

  // Partial match (first name or contains)
  const partialMatch = members.find((m) => {
    const displayLower = m.displayName.toLowerCase();
    const firstName = displayLower.split(" ")[0];
    return (
      firstName === normalizedName ||
      displayLower.includes(normalizedName) ||
      normalizedName.includes(firstName)
    );
  });
  if (partialMatch) return partialMatch;

  // Email prefix match
  const emailMatch = members.find((m) => {
    const emailPrefix = m.email.split("@")[0].toLowerCase();
    return emailPrefix === normalizedName || emailPrefix.includes(normalizedName);
  });

  return emailMatch || null;
}
