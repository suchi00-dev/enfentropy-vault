# ENF Entropy Vault

> Turn the invisible hum of the power grid into cryptographic randomness — using nothing more than your laptop microphone.

---

## What is ENF Entropy Vault?

**ENF Entropy Vault** is a browser-based **True Random Number Generator (TRNG)** that harvests entropy from tiny fluctuations in the electrical grid's **50Hz/60Hz frequency**.

Instead of relying solely on deterministic algorithms, this project listens to the faint electrical hum around us and transforms those unpredictable variations into cryptographic keys.

No hardware tokens.

No cloud services.

No installations.

Just your browser.

---

## Features

* Captures ambient 50Hz/60Hz ENF signals using your microphone
* Extracts entropy from real-world frequency fluctuations
* Generates cryptographic **256-bit keys**
* Uses **SHA-256** for entropy conditioning
* Demonstrates **AES-256-GCM encryption**
* Performs randomness validation tests
* Includes entropy quality estimation using TensorFlow.js
* Runs entirely inside the browser

---

## How It Works

```text
Power Grid Hum
       ↓
 Laptop Microphone
       ↓
Frequency Detection
       ↓
Entropy Extraction
       ↓
    SHA-256
       ↓
 256-bit Random Key
       ↓
AES Encryption Demo
```

---

## Live Demo

### Main Application

https://suchi00-dev.github.io/enfentropy-vault/

### Debug Tool

https://suchi00-dev.github.io/enfentropy-vault/debug.html

---

## Quick Start

### Clone the Repository

```bash
git clone https://github.com/suchi00-dev/enfentropy-vault.git
cd enfentropy-vault
```

### Run Locally

```bash
python -m http.server 8000
```

Open your browser:

```text
http://localhost:8000
```

---

## Usage

1. Open the application.
2. Allow microphone access.
3. Place your laptop near a wall outlet or electrical appliance.
4. Observe the detected frequency (~50Hz or ~60Hz).
5. Wait while entropy is collected.
6. Generate a 256-bit key.
7. Use the generated key for the encryption demo.

---

## Why This Is Interesting

Most software relies on **pseudo-random number generators (PRNGs)**, which produce randomness from deterministic seeds.

ENF Entropy Vault explores an alternative approach:

> Using naturally occurring fluctuations in the power grid as a physical entropy source.

Every second, millions of electrical devices switching on and off influence the grid frequency ever so slightly.

Those tiny deviations become the randomness.

---

## Project Structure

```text
enfentropy-vault/
├── index.html
├── script.js
├── debug.html
├── styles.css
├── README.md
└── assets/
```

---

## Technical Overview

| Component               | Purpose                          |
| ----------------------- | -------------------------------- |
| Microphone Input        | Captures ambient ENF signals     |
| Zero-Crossing Detection | Estimates grid frequency         |
| Entropy Extractor       | Converts fluctuations into bytes |
| SHA-256                 | Conditions entropy               |
| AES-256-GCM             | Encryption demonstration         |
| TensorFlow.js           | Estimates entropy quality        |

---

## Randomness Validation

Generated output is evaluated using statistical checks such as:

* Monobit Test
* Runs Test
* Chi-Square Test

These tests help verify that the extracted entropy exhibits desirable random properties.

---

## Research Inspiration

This project draws inspiration from published work on:

* Electrical Network Frequency (ENF)
* Random number generation
* Multimedia forensics
* Entropy extraction techniques

### Machine Learning Dataset

The machine learning component of **ENF Entropy Vault** was trained using the **ENF-WHU Dataset**, a publicly available collection of real-world Electrical Network Frequency recordings developed to support ENF research.

The dataset contains authentic ENF signals captured from power grid environments and provides valuable data for signal analysis, forensics, and entropy-related studies.

Dataset Repository:

https://github.com/ghua-ac/ENF-WHU-Dataset

The ENF-WHU Dataset enabled the development of the TensorFlow.js-based entropy quality estimator included in this project.

This work serves as both an educational experiment and a practical demonstration of unconventional entropy sources.

---

## Disclaimer

This project is intended for **research, education, and experimentation**.

Although cryptographic primitives and statistical tests are used, this implementation has **not undergone formal security review** and should not be considered a drop-in replacement for production-grade hardware security modules.

---

## Author

**Suchi00-dev**

GitHub:
https://github.com/suchi00-dev

Repository:
https://github.com/suchi00-dev/enfentropy-vault

---
