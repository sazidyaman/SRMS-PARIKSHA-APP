import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut as firebaseSignOut,
} from 'firebase/auth';

export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
];

import { auth } from './firebase';
import { GoogleDriveFile, DriveStorageQuota, GoogleDriveUser } from '../types';

// Provider with all Drive scopes
const provider = new GoogleAuthProvider();
DRIVE_SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'consent',
});

// Flag to indicate if we are currently signing in
let isSigningIn = false;
// Cached access token in memory ONLY (never in localStorage/sessionStorage as per security skill)
let cachedAccessToken: string | null = null;

/**
 * Initialize auth listener to monitor sign-in state and manage in-memory token
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token was invalidated or cleared on reload
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Trigger official Google Sign-In with Drive Scopes
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to acquire OAuth access token for Google Drive.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get current in-memory token
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Check if user is authenticated with Drive
 */
export const hasDriveToken = (): boolean => {
  return !!cachedAccessToken;
};

/**
 * Disconnect/sign out and clear token from memory
 */
export const logoutDrive = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.warn('Sign out warning:', err);
  } finally {
    cachedAccessToken = null;
  }
};

/**
 * Fetch Google Drive User Profile and Storage Quota
 */
export const getDriveAbout = async (): Promise<{
  user: GoogleDriveUser;
  storageQuota: DriveStorageQuota;
} | null> => {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const res = await fetch(
      'https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress,photoLink),storageQuota(limit,usage,usageInDrive,usageInDriveTrash)',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to fetch Drive about (Status ${res.status})`);
    }

    const data = await res.json();
    return {
      user: data.user || {},
      storageQuota: data.storageQuota || {},
    };
  } catch (error) {
    console.error('getDriveAbout error:', error);
    throw error;
  }
};

/**
 * List files from Google Drive
 */
export const listDriveFiles = async (options: {
  folderId?: string;
  query?: string;
  pageSize?: number;
  mimeTypeFilter?: 'all' | 'folders' | 'documents' | 'spreadsheets' | 'pdfs';
} = {}): Promise<GoogleDriveFile[]> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in to Google Drive.');
  }

  const { folderId, query = '', pageSize = 50, mimeTypeFilter = 'all' } = options;

  const queryParts: string[] = ['trashed = false'];

  if (folderId) {
    queryParts.push(`'${folderId}' in parents`);
  }

  if (mimeTypeFilter === 'folders') {
    queryParts.push("mimeType = 'application/vnd.google-apps.folder'");
  } else if (mimeTypeFilter === 'pdfs') {
    queryParts.push("mimeType = 'application/pdf'");
  } else if (mimeTypeFilter === 'documents') {
    queryParts.push("(mimeType = 'application/vnd.google-apps.document' or mimeType contains 'word' or mimeType contains 'text')");
  } else if (mimeTypeFilter === 'spreadsheets') {
    queryParts.push("(mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType contains 'excel' or mimeType contains 'sheet')");
  }

  if (query.trim()) {
    const escaped = query.replace(/'/g, "\\'");
    queryParts.push(`name contains '${escaped}'`);
  }

  const q = queryParts.join(' and ');
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', q);
  url.searchParams.set('pageSize', String(pageSize));
  url.searchParams.set(
    'fields',
    'files(id, name, mimeType, webViewLink, webContentLink, iconLink, thumbnailLink, size, createdTime, modifiedTime, parents)'
  );
  url.searchParams.set('orderBy', 'folder,modifiedTime desc');

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch files from Drive (Status ${res.status})`);
  }

  const data = await res.json();
  return (data.files || []).map((file: any) => ({
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    webViewLink: file.webViewLink,
    webContentLink: file.webContentLink,
    iconLink: file.iconLink,
    thumbnailLink: file.thumbnailLink,
    size: file.size,
    createdTime: file.createdTime,
    modifiedTime: file.modifiedTime,
    parents: file.parents,
  }));
};

/**
 * Create a new folder in Google Drive
 */
export const createDriveFolder = async (
  folderName: string,
  parentFolderId?: string
): Promise<GoogleDriveFile> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Authentication required');

  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create folder in Google Drive');
  }

  return await res.json();
};

/**
 * Find or create dedicated "SRMS Pariksha - Academic Portal" workspace folder
 */
export const findOrCreateAppFolder = async (
  folderName: string = 'SRMS Pariksha - Academic Portal'
): Promise<string> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Authentication required');

  const q = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`;
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (res.ok) {
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  // Create it
  const created = await createDriveFolder(folderName);
  return created.id;
};

/**
 * Upload a file to Google Drive using multipart upload
 */
export const uploadDriveFile = async (options: {
  name: string;
  mimeType: string;
  content: string | Blob;
  folderId?: string;
}): Promise<GoogleDriveFile> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Authentication required');

  const { name, mimeType, content, folderId } = options;

  const metadata: any = {
    name,
    mimeType,
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  let body: Blob;

  if (content instanceof Blob) {
    const metadataPart = new Blob(
      [`${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`],
      { type: 'text/plain' }
    );
    const mediaHeader = new Blob([`${delimiter}Content-Type: ${mimeType}\r\n\r\n`], { type: 'text/plain' });
    const closePart = new Blob([closeDelimiter], { type: 'text/plain' });

    body = new Blob([metadataPart, mediaHeader, content, closePart], {
      type: `multipart/related; boundary=${boundary}`,
    });
  } else {
    // String content
    const multipartRequestBody =
      `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(metadata) +
      `\r\n${delimiter}Content-Type: ${mimeType}\r\n\r\n` +
      content +
      closeDelimiter;

    body = new Blob([multipartRequestBody], {
      type: `multipart/related; boundary=${boundary}`,
    });
  }

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,size,createdTime',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: body,
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to upload file to Google Drive');
  }

  return await res.json();
};

/**
 * Delete a file from Google Drive
 * MANDATORY: Always preceded by user confirmation in UI!
 */
export const deleteDriveFile = async (fileId: string): Promise<void> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Authentication required');

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to delete file from Google Drive');
  }
};
