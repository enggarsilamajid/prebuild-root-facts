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
        'Beetroots are rich in natural antioxidants which are good for body health.',

      Paprika:
        'Paprika has a very high vitamin C content.',

      Cabbage:
        'Cabbage is low in calories but rich in vitamins and fiber.',

      Carrot:
        'Carrots are famous for their beta-carotene content which is good for the eyes.',

      Cauliflower:
        'Cauliflower is rich in fiber and essential nutrients.',

      Chilli:
        'Chili contains capsaicin which gives it a spicy taste.',

      Corn:
        'Corn is a source of energy because it is rich in carbohydrates.',

      Cucumber:
        'Cucumbers have a high water content which refreshes the body.',

      Eggplant:
        'Eggplant contains antioxidants which are good for health.',

      Garlic:
        'Garlic is known to have natural antibacterial benefits.',

      Ginger:
        'Ginger is often used to help warm the body.',

      Lettuce:
        'Lettuce is often used as a fresh vegetable in salads.',

      Onion:
        'Onions contain natural compounds that are good for the body.',

      Peas:
        'Peas are rich in vegetable protein and fiber.',

      Potato:
        'Potatoes are a popular source of carbohydrates.',

      Turnip:
        'Turnips or radishes are rich in vitamins and low in calories.',

      Soybean:
        'Soybeans are the main ingredient in many nutritious foods.',

      Spinach:
        'Spinach is known for its iron content.',
    };

    return (
      facts[vegetableName] ||
      `${vegetableName} is a vegetable that is good for body health.`
    );
  }

  applyTone(text) {
    switch (this.currentTone) {
    case 'funny':
      return `😄 Fun Fact: ${text}`;

    case 'professional':
      return `📘 Scientific Fact: ${text}`;

    case 'casual':
      return `🌱 Did you know? ${text}`;

    default:
      return `✨ Interesting Facts: ${text}`;
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
        `tell me about vegetables ${baseFact}`;

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
