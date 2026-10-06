import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  getDocs,
  Unsubscribe 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
import { Project } from '../types';

const PROJECTS_COLLECTION = 'projects';

/**
 * Subscribes in real-time to the current user's projects in Firestore.
 */
export function subscribeToUserProjects(
  userId: string,
  onUpdate: (projects: Project[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const projectsRef = collection(db, PROJECTS_COLLECTION);
  const q = query(projectsRef, where('ownerId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Project[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Project;
        items.push({
          ...data,
          id: docSnap.id,
          initiatives: Array.isArray(data.initiatives) ? data.initiatives : [],
          milestones: Array.isArray(data.milestones) ? data.milestones : [],
          history: Array.isArray(data.history) ? data.history : [],
          goals: Array.isArray(data.goals) ? data.goals : [],
          tags: Array.isArray(data.tags) ? data.tags : [],
          collaborators: Array.isArray(data.collaborators) ? data.collaborators : []
        });
      });
      onUpdate(items);
    },
    (err) => {
      console.error('[Firebase] Projects onSnapshot error:', err);
      try {
        handleFirestoreError(err, OperationType.GET, PROJECTS_COLLECTION);
      } catch (e: any) {
        if (onError) onError(e);
      }
    }
  );
}

/**
 * Saves or updates a project document in Firestore.
 */
export async function saveProjectToFirestore(project: Project, userId: string): Promise<void> {
  const docRef = doc(db, PROJECTS_COLLECTION, project.id);
  const cleanPayload = {
    ...project,
    ownerId: userId,
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(docRef, cleanPayload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${PROJECTS_COLLECTION}/${project.id}`);
  }
}

/**
 * Deletes a project document from Firestore.
 */
export async function deleteProjectFromFirestore(projectId: string): Promise<void> {
  const docRef = doc(db, PROJECTS_COLLECTION, projectId);
  try {
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${PROJECTS_COLLECTION}/${projectId}`);
  }
}

/**
 * Migrates local projects into Firestore when a user logs in for the first time.
 */
export async function migrateLocalProjectsToFirestore(localProjects: Project[], userId: string): Promise<number> {
  if (!localProjects || localProjects.length === 0) return 0;

  try {
    const q = query(collection(db, PROJECTS_COLLECTION), where('ownerId', '==', userId));
    const existing = await getDocs(q);
    
    // If the user already has projects in the cloud, don't overwrite
    if (!existing.empty) {
      return 0;
    }

    let migrated = 0;
    for (const project of localProjects) {
      await saveProjectToFirestore(project, userId);
      migrated++;
    }
    return migrated;
  } catch (err) {
    console.warn('[Firebase] Migration warning:', err);
    return 0;
  }
}
