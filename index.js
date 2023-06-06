const express = require('express');
const app = express();
const Client = require('castv2-client').Client;
const DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;
const googleTTS = require('google-tts-api');

// Route untuk menjalankan kode Google Home
app.get('/play', (req, res) => {
  const ip = req.query.ip; // Alamat IP perangkat Google Home
  const text = req.query.text; // Teks yang akan diucapkan

  runGoogleHome(ip, text)
    .then(() => {
      res.send('Google Home is playing');
    })
    .catch((error) => {
      res.status(500).send(`Error: ${error.message}`);
    });
});

// Fungsi untuk menjalankan kode Google Home
function runGoogleHome(ip, text) {
  return new Promise((resolve, reject) => {
    const url = googleTTS.getAudioUrl(text, {
      lang: 'id-ID',
      slow: false,
      host: 'https://translate.google.com',
    });

    console.log('url', url)

    const client = new Client();

    client.connect(ip, () => {
        console.log('Connected to Google Home');
      
        // Launch the default media receiver app
        client.launch(DefaultMediaReceiver, (err, player) => {
          if (err) {
            console.error('Error launching app:', err);
            return;
          }
      
          console.log('App launched');
          const media = {
            contentId: url,
            contentType: 'video/mp4',
            streamType: 'BUFFERED',
          };
      
          player.load(media, { autoplay: true }, (err, status) => {
            if (err) {
              console.error('Error loading media:', err);
              return;
            }
      
            console.log('Media loaded');
      
            // Monitor media status
            player.on('status', (status) => {
              if (status.playerState === 'PLAYING') {
                console.log('Media is playing');
              } else if (status.playerState === 'IDLE') {
                console.log('Media playback finished');
                client.close(); // Close the connection to the Google Home device
              }
            });
          });
        });
    });
    client.on('error', (err) => {
        console.error('Error:', err);
    });
  });
}

// Mulai server Express
const port = 3000; // Ganti dengan port yang Anda inginkan
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});