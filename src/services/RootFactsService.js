import { pipeline, env } from '@huggingface/transformers';
import { TONE_CONFIG } from '../utils/config.js';

env.allowLocalModels = false;
env.useBrowserCache = true;

export class RootFactsService {
  constructor() {
    this.generator = null;
    this.isModelLoaded = false;
    this.isGenerating = false;
    this.currentBackend = 'cpu';
    this.currentTone = TONE_CONFIG.defaultTone;
  }

  async loadModel(onProgress = null) {
    try {
      this.currentBackend = navigator.gpu ? 'webgpu' : 'cpu';

      if (onProgress) {
        onProgress(30, 'Menyiapkan AI generator...');
      }

      try {
        this.generator = await pipeline(
          'text2text-generation',
          'Xenova/flan-t5-small',
        );
      } catch (error) {
        console.warn(
          'Model AI online tidak tersedia, menggunakan fallback lokal.',
        );
      }

      this.isModelLoaded = true;

      if (onProgress) {
        onProgress(100, 'Generator Fakta Siap');
      }

      return true;
    } catch (error) {
      console.error('DETAIL ERROR AI:', error);

      this.isModelLoaded = true;

      if (onProgress) {
        onProgress(100, 'Generator Fakta Siap');
      }

      return true;
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
      normal:
        `Berikan satu fakta menarik singkat tentang ${vegetableName}.`,

      funny:
        `Berikan fakta lucu tentang ${vegetableName} dalam satu kalimat.`,

      professional:
        `Berikan fakta ilmiah singkat tentang ${vegetableName}.`,

      casual:
        `Ceritakan fakta santai dan menarik tentang ${vegetableName}.`,
    };

    return prompts[this.currentTone] || prompts.normal;
  }

  async generateFacts(vegetableName) {
    if (this.isGenerating) {
      return null;
    }

    this.isGenerating = true;

    try {
      const fallbackFacts = {
        Carrot:
          'Wortel kaya beta-karoten yang baik untuk kesehatan mata.',

        Potato:
          'Kentang mengandung karbohidrat yang menjadi sumber energi tubuh.',

        Onion:
          'Bawang memiliki senyawa alami yang sering digunakan dalam pengobatan tradisional.',

        Garlic:
          'Bawang putih dikenal memiliki aroma kuat dan manfaat antibakteri.',

        Cabbage:
          'Kubis rendah kalori tetapi kaya vitamin C.',

        Spinach:
          'Bayam terkenal karena kandungan zat besinya.',

        Corn:
          'Jagung termasuk sumber karbohidrat populer di berbagai negara.',

        Cucumber:
          'Mentimun memiliki kandungan air tinggi yang membantu menjaga hidrasi tubuh.',

        Cauliflower:
          'Kembang kol kaya serat dan vitamin yang baik untuk pencernaan.',

        Paprika:
          'Paprika memiliki kandungan vitamin C yang sangat tinggi.',
      };

      if (!this.generator) {
        return (
          fallbackFacts[vegetableName] ||
          `${vegetableName} merupakan sayuran yang baik untuk kesehatan tubuh.`
        );
      }

      const prompt = this.buildPrompt(vegetableName);

      const result = await this.generator(prompt, {
        max_new_tokens: 50,
        temperature: 0.7,
        top_p: 0.9,
        do_sample: true,
      });

      const generatedText =
        result?.[0]?.generated_text ||
        fallbackFacts[vegetableName] ||
        `${vegetableName} kaya nutrisi penting.`;

      return generatedText;
    } catch (error) {
      console.error('Generate fact error:', error);

      return `${vegetableName} merupakan sayuran yang baik untuk kesehatan tubuh.`;
    } finally {
      this.isGenerating = false;
    }
  }

  isReady() {
    return this.isModelLoaded;
  }
}