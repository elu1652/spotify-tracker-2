// src/services/auth.ts

const getTokens = async (code: string): Promise<boolean> => {
    const clientId = import.meta.env.VITE_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_CLIENT_SECRET;
    const redirectUri = import.meta.env.VITE_REDIRECT_URI;
  
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });
  
    if (!response.ok) {
      console.error('Error getting tokens:', await response.text());
      return false;
    }
  
    const data = await response.json();
    localStorage.setItem('access_token',data.access_token);
    localStorage.setItem('refresh_token',data.refresh_token);
    
    return true;
  };
  
const handleAuthRedirect = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    console.log("code",code);
    if(code){
        getTokens(code);
    }
}
const authorize = () => {
    const clientId = import.meta.env.VITE_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_REDIRECT_URI;
    const scope = 'user-read-private user-read-email user-read-recently-played'; // Define the scope you need
    const state = crypto.randomUUID(); // Random string to prevent CSRF attacks
    
    // Construct the authorization URL using Authorization Code Flow
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}
      &response_type=code
      &redirect_uri=${encodeURIComponent(redirectUri)}
      &scope=${encodeURIComponent(scope)}
      &state=${state}`.replace(/\s+/g, ''); // Remove whitespace
  window.location.href = authUrl;

  
}

// Save the access token to local storage
const saveTokens = (accessToken: string, refreshToken: string): void => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  };
  
  // Get the access token from local storage
  const getAccessToken = (): string | null => {
    return localStorage.getItem('access_token');
  };

  const getRefreshToken = (): string | null => {
    return localStorage.getItem('refresh_token');
  };
  
  // Extract the token from the URL after the redirect
  const extractTokenFromUrl = (): { accessToken: string | null; refreshToken: string | null } => {
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    return { accessToken, refreshToken };
  };

  

  
  
  
  // Handle token expiration (to be enhanced later)
  const refreshAccessToken = async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if(!refreshToken) {
      authorize();
    }
    if (!refreshToken) return null;
  
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: import.meta.env.VITE_CLIENT_ID,
        client_secret: import.meta.env.VITE_CLIENT_SECRET,
      }),
    });
  
    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      return data.access_token;
    }
    return null;
  };

  const validateToken = async (token: string) => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        return true; // Token is valid
      }
      return false; // Token is not valid
    } catch (error) {
      console.error('Error validating token:', error);  
      return false; // Token validation failed
    }
  };

  const getValidToken = async (): Promise<string | null> => {
    try {
      const token = getAccessToken();
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        return token; // Token is valid
      }
      return refreshAccessToken(); // Token is not valid
    } catch (error) {
      console.error('Error validating token:', error);  
      return ""; // Token validation failed
    }
  };
  
  export { handleAuthRedirect, saveTokens, getAccessToken, getRefreshToken, extractTokenFromUrl, refreshAccessToken, getValidToken, validateToken };
  