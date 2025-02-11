import React, { useCallback, useEffect, useState } from 'react';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase.ts';
import { getUserId, getRecentlyPlayedTracks } from '../spotifyApi.ts';
import { getValidToken } from '../auth';

interface PlayedItem {
  track: {
    name: string;
    artists: { name: string; external_urls: { spotify: string }; uri: string }[]; 
    album: { images: { url: string }[]; name: string; external_urls: { spotify: string }; release_date: string };
    external_urls: { spotify: string };
    id: string;
    uri: string;
    popularity: number;
    preview_url: string | null;
  };
  played_at: string;
  context: { type: string; href: string; external_urls: { spotify: string }; uri: string };
}

interface ProcessedTrack {
  name: string;
  count: number;
  lastListened: string;
  artists: string;
  albumCover: string;
}

const MostPlayed: React.FC = () => {
  const [mostPlayedTracks, setMostPlayedTracks] = useState<ProcessedTrack[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const processRecentlyPlayed = useCallback(async (recentlyPlayedData: { items: PlayedItem[] }, userId: string) => {
    console.log("recently",recentlyPlayedData.items)
    if (!recentlyPlayedData || !Array.isArray(recentlyPlayedData.items)) {
      console.error('Invalid or empty recently played data:', recentlyPlayedData);
      return;
    }

    const existingTracks = await readTracksFromDatabase(userId);
    const trackMap = new Map<string, ProcessedTrack>();

    existingTracks.forEach((track: ProcessedTrack) => {
      trackMap.set(track.name, {
        name: track.name,
        count: track.count,
        lastListened: track.lastListened,
        artists: track.artists,
        albumCover: track.albumCover,
      });
    });

    recentlyPlayedData.items.reverse().forEach((item: PlayedItem) => {
      const { track, played_at } = item;

      if (track && track.name && played_at) {
        const title = track.name;
        const listenedAt = played_at;
        const artist = track.artists ? track.artists.map(artist => artist.name).join(', ') : '';
        const albumCover = track.album.images?.[0]?.url || '';

        if (trackMap.has(title)) {
          const trackInfo = trackMap.get(title)!;
          const listenedAtTimestamp = new Date(listenedAt);
          const lastListenedTimestamp = new Date(trackInfo.lastListened);
          if (listenedAtTimestamp > lastListenedTimestamp) {
            trackInfo.count += 1;
            trackInfo.lastListened = listenedAt;
          }
        } else {
          trackMap.set(title, {
            name: title,
            count: 1,
            lastListened: listenedAt,
            artists: artist,
            albumCover,
          });
        }
      }
    });

    const processedTracks = Array.from(trackMap.values());
    processedTracks.sort((a, b) => b.count - a.count);

    await writeTracksToDatabase(userId, processedTracks);
    setMostPlayedTracks(processedTracks); // Update state with processed tracks
  },[]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accessToken = await getValidToken();
        if (!accessToken) {
          throw new Error('Failed to get access token');
        }

        const userId = await getUserId(accessToken);
        if (!userId) {
          throw new Error('Failed to get user ID');
        }

        const recentlyPlayedData = await getRecentlyPlayedTracks(accessToken);
        await processRecentlyPlayed(recentlyPlayedData, userId);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('Failed to fetch data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [processRecentlyPlayed]);

  const writeTracksToDatabase = async (userId: string, tracks: ProcessedTrack[]) => {
    try {
      const userRef = doc(db, 'users', userId);
      for (const track of tracks) {
        const trackRef = doc(collection(userRef, 'tracks'), track.name);
        await setDoc(trackRef, track);
      }
    } catch (error) {
      console.error('Error writing to the database:', error);
    }
  };

  const readTracksFromDatabase = async (userId: string): Promise<ProcessedTrack[]> => {
    try {
      const tracksCollection = collection(db, 'users', userId, 'tracks');
      const snapshot = await getDocs(tracksCollection);
      return snapshot.docs.map(doc => doc.data() as ProcessedTrack);
    } catch (error) {
      console.error('Error reading tracks from Firestore:', error);
      return [];
    }
  };

  const timeAgo = (dateString: string): string => {
    const now = new Date();
    const playedAt = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - playedAt.getTime()) / 1000);
  
    const secondsInMinute = 60;
    const secondsInHour = 3600;
    const secondsInDay = 86400;
  
    if (diffInSeconds < secondsInMinute) {
      return `${diffInSeconds} second${diffInSeconds === 1 ? '' : 's'} ago`;
    } else if (diffInSeconds < secondsInHour) {
      const minutes = Math.floor(diffInSeconds / secondsInMinute);
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    } else if (diffInSeconds < secondsInDay) {
      const hours = Math.floor(diffInSeconds / secondsInHour);
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else {
      const days = Math.floor(diffInSeconds / secondsInDay);
      return `${days} day${days === 1 ? '' : 's'} ago`;
    }
  };

  return (
    <div className="most-played-container">
      <h2>Most Played Tracks</h2>
      {mostPlayedTracks.length > 0 ? (
        <ul className="track-list">
          {mostPlayedTracks.map(track => (
            <li key={track.name} className="track-item">
              <div className="track-info">
                <img className="album-cover" src={track.albumCover} alt={track.name} />
                <div className="track-details">
                  <h3>{track.name}</h3>
                  <p>{track.artists}</p>
                  <p>Plays: {track.count}</p>
                  <p>Last Played: {timeAgo(track.lastListened)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No tracks to display.</p>
      )}
    </div>
  );
};

export default MostPlayed;
