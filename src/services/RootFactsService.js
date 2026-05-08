import { pipeline, env } from '@huggingface/transformers';
import { TONE_CONFIG } from '../utils/config.js';

env.allowLocalModels = true;
env.useBrowserCache = true;

export class RootFactsService {
  constructor() {
    this.generator = null;
    this.isModelLoaded = false;
    this.isGenerating = false;
    this.config = null;
    this.currentBackend = null;
    this.currentTone = TONE_CONFIG.defaultTone;
  }

  async loadModel(onProgress = null) {
    try {
      if (navigator.gpu) {
        this.currentBackend = 'webgpu';
        env.backends.onnx.wasm.proxy = false;
      } else {
        this.currentBackend = 'webgl';
      }

      if (onProgress) {
        onProgress(10, 'Menyiapkan model AI...');
      }

      this.generator = await pipeline(
        'text-generation',
        'Xenova/distilgpt2',
        {
          progress_callback: (progress) => {
            if (!onProgress) return;

            const value = Math.round((progress.progress || 0) * 100);

            onProgress(
              value,
              `Memuat model fakta AI... ${value}%`,
            );
          },
        },
      );

      this.isModelLoaded = true;

      if (onProgress) {
        onProgress(100, 'Generator Fakta Siap');
      }

      return {
        success: true,
        backend: this.currentBackend,
      };
    } catch (error) {
      console.error('Gagal memuat AI generator:', error);

      throw new Error('Generator fakta gagal dimuat');
    }
  }

  setTone(tone) {
    const availableTone = TONE_CONFIG.availableTones.find(
      (item) => item.value === tone,
    );

    if (availableTone) {
      this.currentTone = tone;
    }
  }

  buildPrompt(vegetableName) {
    const prompts = {
      normal: `Berikan satu fun fact singkat tentang sayuran ${vegetableName}.`,
      funny: `Berikan fun fact lucu dan menghibur tentang sayuran ${vegetableName}.`,
      professional: `Berikan fakta ilmiah singkat dan profesional tentang sayuran ${vegetableName}.`,
      casual: `Ceritakan fakta santai dan menarik tentang sayuran ${vegetableName}.`,
    };

    return prompts[this.currentTone] || prompts.normal;
  }

  async generateFacts(vegetableName) {
    if (!this.generator) {
      throw new Error('Generator AI belum siap');
    }

    if (this.isGenerating) {
      return null;
    }

    this.isGenerating = true;

    try {
      const prompt = this.buildPrompt(vegetableName);

      const result = await this.generator(prompt, {
        max_new_tokens: 60,
        temperature: 0.8,
        top_p: 0.9,
        do_sample: true,
        repetition_penalty: 1.2,
      });

      let generatedText = result?.[0]?.generated_text || '';

      generatedText = generatedText.replace(prompt, '').trim();

      if (!generatedText) {
        generatedText = `${vegetableName} memiliki banyak nutrisi penting yang baik untuk tubuh.`;
      }

      return generatedText;
    } catch (error) {
      console.error('Gagal menghasilkan fakta:', error);

      return 'Tidak dapat menghasilkan fakta menarik saat ini.';
    } finally {
      this.isGenerating = false;
    }
  }

  isReady() {
    return this.isModelLoaded && this.generator !== null;
  }
}