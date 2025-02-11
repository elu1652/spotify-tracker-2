import React, { useEffect } from 'react';
import { saveTokens, getAccessToken, refreshAccessToken, extractTokenFromUrl, getRefreshToken, validateToken } from '../auth';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {

  const navigate = useNavigate();

  const clientId = import.meta.env.VITE_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_REDIRECT_URI;
  const scope = 'user-read-private user-read-email user-read-recently-played'; // Define the scope you need
  const state = 'state'; // You can use a random string to prevent CSRF attacks

  // Construct the authorization URL
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;

  // Check if we have the token in the URL on initial load
  useEffect(() => {
    const { accessToken, refreshToken } = extractTokenFromUrl();
    if (accessToken && refreshToken) {
      saveTokens(accessToken, refreshToken);
      
      navigate('/menu'); // Redirect to the menu page after successful login
    }
  }, [navigate]);

  const handleLoginClick = async () => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    if (accessToken) {
      const tokenIsValid = await validateToken(accessToken);
      if (tokenIsValid) {
        console.log("valid");
        navigate('/menu');
        return;
      } else {
        if (refreshToken) {
          const newAccessToken = await refreshAccessToken();  
          if (newAccessToken) {
            navigate('/menu');
            return;
          } else {
            window.location.href = authUrl; // Redirect to Spotify Authorization page
          }
        } else {
          window.location.href = authUrl; // Redirect to Spotify Authorization page
        }
      }
    } else {
      window.location.href = authUrl; // Redirect to Spotify Authorization page
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-black via-gray-800 to-black text-white flex flex-col items-center justify-center p-8 relative">
      <h1 className="text-6xl font-bold mb-8 text-center">Spotify Tracker</h1>
      <p className="text-xl mb-8 text-center">
        Track your recently played songs, most played tracks, and see your stats easily.
      </p>

      <button
        onClick={handleLoginClick}
        className="bg-green-500 text-white px-8 py-4 rounded-full shadow-xl hover:bg-green-600 transition duration-300 transform hover:scale-105"
      >
        Get Started
      </button>

      <div className="absolute bottom-6 text-center text-sm">
        <p>Log in to start tracking your Spotify data and exploring your music stats.</p>
      </div>
    </div>
  );
};

export default Home;
