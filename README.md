# ⚡ ENF Entropy Vault

## True Random Numbers from the 50/60Hz Hum in Your Walls

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Made with JavaScript](https://img.shields.io/badge/Made%20with-JavaScript-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-4.15-orange.svg)](https://www.tensorflow.org/js)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-success.svg)](https://suchi00-dev.github.io/enfentropy-vault/)

> *"The hum from your wall outlet can generate cryptographically secure random numbers."*

---

## 📖 What is This?

**ENF Entropy Vault** is a browser-based True Random Number Generator (TRNG) that uses the **50Hz/60Hz hum from electrical wall outlets** as a source of physical randomness.

Instead of relying on mathematical formulas (pseudo-random generators) or expensive hardware (traditional TRNGs), this system:

1. **Listens** to the faint 50/60Hz hum from your wall outlet through your laptop's microphone
2. **Extracts** tiny, unpredictable frequency fluctuations caused by millions of people using electricity
3. **Converts** these fluctuations into random bytes using zero-crossing detection
4. **Hashes** them with SHA-256 to produce cryptographically secure 256-bit keys

**No special hardware. No cloud dependencies. Just your laptop and a wall outlet.**

---

## 🎯 Why Does This Matter?

| Problem | Traditional Solutions | Our Solution |
|---------|---------------------|--------------|
| Most "random" numbers are actually pseudo-random | PRNGs require a secret seed | ENF provides true physical randomness |
| True randomness requires expensive hardware | Hardware TRNGs cost $100-$1000 | Uses your existing laptop microphone |
| Randomness beacons require internet | Cloud-based entropy sources | Works offline, locally in your browser |
| Attacks on PRNGs are common (Netscape, OpenSSL) | Software fixes are reactive | ENF entropy is physically unpredictable |

**The 50Hz hum is everywhere, constantly fluctuating, and inherently random.** This project proves you can harness it.

---

## 🚀 Live Demo

**Try it now:** [https://suchi00-dev.github.io/enfentropy-vault/](https://suchi00-dev.github.io/enfentropy-vault/)

**Debug Tool:** [https://suchi00-dev.github.io/enfentropy-vault/debug.html](https://suchi00-dev.github.io/enfentropy-vault/debug.html)

---

## 📊 How It Works
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ Wall │ │ Laptop │ │ Zero │ │ Entropy │ │ SHA-256 │ │
│ │ Outlet │───▶│ Mic │───▶│ Crossing │───▶│ Bytes │───▶│ Hash │ │
│ │ 50Hz │ │ │ │ │ │ │ │ │ │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│ │ │ │ │ │ │
│ ▼ ▼ ▼ ▼ ▼ │
│ Physical Audible Frequency Random 256-bit │
│ Hum (50Hz) Signal Detection Bytes Key │
│ │
└─────────────────────────────────────────────────────────────────────────────────────┘


### Step-by-Step:

| Step | What Happens | Why It Matters |
|------|--------------|----------------|
| **1. Capture** | Microphone listens to wall outlet hum | ENF is embedded in ambient audio |
| **2. Detect** | Zero-crossing algorithm extracts 50Hz frequency | Isolates the grid signal from noise |
| **3. Fluctuate** | Tracks tiny variations (49.98Hz → 50.02Hz) | These fluctuations ARE the entropy |
| **4. Harvest** | Converts fluctuations into random bytes | Each byte contains ~2-4 bits of entropy |
| **5. Hash** | SHA-256 mixes entropy into uniform key | Cryptographic smoothing ensures quality |
| **6. Validate** | NIST monobit test confirms randomness | Statistical proof of randomness |

---

## 📁 Repository Structure
enfentropy-vault/
├── index.html # Main web application
├── script.js # ENF detection + RNG logic
├── debug.html # Microphone diagnostic tool
├── styles.css # UI styling
├── README.md # This file
└── assets/ # (Optional) Images and diagrams


---

## 🛠️ Run Locally

### Prerequisites
- Google Chrome (recommended)
- Python 3.x (for local server)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/suchi00-dev/enfentropy-vault.git
cd enfentropy-vault

# 2. Start a local server
python -m http.server 8000

# 3. Open Chrome and go to
http://localhost:8000

---

## 🛠️ Run Locally

### Prerequisites
- Google Chrome (recommended)
- Python 3.x (for local server)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/suchi00-dev/enfentropy-vault.git
cd enfentropy-vault

# 2. Start a local server
python -m http.server 8000

# 3. Open Chrome and go to
http://localhost:8000


