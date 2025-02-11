import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserId,getUsernameWithPic } from '../spotifyApi';
import { handleAuthRedirect,getTokens, getAccessToken } from '../auth';

const Menu: React.FC = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  const navigate = useNavigate();
  useEffect(() => {
    handleAuthRedirect();
    
  });
  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.clear(); // Clear tokens or any saved data
    navigate('/'); // Redirect to home page
  };

  useEffect(() => {
    // Get the access token from the URL hash
    
    
    const initialize = async () => {
      // Wait for handleAuthRedirect to finish its process
      await handleAuthRedirect();
      
      // Now that authentication is handled, check the token
      const token = await getAccessToken();
      if (token) {
        setAccessToken(token); // Store the token (you could use local storage here)
        console.log('Access Token:', token);
        console.log(getUserId(token));

        getUsernameWithPic(token).then((data) => {
          if (data) {
            console.log("profile,data",data);
            setUsername(data?.username);
            setProfilePicture(data?.profilePicture);
          }
        });
      } else {
        console.log("No token found");
      }
    };

    initialize(); // Call the async function to start the process
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-black via-gray-800 to-black text-white flex flex-col items-center justify-center p-8 relative">
      {/* Profile & Logout Section */}
      <div className="absolute top-6 right-6 flex items-center space-x-4">
        {profilePicture && (
          <img
            src={profilePicture}
            alt="User Profile"
            className="w-10 h-10 rounded-full border-2 border-white"
          />
        )}
        {username && <span className="text-sm">{username}</span>}
        <button
          onClick={handleLogout}
          className="bg-green-500 text-white px-6 py-3 rounded-xl shadow-md hover:bg-green-600 transition duration-300"
        >
          Logout
        </button>
      </div>

      {/* Title */}
      <h1 className="text-5xl font-bold mb-12 text-center">
        Spotify Tracker Menu 🎵
      </h1>

      {/* Buttons Container */}
      <div className="flex flex-col space-y-6 w-full max-w-md px-6">
        <button
          onClick={() => handleNavigation('/recently-played')}
          className="bg-green-500 text-white py-6 rounded-full shadow-xl hover:bg-green-600 transition duration-300 transform hover:scale-105"
        >
          View Recently Played
        </button>

        <button
          onClick={() => handleNavigation('/most-played')}
          className="bg-gradient-to-r from-green-500 to-blue-500 text-white py-6 rounded-full shadow-xl hover:from-green-600 hover:to-blue-600 transition duration-300 transform hover:scale-105"
        >
          View Most Played Songs
        </button>

        <button
          onClick={() => handleNavigation('/stats')}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-6 rounded-full shadow-xl hover:from-indigo-600 hover:to-purple-600 transition duration-300 transform hover:scale-105"
        >
          View Stats
        </button>
      </div>
    </div>
  );
};

export default Menu;
