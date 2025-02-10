// Javascript (script.js)
// 1. Store Your Spotify Access Token

//Function to download

function downloadImage(imageUrl, filename) {
    fetch(imageUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.blob();
        })
        .then(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url); // Clean up the URL
        })
        .catch(error => {
            console.error("Error downloading image:", error);
        });
}

async function logout() {
    // Redirect to Spotify's logout page
    window.location.href = 'https://accounts.spotify.com/en/logout';

    // Consider the following steps (if needed by your authentication method):
    // 1. Clear your local storage or cookies where the token is saved
    // 2. Redirect the user to the login page after they are logged out
    //    You can replace 'login.html' with your actual login page URL
    localStorage.removeItem('spotifyAccessToken'); // Example: Remove token from localStorage
     window.location.href = 'login.html';
}

// Helper function to turn Canvas to image
function canvasToImage(songs) {
     const canvas = document.getElementById("receiptCanvas");
     const image = canvas.toDataURL("image/png");  // Get the data URL

        const link = document.createElement('a');
        link.href = image;
        link.download = 'image.png';
        document.body.appendChild(link); // Required for Firefox

        link.click();

        document.body.removeChild(link);
    }

async function fetchSpotifyData(endpoint, params = {}) {
    // Fetch the access token from local storage
        const accessToken = localStorage.getItem('spotifyAccessToken');
    const url = `https://api.spotify.com/v1/${endpoint}?${new URLSearchParams(params)}`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
}

// 3. Specific Functions to Fetch Each Metric

async function fetchTopTracks(time_range = "medium_term") {
    const data = await fetchSpotifyData("me/top/tracks", { time_range, limit: 10 });
    // Assuming album art is in the "album.images" array
    return {
        ...data,
        items: data.items.map(item => ({
            ...item,
            albumArt: "src/image.png", // Make sure it uses static url
        }))
    };
}

async function fetchTopArtists(time_range = "medium_term") {
    return await fetchSpotifyData("me/top/artists", { time_range, limit: 10 });
}

// 4. Create More Functions - Customize these to your needs.

// Function to generate the receipt HTML content
function generateReceiptContent(data, metricType) {
    let receiptContent = "<h2>Receiptify</h2>";
    receiptContent += "------------------------<br>";

    if (metricType === "topTracks") {
        data.items.forEach((track, index) => {
            receiptContent += `${String(index + 1).padStart(2, '0')} ${track.name} - ${track.artists[0].name} ${msToMinutesAndSeconds(track.duration_ms)}<br>`;
        });
    } else if (metricType === "topArtists") {
        data.items.forEach((artist, index) => {
            receiptContent += `${String(index + 1).padStart(2, '0')} ${artist.name} <br>`; //You can customize this
        });
    }
    // Add more logic here based on Metric
    return receiptContent;
}

// Function to convert milliseconds to minutes and seconds
function msToMinutesAndSeconds(ms) {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms / 1000) % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

 // Function to draw the receipt on the canvas
function drawReceiptOnCanvas(data, metricType) {
    const canvas = document.getElementById("receiptCanvas");
    const ctx = canvas.getContext("2d");

      //Clear the Canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

       // Load the background image
        const backgroundImage = new Image();

        backgroundImage.onload = () => { // Only draw after the image is loaded
                 ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height); // Draw the image

                    ctx.font = "14px Helvetica";
                    ctx.fillStyle = "black";
                    ctx.textAlign = "left";

                //Header placement adjustment
                 let headerX = 20; // Adjust horizontal position of header
                 let headerY = 40; // Adjust vertical position of header
                ctx.fillText("Receiptify", headerX, headerY);

                 let startX = 20;    // Adjust horizontal start position
                let startY = 80;   // Adjust the vertical start position of the song list
                let lineHeight = 25; // Spacing between each song

                console.log("start the drawing");
            if (metricType === "topTracks") {
            // Load the background image
            data.items.forEach((track, index) => {

                // Set the src inside the forEach
                backgroundImage.src = track.albumArt; //default for now
            let albumArt = new Image(); // Local scope to ensure new instance for each track
            console.log(track.albumArt);
            albumArt.crossOrigin = "anonymous";
            albumArt.src = track.albumArt; // Make sure this works
                 albumArt.onload = () => { // Only draw after the image is loaded
                console.log("the image onloaded");
                ctx.drawImage(albumArt, 0, 0, canvas.width, canvas.height);
                    }
                });
                }

            // Draw Song Names
            let lines = generateReceiptContent(data, metricType).split("<br>");

                    // Draw each line of the receipt
                lines.forEach((line, index) => {
                        let currentY = startY + index * lineHeight;
                    ctx.fillText(line, startX, currentY);
                });
        }
   backgroundImage.src ="src/image.png"; //load up
    }


// Function to update the receipt based on selected options
async function updateReceipt() {
    const metricType = document.getElementById("metric").value;
    let spotifyData;

    try {
        if (metricType === "topTracks") {
            spotifyData = await fetchTopTracks();
        } else if (metricType === "topArtists") {
            spotifyData = await fetchTopArtists();
        }
         // Add the conditional statements here

        else {
            throw new Error("Invalid metric selected");
        }

        // Update Canvas
        drawReceiptOnCanvas(spotifyData, metricType);

         // Function to download the canvas as an image
        const downloadButton = document.getElementById("downloadButton");
        downloadButton.addEventListener("click", () => {
            canvasToImage()
            });
        } catch (error) {
        console.error("Error fetching data:", error);
        // Display to screen an error message
    }
}

// Attach Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    updateReceipt();
    // Re-fetch data whenever metric is changed
    document.getElementById("metric").addEventListener("change", updateReceipt);

       // JavaScript to handle button selections
       const buttonGroups = document.querySelectorAll('.button-group');
       buttonGroups.forEach(group => {
        group.addEventListener('click', (event) => {
            if (event.target.tagName === 'BUTTON') {
                // Remove active class from all buttons in the group
                group.querySelectorAll('button').forEach(button => {
                    button.classList.remove('active');
                });

                // Add active class to the clicked button
                event.target.classList.add('active');

                //Update Receipt
                updateReceipt();
            }
        });
    });
});

 //Set the Javascript code name to requestAuthorization

function requestAuthorization() {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${scope}`;
    window.location.href = authUrl;
}