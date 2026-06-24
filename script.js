
// DOM Elements
const micBtn = document.getElementById('micBtn');
const statusDiv = document.getElementById('status');
const enfCard = document.getElementById('enfCard');
const entropyFlowCard = document.getElementById('entropyFlowCard');
const rngCard = document.getElementById('rngCard');
const encryptCard = document.getElementById('encryptCard');
const freqValueSpan = document.getElementById('freqValue');
const entropyCountSpan = document.getElementById('entropyCount');
const qualityIndicatorSpan = document.getElementById('qualityIndicator');
const mlQualitySpan = document.getElementById('mlQuality');
const entropyTrendSpan = document.getElementById('entropyTrend');
const generateBtn = document.getElementById('generateBtn');
const exportBtn = document.getElementById('exportBtn');
const copyBtn = document.getElementById('copyBtn');
const encryptBtn = document.getElementById('encryptBtn');
const decryptBtn = document.getElementById('decryptBtn');
const randomKeyDiv = document.getElementById('randomKey');
const encryptedOutputDiv = document.getElementById('encryptedOutput');
const decryptedOutputDiv = document.getElementById('decryptedOutput');
const messageInput = document.getElementById('messageInput');
const entropyProgressFill = document.getElementById('entropyProgressFill');
const entropyRateSpan = document.getElementById('entropyRate');
const totalEntropySpan = document.getElementById('totalEntropy');

// Audiovariables
let audioContext = null;
let mediaStream = null;
let analyser = null;
let animationId = null;
let currentFrequency = 50.0;
let entropyBytes = [];
let freqHistory = [];
let sampleRate = 48000;

// Canvasvariables
let canvas = null;
let ctx = null;
let entropyFlowCanvas = null;
let entropyFlowCtx = null;

// Encryptvariables
let lastRandomKey = null;
let lastKeyBytes = null;
let lastEncryptedData = null;

// Entropyflowvariables
let entropyFlowData = new Array(200).fill(0);
let lastEntropyCount = 0;
let lastEntropyTime = Date.now();
let qualityHistory = [];
let mlModel = null;
let mlScalerMean = null;
let mlScalerScale = null;
let mlReady = false;
let lastMlScore = 0.5;

// MICROPHONE
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
        
        statusDiv.innerHTML = 'Microphone ACTIVE! Place near wall outlet or tap desk.';
        enfCard.classList.remove('hidden');
        entropyFlowCard.classList.remove('hidden');
        rngCard.classList.remove('hidden');
        
        startENFDetection();
        setupEntropyVisualization();
        loadENFMLModel();
        
    } catch (error) {
        statusDiv.innerHTML = ' ERROR: ' + error.message;
        console.error(error);
    }
}

// FREQUENCYDETECT
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

// STARTENFDETECTION 
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
                
                freqValueSpan.textContent = currentFrequency.toFixed(4);
                freqHistory.push(currentFrequency);
                if (freqHistory.length > 500) freqHistory.shift();
                
                // Extract entropy
                const deviation = Math.abs(currentFrequency - 50.0);
                const entropyByte = Math.floor(deviation * 10000) & 0xFF;
                
                if (entropyByte > 0 && entropyByte < 255 && entropyBytes.length < 4096) {
                    entropyBytes.push(entropyByte);
                    entropyCountSpan.textContent = entropyBytes.length;
                    totalEntropySpan.textContent = entropyBytes.length;
                    
                    const progressPercent = (entropyBytes.length / 512) * 100;
                    entropyProgressFill.style.width = `${Math.min(progressPercent, 100)}%`;
                }
                
                // Updatequality
                if (entropyBytes.length > 50) {
                    const recent = entropyBytes.slice(-50);
                    const unique = new Set(recent).size;
                    const quality = (unique / 50) * 100;
                    qualityIndicatorSpan.innerHTML = quality.toFixed(0) + '%';
                    qualityIndicatorSpan.style.color = quality > 50 ? '#00ff88' : (quality > 25 ? '#ffaa00' : '#ff6666');
                    if (mlReady && freqHistory.length >= 24) {
                        predictEntropyQuality(freqHistory).then(score => {
                            updateMLDisplay(score);
                            });
                        }
                }
            }
        } else {
            freqValueSpan.textContent = lastGoodFreq.toFixed(4) + ' (acquiring)';
        }
        
        // Drawgraph
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

function setupEntropyVisualization() {
    entropyFlowCanvas = document.getElementById('entropyCanvas');
    entropyFlowCtx = entropyFlowCanvas.getContext('2d');
    entropyFlowCanvas.width = 800;
    entropyFlowCanvas.height = 100;
    updateEntropyFlow();
}

