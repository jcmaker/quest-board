import {
  collection,
  addDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebaseDB";

export interface Team {
  id: string;
  name: string;
  createdBy: string;
  members: string[];
  admins: string[];
  inviteCode: string;
  createdAt: Timestamp;
}

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function getTeam(teamId: string): Promise<Team | null> {
  try {
    const docRef = doc(db, "teams", teamId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Team;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting team:", error);
    throw error;
  }
}

export async function createTeam(
  userId: string,
  name: string
): Promise<Team> {
  try {
    let inviteCode = generateInviteCode();
    
    // Ensure invite code is unique (simple check)
    let q = query(collection(db, "teams"), where("inviteCode", "==", inviteCode));
    let snapshot = await getDocs(q);
    let retries = 0;
    while (!snapshot.empty && retries < 5) {
      inviteCode = generateInviteCode();
      q = query(collection(db, "teams"), where("inviteCode", "==", inviteCode));
      snapshot = await getDocs(q);
      retries++;
    }

    if (!snapshot.empty) {
      throw new Error("Failed to generate unique invite code");
    }

    const teamData = {
      name,
      createdBy: userId,
      members: [userId],
      admins: [userId], // Creator is the first admin
      inviteCode,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, "teams"), teamData);
    return { id: docRef.id, ...teamData };
  } catch (error) {
    console.error("Error creating team:", error);
    throw error;
  }
}

export async function joinTeam(
  userId: string,
  inviteCode: string
): Promise<Team> {
  try {
    const q = query(collection(db, "teams"), where("inviteCode", "==", inviteCode));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error("Invalid invite code");
    }

    const teamDoc = snapshot.docs[0];
    const teamData = teamDoc.data();

    if (teamData.members.includes(userId)) {
      throw new Error("You are already a member of this team");
    }

    await updateDoc(doc(db, "teams", teamDoc.id), {
      members: arrayUnion(userId),
    });

    return { id: teamDoc.id, ...teamData, members: [...teamData.members, userId] } as Team;
  } catch (error) {
    console.error("Error joining team:", error);
    throw error;
  }
}

export async function getUserTeams(userId: string): Promise<Team[]> {
  try {
    // Client-side filtering to avoid potential index/permission issues
    const q = query(collection(db, "teams"));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((team: any) => team.members && team.members.includes(userId)) as Team[];
  } catch (error) {
    console.error("Error getting user teams:", error);
    throw error;
  }
}

export async function removeTeamMember(
  teamId: string,
  requesterId: string,
  memberToRemoveId: string
): Promise<void> {
  try {
    const team = await getTeam(teamId);
    if (!team) throw new Error("Team not found");

    // Check permissions
    const isAdmin = team.admins.includes(requesterId);
    const isSelf = requesterId === memberToRemoveId;

    if (!isAdmin && !isSelf) {
      throw new Error("You don't have permission to remove this member");
    }

    await updateDoc(doc(db, "teams", teamId), {
      members: arrayRemove(memberToRemoveId),
      admins: arrayRemove(memberToRemoveId) // Also remove from admins if they were one
    });
  } catch (error) {
    console.error("Error removing team member:", error);
    throw error;
  }
}

export async function updateTeamName(
  teamId: string,
  requesterId: string,
  newName: string
): Promise<void> {
  try {
    const team = await getTeam(teamId);
    if (!team) throw new Error("Team not found");

    if (!team.admins.includes(requesterId)) {
      throw new Error("Only admins can rename the team");
    }

    await updateDoc(doc(db, "teams", teamId), {
      name: newName
    });
  } catch (error) {
    console.error("Error updating team name:", error);
    throw error;
  }
}

export async function deleteTeam(
  teamId: string,
  requesterId: string
): Promise<void> {
  try {
    const team = await getTeam(teamId);
    if (!team) throw new Error("Team not found");

    // Only the creator or an admin can delete the team? 
    // Ideally only the creator should delete, or any admin. Let's stick to admins.
    if (!team.admins.includes(requesterId)) {
      throw new Error("Only admins can delete the team");
    }

    await deleteDoc(doc(db, "teams", teamId));
    // Note: This does not delete subcollections or related todos automatically in Firestore.
    // You'd need a Cloud Function or batched writes to delete related todos.
    // For now, we leave orphaned todos.
  } catch (error) {
    console.error("Error deleting team:", error);
    throw error;
  }
}

export async function leaveTeam(
  teamId: string,
  userId: string
): Promise<void> {
  return removeTeamMember(teamId, userId, userId);
}
