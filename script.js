
// DOM Elements
const micBtn = document.getElementById('micBtn');
const statusDiv = document.getElementById('status');
const enfCard = document.getElementById('enfCard');
const rngCard = document.getElementById('rngCard');
const freqValueSpan = document.getElementById('freqValue');
const entropyCountSpan = document.getElementById('entropyCount');
const qualityIndicatorSpan = document.getElementById('qualityIndicator');
const mlStatusSpan = document.getElementById('mlStatus');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');
const randomKeyDiv = document.getElementById('randomKey');
const entropyProgressFill = document.getElementById('entropyProgressFill');

// Audio variables
let audioContext = null;
let mediaStream = null;
let analyser = null;
let animationId = null;
let currentFrequency = 50.0;
let entropyBytes = [];
let freqHistory = [];
let sampleRate = 48000;

//Canvas
let canvas = null;
let ctx = null;

//ML MODEL STATUS
mlStatusSpan.innerHTML = 'Ready (rule-based)';

//MICROPHONE SETUP
async function enableMicrophone() {
    try {
        statusDiv.innerHTML = '🎤 Requesting microphone access...';
        
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        });
        
        mediaStream = stream;
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        sampleRate = audioContext.sampleRate;
        
        const source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        
        statusDiv.innerHTML = '✅ Microphone active! Tap your desk near the mic to start detection.';
        enfCard.classList.remove('hidden');
        rngCard.classList.remove('hidden');
        
        startENFDetection();
        
    } catch (error) {
        statusDiv.innerHTML = '❌ Error: ' + error.message;
        console.error(error);
    }
}

//FREQUENCY DETECTION Stat
function detectFrequency(timeData, sampleRate) {
    let zeroCrossings = 0;
    let lastSign = 0;
    let started = false;
    let maxAmplitude = 0;
    
    //checksignal
    for (let i = 0; i < timeData.length; i++) {
        const val = Math.abs((timeData[i] - 128) / 128);
        if (val > maxAmplitude) maxAmplitude = val;
    }
    
    // If signal is too quiet, return null
    if (maxAmplitude < 0.01) return null;
    
    // Count zero crossings
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
    
    // Calculate frequency
    const freq = (zeroCrossings / 2) * (sampleRate / timeData.length);
    
    // Return if in reasonable range (40-70 Hz covers both 50 and 60 Hz grids)
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
    let detectionCount = 0;
    
    function update() {
        if (!analyser || audioContext?.state !== 'running') {
            animationId = requestAnimationFrame(update);
            return;
        }
        
        const timeData = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(timeData);
        
        const detectedFreq = detectFrequency(timeData, sampleRate);
        
        if (detectedFreq !== null) {
            detectionCount++;
            freqBuffer.push(detectedFreq);
            if (freqBuffer.length > 20) freqBuffer.shift();
            
            if (freqBuffer.length > 0) {
                let sum = 0;
                for (let i = 0; i < freqBuffer.length; i++) sum += freqBuffer[i];
                const smoothedFreq = sum / freqBuffer.length;
                currentSmooth = currentSmooth * 0.7 + smoothedFreq * 0.3;
                currentFrequency = currentSmooth;
                lastGoodFreq = currentFrequency;
                
                freqValueSpan.textContent = currentFrequency.toFixed(4);
                freqHistory.push(currentFrequency);
                if (freqHistory.length > 500) freqHistory.shift();
                
                // Extract entropy from frequency fluctuations
                const deviation = Math.abs(currentFrequency - 50.0);
                const entropyByte = Math.floor(deviation * 10000) & 0xFF;
                
                if (entropyByte > 0 && entropyByte < 255 && entropyBytes.length < 4096) {
                    entropyBytes.push(entropyByte);
                    entropyCountSpan.textContent = entropyBytes.length;
                    
                    const progressPercent = (entropyBytes.length / 512) * 100;
                    entropyProgressFill.style.width = `${Math.min(progressPercent, 100)}%`;
                    
                    if (entropyBytes.length % 50 === 0) {
                        statusDiv.innerHTML = `✅ Collecting entropy... ${entropyBytes.length}/512 bytes`;
                    }
                }
                
                // Update quality indicator
                if (entropyBytes.length > 50) {
                    const recent = entropyBytes.slice(-50);
                    const unique = new Set(recent).size;
                    const quality = (unique / 50) * 100;
                    qualityIndicatorSpan.innerHTML = quality.toFixed(0) + '%';
                    qualityIndicatorSpan.style.color = quality > 50 ? '#00ff88' : (quality > 25 ? '#ffaa00' : '#ff6666');
                }
            }
        } else {
            // Show last good frequency with indicator
            freqValueSpan.textContent = lastGoodFreq.toFixed(4) + ' (acquiring)';
        }
        
        // Update graph
        freqDisplayHistory.push(currentFrequency);
        freqDisplayHistory.shift();
        
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw frequency trace
        ctx.beginPath();
        ctx.strokeStyle = '#00d2ff';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < freqDisplayHistory.length; i++) {
            const x = (i / freqDisplayHistory.length) * canvas.width;
            // Map 49-51Hz to full canvas height
            let y = canvas.height - ((freqDisplayHistory[i] - 49) / 2) * canvas.height;
            y = Math.min(Math.max(y, 0), canvas.height);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Draw 50Hz line
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
        randomKeyDiv.innerHTML = `⏳ Need more entropy... ${entropyBytes.length}/256 bytes. Keep microphone running.`;
        statusDiv.innerHTML = `Collecting more entropy... ${entropyBytes.length}/256 bytes`;
        return;
    }
    
    randomKeyDiv.innerHTML = "🔐 Generating cryptographic key from grid entropy...";
    statusDiv.innerHTML = "Generating random key...";
    
    const entropyArray = new Uint8Array(entropyBytes);
    const hashBuffer = await crypto.subtle.digest('SHA-256', entropyArray);
    const hashArray = new Uint8Array(hashBuffer);
    
    const hexString = Array.from(hashArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    
    randomKeyDiv.innerHTML = hexString;
    statusDiv.innerHTML = "✅ Key generated! Copy it or generate another.";
    
    // Optional: Clear entropy after use
    entropyBytes = [];
    entropyCountSpan.textContent = '0';
    entropyProgressFill.style.width = '0%';
}

// ========== COPY TO CLIPBOARD ==========
function copyToClipboard() {
    const keyText = randomKeyDiv.innerText;
    if (keyText && keyText !== '--' && !keyText.includes('Need') && !keyText.includes('Generating')) {
        navigator.clipboard.writeText(keyText);
        statusDiv.innerHTML = '📋 Key copied to clipboard!';
        setTimeout(() => {
            statusDiv.innerHTML = '✅ Microphone active! Listening for grid hum...';
        }, 2000);
    } else {
        statusDiv.innerHTML = '⚠️ Generate a key first before copying.';
    }
}

// ========== CLEANUP ==========
window.addEventListener('beforeunload', () => {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
    if (audioContext) {
        audioContext.close();
    }
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
});

// ========== EVENT LISTENERS ==========
micBtn.addEventListener('click', enableMicrophone);
generateBtn.addEventListener('click', generateRandomKey);
copyBtn.addEventListener('click', copyToClipboard);

console.log('ENF Entropy Vault loaded - Click "Enable Microphone" to start');