function updateEntropyFlow() {
    if (!entropyFlowCtx) return;
    
    const currentTime = Date.now();
    const timeDiff = (currentTime - lastEntropyTime) / 1000;
    
    if (timeDiff > 0 && entropyBytes.length > lastEntropyCount) {
        const newBytes = entropyBytes.length - lastEntropyCount;
        const rate = newBytes / timeDiff;
        entropyRateSpan.innerHTML = rate.toFixed(1);
        
        entropyFlowData.push(rate * 10);
        entropyFlowData.shift();
        
        lastEntropyCount = entropyBytes.length;
        lastEntropyTime = currentTime;
    }
    
    entropyFlowCtx.fillStyle = '#0a0a1a';
    entropyFlowCtx.fillRect(0, 0, entropyFlowCanvas.width, entropyFlowCanvas.height);
    
    entropyFlowCtx.beginPath();
    entropyFlowCtx.strokeStyle = '#00ff88';
    entropyFlowCtx.lineWidth = 2;
    
    for (let i = 0; i < entropyFlowData.length; i++) {
        const x = (i / entropyFlowData.length) * entropyFlowCanvas.width;
        const y = entropyFlowCanvas.height - (entropyFlowData[i] / 5) * entropyFlowCanvas.height;
        if (i === 0) entropyFlowCtx.moveTo(x, y);
        else entropyFlowCtx.lineTo(x, Math.min(Math.max(y, 0), entropyFlowCanvas.height));
    }
    entropyFlowCtx.stroke();
    
    requestAnimationFrame(updateEntropyFlow);
}

// ML ANALYSIS
function updateMLPrediction() {
    if (entropyBytes.length < 50) return;
    
    const qualityText = qualityIndicatorSpan.innerHTML;
    const recentQuality = parseInt(qualityText) || 0;
    qualityHistory.push(recentQuality);
    if (qualityHistory.length > 20) qualityHistory.shift();
    
    if (qualityHistory.length >= 5) {
        const recent = qualityHistory.slice(-5);
        const sum = recent.reduce((a, b) => a + b, 0);
        const avg = sum / recent.length;
        mlQualitySpan.innerHTML = avg.toFixed(0) + '%';
        
        if (qualityHistory.length >= 10) {
            const oldAvg = qualityHistory.slice(-10, -5).reduce((a, b) => a + b, 0) / 5;
            if (avg > oldAvg + 5) entropyTrendSpan.innerHTML = '📈 Improving';
            else if (avg < oldAvg - 5) entropyTrendSpan.innerHTML = '📉 Declining';
            else entropyTrendSpan.innerHTML = ' Stable';
        }
    }
}

setInterval(updateMLPrediction, 2000);

//
async function generateRandomKey() {
    if (entropyBytes.length < 256) {
        randomKeyDiv.innerHTML = `⏳ Need more entropy... ${entropyBytes.length}/256 bytes. Keep microphone running.`;
        statusDiv.innerHTML = `Collecting more entropy... ${entropyBytes.length}/256 bytes`;
        return;
    }
    
    randomKeyDiv.innerHTML = "Generating cryptographic key from grid entropy...";
    statusDiv.innerHTML = "Generating random key...";
    
    const entropyArray = new Uint8Array(entropyBytes);
    const hashBuffer = await crypto.subtle.digest('SHA-256', entropyArray);
    const hashArray = new Uint8Array(hashBuffer);
    
    const hexString = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
    randomKeyDiv.innerHTML = hexString;
    
    // Saveforencryption
    lastRandomKey = hexString;
    lastKeyBytes = hashArray;
    
    // ENCRYPTIONCARD 
    encryptCard.classList.remove('hidden');
    
    statusDiv.innerHTML = "Key generated! Now you can encrypt messages below.";
}


async function encryptWithENFKey() {
    if (!lastRandomKey || !lastKeyBytes) {
        statusDiv.innerHTML = 'Generate a random key first using the button above!';
        return;
    }
    
    const message = messageInput.value;
    if (!message) {
        statusDiv.innerHTML = 'Type a message to encrypt!';
        return;
    }
    
    statusDiv.innerHTML = ' Encrypting with ENF entropy key...';
    
    try {
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            lastKeyBytes,
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
        );
        
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encodedMessage = new TextEncoder().encode(message);
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            cryptoKey,
            encodedMessage
        );
        
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);
        
        const hexString = Array.from(combined).map(b => b.toString(16).padStart(2, '0')).join('');
        encryptedOutputDiv.innerHTML = hexString;
        lastEncryptedData = combined;
        
        statusDiv.innerHTML = 'Message encrypted with your ENF key!';
    } catch (error) {
        statusDiv.innerHTML = '❌ Encryption failed: ' + error.message;
    }
}

