// spotifyApi.ts
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

export const getUserId = async (accessToken: string): Promise<string | null> => {
  try {
    const response = await fetch(`${SPOTIFY_API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch user data from Spotify');
      return null;
    }

    const data = await response.json();
    return data.id; // User ID from Spotify API
  } catch (error) {
    console.error('Error fetching user ID:', error);
    return null;
  }
};

export const getRecentlyPlayedTracks = async (accessToken: string): Promise<any> => {
  try {
    const response = await fetch(`${SPOTIFY_API_URL}/me/player/recently-played?limit=50`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch recently played tracks');
      return null;
    }

    const data = await response.json();
    return data; // Array of recently played tracks
  } catch (error) {
    console.error('Error fetching recently played tracks:', error);
    return null;
  }
};

// Example to get tracks from Firestore (for checking against Firebase data)
export const getTracksFromDatabase = async (userId: string) => {
  try {
    const tracksCollection = collection(db, 'users', userId, 'tracks');
    const snapshot = await getDocs(tracksCollection);
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error reading tracks from Firestore:', error);
    return [];
  }
};
