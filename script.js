// ============================================
// ENF ENTROPY VAULT - SIMPLIFIED WORKING VERSION
// ============================================

// Wait for page to load completely
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded - setting up...');
    
    // Get elements
    const micBtn = document.getElementById('micBtn');
    const statusDiv = document.getElementById('status');
    const enfCard = document.getElementById('enfCard');
    const rngCard = document.getElementById('rngCard');
    const generateBtn = document.getElementById('generateBtn');
    const randomKeyDiv = document.getElementById('randomKey');
    const freqValueSpan = document.getElementById('freqValue');
    const entropyCountSpan = document.getElementById('entropyCount');
    const entropyProgressFill = document.getElementById('entropyProgressFill');
    
    // Audio variables
    let audioContext = null;
    let mediaStream = null;
    let analyser = null;
    let animationId = null;
    let currentFrequency = 50.0;
    let entropyBytes = [];
    let sampleRate = 48000;
    
    // Canvas
    let canvas = null;
    let ctx = null;
    
    // Check if button exists
    if (!micBtn) {
        console.error('Microphone button not found!');
        statusDiv.innerHTML = '❌ Error: Button not found';
        return;
    }
    
    console.log('Button found, adding click listener...');
    
    // ========== MICROPHONE SETUP ==========
    async function enableMicrophone() {
        console.log('Enable Microphone clicked!');
        statusDiv.innerHTML = '🎤 Requesting microphone access...';
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
            
            console.log('Microphone access granted');
            mediaStream = stream;
            
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            sampleRate = audioContext.sampleRate;
            console.log('Sample rate:', sampleRate);
            
            const source = audioContext.createMediaStreamSource(stream);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            source.connect(analyser);
            
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            
            statusDiv.innerHTML = '✅ Microphone active! Place near wall outlet or tap desk.';
            enfCard.classList.remove('hidden');
            rngCard.classList.remove('hidden');
            
            startENFDetection();
            
        } catch (error) {
            console.error('Error:', error);
            statusDiv.innerHTML = '❌ Error: ' + error.message;
        }
    }
    
    // ========== FREQUENCY DETECTION ==========
    function detectFrequency(timeData, sampleRate) {
        let zeroCrossings = 0;
        let lastSign = 0;
        let started = false;
        let maxAmplitude = 0;
        
        for (let i = 0; i < timeData.length; i++) {
            const val = Math.abs((timeData[i] - 128) / 128);
            if (val > maxAmplitude) maxAmplitude = val;
        }
        
        if (maxAmplitude < 0.01) return null;
        
        for (let i = 0; i < timeData.length; i++) {
            const value = (timeData[i] - 128) / 128;
            const sign = Math.sign(value);
            
            if (!started && Math.abs(value) > 0.01) {
                started = true;
                lastSign = sign;
                continue;
            }
            
            if (started && sign !== 0 && sign !== lastSign) {
                zeroCrossings++;
                lastSign = sign;
            }
        }
        
        if (zeroCrossings < 4) return null;
        
        const freq = (zeroCrossings / 2) * (sampleRate / timeData.length);
        if (freq > 40 && freq < 70) return freq;
        return null;
    }
    
    // ========== START ENF DETECTION ==========
    function startENFDetection() {
        canvas = document.getElementById('enfCanvas');
        ctx = canvas.getContext('2d');
        canvas.width = 800;
        canvas.height = 200;
        
        const freqDisplayHistory = new Array(200).fill(50.0);
        let freqBuffer = [];
        let currentSmooth = 50.0;
        let lastGoodFreq = 50.0;
        
        function update() {
            if (!analyser || audioContext?.state !== 'running') {
                animationId = requestAnimationFrame(update);
                return;
            }
            
            const timeData = new Uint8Array(analyser.fftSize);
            analyser.getByteTimeDomainData(timeData);
            
            const detectedFreq = detectFrequency(timeData, sampleRate);
            
            if (detectedFreq !== null) {
                freqBuffer.push(detectedFreq);
                if (freqBuffer.length > 20) freqBuffer.shift();
                
                if (freqBuffer.length > 0) {
                    let sum = 0;
                    for (let i = 0; i < freqBuffer.length; i++) sum += freqBuffer[i];
                    const smoothedFreq = sum / freqBuffer.length;
                    currentSmooth = currentSmooth * 0.7 + smoothedFreq * 0.3;
                    currentFrequency = currentSmooth;
                    lastGoodFreq = currentFrequency;
                    
                    if (freqValueSpan) freqValueSpan.textContent = currentFrequency.toFixed(4);
                    
                    // Extract entropy
                    const deviation = Math.abs(currentFrequency - 50.0);
                    const entropyByte = Math.floor(deviation * 10000) & 0xFF;
                    
                    if (entropyByte > 0 && entropyByte < 255 && entropyBytes.length < 4096) {
                        entropyBytes.push(entropyByte);
                        if (entropyCountSpan) entropyCountSpan.textContent = entropyBytes.length;
                        
                        const progressPercent = (entropyBytes.length / 512) * 100;
                        if (entropyProgressFill) entropyProgressFill.style.width = `${Math.min(progressPercent, 100)}%`;
                    }
                }
            } else {
                if (freqValueSpan) freqValueSpan.textContent = lastGoodFreq.toFixed(4) + ' (acquiring)';
            }
            
            // Draw graph
            freqDisplayHistory.push(currentFrequency);
            freqDisplayHistory.shift();
            
            ctx.fillStyle = '#0a0a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.beginPath();
            ctx.strokeStyle = '#00d2ff';
            ctx.lineWidth = 2;
            
            for (let i = 0; i < freqDisplayHistory.length; i++) {
                const x = (i / freqDisplayHistory.length) * canvas.width;
                let y = canvas.height - ((freqDisplayHistory[i] - 49) / 2) * canvas.height;
                y = Math.min(Math.max(y, 0), canvas.height);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            
            ctx.beginPath();
            ctx.strokeStyle = '#ff4444';
            ctx.lineWidth = 1.5;
            const nominalY = canvas.height - ((50 - 49) / 2) * canvas.height;
            ctx.moveTo(0, nominalY);
            ctx.lineTo(canvas.width, nominalY);
            ctx.stroke();
            
            animationId = requestAnimationFrame(update);
        }
        
        update();
    }
    
    // ========== GENERATE RANDOM KEY ==========
    async function generateRandomKey() {
        if (entropyBytes.length < 256) {
            randomKeyDiv.innerHTML = `Need more entropy... ${entropyBytes.length}/256 bytes. Keep microphone running.`;
            return;
        }
        
        randomKeyDiv.innerHTML = "Generating cryptographic key...";
        
        const entropyArray = new Uint8Array(entropyBytes);
        const hashBuffer = await crypto.subtle.digest('SHA-256', entropyArray);
        const hashArray = new Uint8Array(hashBuffer);
        
        const hexString = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
        randomKeyDiv.innerHTML = hexString;
        
        // Show encryption card
        const encryptCard = document.getElementById('encryptCard');
        if (encryptCard) encryptCard.classList.remove('hidden');
    }
    
    // ========== ADD EVENT LISTENERS ==========
    micBtn.addEventListener('click', enableMicrophone);
    
    if (generateBtn) {
        generateBtn.addEventListener('click', generateRandomKey);
    }
    
    // Copy button
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const keyText = randomKeyDiv.innerText;
            if (keyText && keyText !== '--' && !keyText.includes('Need')) {
                navigator.clipboard.writeText(keyText);
                statusDiv.innerHTML = '📋 Key copied!';
            }
        });
    }
    
    // Encryption buttons
    const encryptBtn = document.getElementById('encryptBtn');
    const decryptBtn = document.getElementById('decryptBtn');
    const messageInput = document.getElementById('messageInput');
    const encryptedOutput = document.getElementById('encryptedOutput');
    const decryptedOutput = document.getElementById('decryptedOutput');
    
    let lastKeyBytes = null;
    let lastEncryptedData = null;
    
    // Save key when generated
    const originalGenerate = generateRandomKey;
    window.generateRandomKey = generateRandomKey;
    
    if (encryptBtn) {
        encryptBtn.addEventListener('click', async () => {
            // Get the current key from the page
            const keyHex = randomKeyDiv.innerText;
            if (!keyHex || keyHex === '--' || keyHex.includes('Need')) {
                statusDiv.innerHTML = '⚠️ Generate a random key first!';
                return;
            }
            
            const message = messageInput.value;
            if (!message) {
                statusDiv.innerHTML = '⚠️ Type a message to encrypt!';
                return;
            }
            
            // Convert hex to bytes
            const keyBytes = new Uint8Array(32);
            for (let i = 0; i < 32; i++) {
                keyBytes[i] = parseInt(keyHex.substr(i*2, 2), 16);
            }
            lastKeyBytes = keyBytes;
            
            statusDiv.innerHTML = '🔒 Encrypting...';
            
            try {
                const cryptoKey = await crypto.subtle.importKey(
                    'raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']
                );
                
                const iv = crypto.getRandomValues(new Uint8Array(12));
                const encoded = new TextEncoder().encode(message);
                const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, cryptoKey, encoded);
                
                const combined = new Uint8Array(iv.length + encrypted.byteLength);
                combined.set(iv);
                combined.set(new Uint8Array(encrypted), iv.length);
                
                encryptedOutput.innerHTML = Array.from(combined).map(b => b.toString(16).padStart(2, '0')).join('');
                lastEncryptedData = combined;
                statusDiv.innerHTML = '✅ Encrypted with your ENF key!';
            } catch (e) {
                statusDiv.innerHTML = '❌ Encryption failed: ' + e.message;
            }
        });
    }
    
    if (decryptBtn) {
        decryptBtn.addEventListener('click', async () => {
            if (!lastKeyBytes || !lastEncryptedData) {
                statusDiv.innerHTML = '⚠️ No encrypted message found!';
                return;
            }
            
            statusDiv.innerHTML = '🔓 Decrypting...';
            
            try {
                const iv = lastEncryptedData.slice(0, 12);
                const encryptedData = lastEncryptedData.slice(12);
                
                const cryptoKey = await crypto.subtle.importKey(
                    'raw', lastKeyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']
                );
                
                const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, cryptoKey, encryptedData);
                const message = new TextDecoder().decode(decrypted);
                decryptedOutput.innerHTML = message;
                statusDiv.innerHTML = '✅ Decrypted successfully!';
            } catch (e) {
                statusDiv.innerHTML = '❌ Decryption failed: ' + e.message;
            }
        });
    }
    
    statusDiv.innerHTML = '⚡ Ready. Click "Enable Microphone" to start.';
    console.log('Setup complete!');
});