import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgpu';

export class DetectionService {
  constructor() {
    this.model = null;
    this.labels = [];
    this.config = null;
    this.backend = null;
  }

  async loadModel(onProgress = null) {
    try {
      if (navigator.gpu) {
        await tf.setBackend('webgpu');
        this.backend = 'webgpu';
      } else {
        await tf.setBackend('webgl');
        this.backend = 'webgl';
      }

      await tf.ready();

      if (onProgress) {
        onProgress(15, `Backend aktif: ${this.backend}`);
      }

      const [model, metadata] = await Promise.all([
        tf.loadLayersModel('/model/model.json', {
          onProgress: (fraction) => {
            if (onProgress) {
              const percent = Math.round(15 + (fraction * 70));
              onProgress(percent, `Memuat model deteksi... ${percent}%`);
            }
          },
        }),
        fetch('/model/metadata.json').then((response) => response.json()),
      ]);

      this.model = model;
      this.labels = metadata.labels || [];
      this.config = metadata;

      if (onProgress) {
        onProgress(100, 'Model AI Siap');
      }

      return {
        success: true,
        backend: this.backend,
        labels: this.labels,
      };
    } catch (error) {
      console.error('Gagal memuat model:', error);

      throw new Error('Model deteksi gagal dimuat');
    }
  }

  async predict(imageElement) {
    if (!this.model) {
      throw new Error('Model belum dimuat');
    }

    try {
      const prediction = tf.tidy(() => {
        const imageTensor = tf.browser
          .fromPixels(imageElement)
          .resizeBilinear([224, 224])
          .toFloat()
          .div(255.0)
          .expandDims(0);

        const predictionTensor = this.model.predict(imageTensor);

        return predictionTensor.dataSync();
      });

      const scores = Array.from(prediction);

      let highestScore = 0;
      let highestIndex = 0;

      scores.forEach((score, index) => {
        if (score > highestScore) {
          highestScore = score;
          highestIndex = index;
        }
      });

      return {
        className: this.labels[highestIndex],
        score: highestScore,
        confidence: Math.round(highestScore * 100),
        isValid: highestScore >= 0.7,
        backend: this.backend,
      };
    } catch (error) {
      console.error('Prediksi gagal:', error);

      return null;
    }
  }

  isLoaded() {
    return this.model !== null;
  }
}