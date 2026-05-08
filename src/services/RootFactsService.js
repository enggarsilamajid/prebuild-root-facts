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
      this.currentBackend =
        navigator.gpu ? 'webgpu' : 'cpu';

      if (onProgress) {
        onProgress(
          30,
          'Menyiapkan AI generator...',
        );
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
        onProgress(
          100,
          'Generator Fakta Siap',
        );
      }

      return true;
    } catch (error) {
      console.error(error);

      this.isModelLoaded = true;

      return true;
    }
  }

  setTone(tone) {
    const availableTone =
      TONE_CONFIG.availableTones.find(
        (item) => item.value === tone,
      );

    if (availableTone) {
      this.currentTone = tone;
    }
  }

  getBaseFact(vegetableName) {
    const facts = {
      Beetroot:
        'Bit kaya antioksidan alami yang baik untuk kesehatan tubuh.',

      Paprika:
        'Paprika memiliki kandungan vitamin C yang sangat tinggi.',

      Cabbage:
        'Kubis rendah kalori tetapi kaya vitamin dan serat.',

      Carrot:
        'Wortel terkenal karena kandungan beta-karoten yang baik untuk mata.',

      Cauliflower:
        'Kembang kol kaya serat dan nutrisi penting.',

      Chilli:
        'Cabai mengandung capsaicin yang memberikan rasa pedas.',

      Corn:
        'Jagung menjadi sumber energi karena kaya karbohidrat.',

      Cucumber:
        'Mentimun memiliki kandungan air tinggi yang menyegarkan tubuh.',

      eggplant:
        'Terong mengandung antioksidan yang baik untuk kesehatan.',

      Garlic:
        'Bawang putih dikenal memiliki manfaat antibakteri alami.',

      Ginger:
        'Jahe sering digunakan untuk membantu menghangatkan tubuh.',

      Lettuce:
        'Selada sering digunakan sebagai sayuran segar dalam salad.',

      Onion:
        'Bawang mengandung senyawa alami yang baik untuk tubuh.',

      Peas:
        'Kacang polong kaya protein nabati dan serat.',

      Potato:
        'Kentang merupakan sumber karbohidrat yang populer.',

      Turnip:
        'Turnip atau lobak kaya vitamin dan rendah kalori.',

      Soybean:
        'Kedelai menjadi bahan utama banyak makanan bergizi.',

      Spinach:
        'Bayam terkenal karena kandungan zat besinya.',
    };

    return (
      facts[vegetableName] ||
      `${vegetableName} merupakan sayuran yang baik untuk kesehatan tubuh.`
    );
  }

  applyTone(text) {
    switch (this.currentTone) {
    case 'funny':
      return `😄 Fun Fact: ${text}`;

    case 'professional':
      return `📘 Fakta Ilmiah: ${text}`;

    case 'casual':
      return `🌱 Tahukah kamu? ${text}`;

    default:
      return `✨ Fakta Menarik: ${text}`;
    }
  }

  async generateFacts(vegetableName) {
    if (this.isGenerating) {
      return null;
    }

    this.isGenerating = true;

    try {
      const baseFact =
        this.getBaseFact(
          vegetableName,
        );

      if (!this.generator) {
        return this.applyTone(
          baseFact,
        );
      }

      const prompt =
        `deskripsikan sayuran ${baseFact}`;

      const result =
        await this.generator(
          prompt,
          {
            max_new_tokens: 40,
            temperature: 0.5,
            top_p: 0.8,
            do_sample: false,
          },
        );

      let generatedText =
        result?.[0]?.generated_text || '';

      generatedText =
        generatedText
          .replace(prompt, '')
          .trim();

      if (
        !generatedText ||
        generatedText.length < 10
      ) {
        generatedText = baseFact;
      }

      return this.applyTone(
        generatedText,
      );
    } catch (error) {
      console.error(error);

      return this.applyTone(
        this.getBaseFact(
          vegetableName,
        ),
      );
    } finally {
      this.isGenerating = false;
    }
  }

  isReady() {
    return this.isModelLoaded;
  }
}