async function decryptWithENFKey() {
    if (!lastKeyBytes || !lastEncryptedData) {
        statusDiv.innerHTML = ' No encrypted message found! Encrypt something first.';
        return;
    }
    
    statusDiv.innerHTML = '🔓 Decrypting with ENF entropy key...';
    
    try {
        const iv = lastEncryptedData.slice(0, 12);
        const encryptedData = lastEncryptedData.slice(12);
        
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            lastKeyBytes,
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
        );
        
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            cryptoKey,
            encryptedData
        );
        
        const message = new TextDecoder().decode(decrypted);
        decryptedOutputDiv.innerHTML = message;
        statusDiv.innerHTML = ' Message decrypted successfully!';
    } catch (error) {
        statusDiv.innerHTML = '❌ Decryption failed: ' + error.message;
    }
}


function exportEntropy() {
    if (entropyBytes.length === 0) {
        statusDiv.innerHTML = ' No entropy collected yet!';
        return;
    }
    
    const exportData = {
        timestamp: new Date().toISOString(),
        entropyBytes: Array.from(entropyBytes),
        frequencyHistory: freqHistory.slice(-100),
        totalEntropy: entropyBytes.length,
        quality: qualityIndicatorSpan.innerHTML,
        source: "ENF Entropy Vault - Grid Frequency Fluctuations"
    };
    
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enf-entropy-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    statusDiv.innerHTML = 'Entropy exported for research!';
}

// CLIPBOARD
function copyToClipboard() {
    const keyText = randomKeyDiv.innerText;
    if (keyText && keyText !== '--' && !keyText.includes('Need') && !keyText.includes('Generating')) {
        navigator.clipboard.writeText(keyText);
        statusDiv.innerHTML = ' Key copied to clipboard!';
        setTimeout(() => {
            statusDiv.innerHTML = ' Microphone active! Listening for grid hum...';
        }, 2000);
    } else {
        statusDiv.innerHTML = ' Generate a key first before copying.';
    }
}


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


micBtn.addEventListener('click', enableMicrophone);
generateBtn.addEventListener('click', generateRandomKey);
exportBtn.addEventListener('click', exportEntropy);
copyBtn.addEventListener('click', copyToClipboard);
encryptBtn.addEventListener('click', encryptWithENFKey);
decryptBtn.addEventListener('click', decryptWithENFKey);
async function loadENFMLModel() {
    try {
        document.getElementById('mlQuality').innerHTML = '⏳';
        
       
        mlModel = await tf.loadLayersModel('web_model/model.json');
        console.log(' ML model loaded from ENF-WHU dataset');
        
        const response = await fetch('scaler_params.json');
        const scalerParams = await response.json();
        mlScalerMean = scalerParams.mean;
        mlScalerScale = scalerParams.scale;
        console.log(' Scaler loaded');
        
        mlReady = true;
        document.getElementById('mlQuality').innerHTML = 'Ready ';
        
    } catch (error) {
        console.error('ML load error:', error);
        document.getElementById('mlQuality').innerHTML = '⚠️';
        mlReady = false;
    }
}


async function predictEntropyQuality(freqHistory) {
    if (!mlReady || !mlModel || freqHistory.length < 24) {
        return 0.5;
    }
    
    try {
        const recent = freqHistory.slice(-24);
        const normalized = recent.map((val, i) => {
            const mean = mlScalerMean[i % mlScalerMean.length];
            const scale = mlScalerScale[i % mlScalerScale.length] || 0.0001;
            return (val - mean) / scale;
        });
        
        const input = tf.tensor2d([normalized]);
        const prediction = await mlModel.predict(input).data();
        const score = Math.min(1, Math.max(0, prediction[0]));
        lastMlScore = score;
        return score;
        
    } catch (error) {
        console.error('Prediction error:', error);
        return 0.5;
    }
}


function updateMLDisplay(score) {
    if (score === null || score === undefined) {
        document.getElementById('mlQuality').innerHTML = '--';
        return;
    }
    
    const percent = (score * 100).toFixed(0);
    document.getElementById('mlQuality').innerHTML = percent + '%';
    
    if (score > 0.6) {
        document.getElementById('mlQuality').style.color = '#00ff88';
    } else if (score > 0.4) {
        document.getElementById('mlQuality').style.color = '#ffaa00';
    } else {
        document.getElementById('mlQuality').style.color = '#ff6666';
    }
}
console.log('ENF Entropy Vault loaded - Click "Enable Microphone" to start');