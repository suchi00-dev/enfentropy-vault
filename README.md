\# ENF Entropy Vault



\ True random numbers from the hum in your walls



This web app listens to the 50Hz or 60Hz hum from your wall outlet and turns it into cryptographically secure random numbers.






\ How it works



Every wall outlet hums at 50Hz or 60Hz. But this frequency is never perfectly stable. It fluctuates slightly because millions of people are using electricity all the time.



These tiny, unpredictable fluctuations are natural randomness. This app captures them through your microphone and converts them into random numbers.



No special hardware needed. Just your laptop and a wall outlet.






\ Live Demo



Try it here: https://suchi00-dev.github.io/enfentropy-vault/



Debug tool (to test your microphone): https://suchi00-dev.github.io/enfentropy-vault/debug.html







\ How to use



1\. Open the website in Google Chrome

2\. Click "Enable Microphone" and allow permission

3\. Place your laptop near a wall outlet or running appliance

4\. Wait for entropy counter to reach 256 bytes

5\. Click "Generate 256-bit Key"

6\. Copy your random key







\ Troubleshooting



\*\*Frequency shows - Hz\*\*



\- Tap your desk near the microphone

\- Move laptop closer to a wall outlet

\- Play a 50Hz tone from your phone near the mic



\*\*Entropy not collecting\*\*



\- Make sure the frequency display shows a number around 50 or 60

\- Wait 10-15 seconds for the signal to stabilize



\*\*Microphone permission denied\*\*



\- Click the lock icon in your browser address bar

\- Allow microphone access

\- Refresh the page



\---



\## Run locally



```bash

python -m http.server 8000

