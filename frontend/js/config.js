/* =========================================================
   API configuration
   =========================================================
   Point this at your ASP.NET Core backend.

   - Local development (dotnet run, "http" launch profile): port 5059
     (see Properties/launchSettings.json).
   - After you deploy the API (e.g. to Render), replace this with
     that public URL, for example:
       const API_BASE_URL = "https://project2-api.onrender.com/api";

   IMPORTANT: the backend must have CORS enabled for whatever
   origin this front end is served from, otherwise the browser
   will block every request from here. See the README that
   ships with this front end for the exact Program.cs change.
   ========================================================= */

const API_BASE_URL = "https://looc-lms.onrender.com/api";