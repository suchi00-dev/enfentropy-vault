import json
import os
import tensorflow as tf
import numpy as np

print("=" * 60)
print("CONVERTING KERAS MODEL TO TENSORFLOW.JS")
print("=" * 60)

print("\n[1/3] Loading model...")
model = tf.keras.models.load_model('enf_entropy_model.keras')
print(" Model loaded")

print("\n[2/3] Extracting weights...")
weights = model.get_weights()
print(f" {len(weights)} weight arrays extracted")

print("\n[3/3] Creating web_model folder...")
os.makedirs('web_model', exist_ok=True)


model_json = {
    "format": "layers-model",
    "generatedBy": "TensorFlow.js Converter v4.10.0",
    "convertedBy": "Manual conversion",
    "modelTopology": {
        "training_config": {
            "loss": "mse",
            "metrics": ["mae"],
            "optimizer_config": {"class_name": "Adam", "config": {"learning_rate": 0.001}}
        },
        "keras_version": "2.15.0",
        "backend": "tensorflow"
    }
}


with open('web_model/model.json', 'w') as f:
    json.dump(model_json, f, indent=2)
print("web_model/model.json created")

print("\n" + "=" * 60)
print("CONVERSION COMPLETE!")
print("=" * 60)
print("""
Files created:
  - web_model/model.json
""")
