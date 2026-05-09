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
          'Preparing AI generator...',
        );
      }

      this.generator = await pipeline(
        'text2text-generation',
        'Xenova/flan-t5-small',
      );

      this.isModelLoaded = true;

      if (onProgress) {
        onProgress(
          100,
          'Fun Fact Generator Ready',
        );
      }

      return true;
    } catch (error) {
      console.error(
        'AI GENERATOR ERROR:',
        error,
      );

      throw new Error(
        'Failed to load AI generator',
      );
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
        'Beetroot contains antioxidants that help support heart health.',

      Paprika:
        'Paprika is rich in vitamin C and antioxidants.',

      Cabbage:
        'Cabbage is low in calories and high in fiber.',

      Carrot:
        'Carrots contain beta-carotene which is good for eye health.',

      Cauliflower:
        'Cauliflower is a nutritious vegetable rich in fiber and vitamins.',

      Chilli:
        'Chilli peppers contain capsaicin which creates their spicy flavor.',

      Corn:
        'Corn is a popular source of carbohydrates and energy.',

      Cucumber:
        'Cucumbers contain a lot of water which helps hydration.',

      eggplant:
        'Eggplants contain antioxidants that are good for the body.',

      Garlic:
        'Garlic has natural antibacterial properties.',

      Ginger:
        'Ginger is commonly used to help warm the body and aid digestion.',

      Lettuce:
        'Lettuce is often used fresh in salads and sandwiches.',

      Onion:
        'Onions contain natural compounds beneficial for health.',

      Peas:
        'Peas are rich in plant-based protein and fiber.',

      Potato:
        'Potatoes are a common source of carbohydrates.',

      Turnip:
        'Turnips are root vegetables rich in vitamin C and fiber.',

      Soybean:
        'Soybeans are widely used to make nutritious foods.',

      Spinach:
        'Spinach is famous for its iron content.',
    };

    return (
      facts[vegetableName] ||
      `${vegetableName} is a nutritious vegetable.`
    );
  }

  buildPrompt(
    vegetableName,
    baseFact,
  ) {
    const toneInstruction = {
      normal:
        'Write a short fun fact.',

      funny:
        'Write a short funny fun fact.',

      professional:
        'Write a short scientific fact.',

      casual:
        'Write a short casual and interesting fact.',
    };

    return `
Vegetable: ${vegetableName}

Reference Fact:
${baseFact}

Instruction:
${toneInstruction[this.currentTone]}

Rules:
- Keep the response related to the vegetable.
- Do not talk about unrelated topics.
- Use only one sentence.
- Maximum 25 words.
`;
  }

  cleanGeneratedText(
    text,
  ) {
    return text
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  isRelevant(
    text,
    vegetableName,
  ) {
    const lower =
      text.toLowerCase();

    const keywords = [
      vegetableName.toLowerCase(),
      'vegetable',
      'vitamin',
      'fiber',
      'nutrition',
      'health',
      'antioxidant',
      'protein',
      'energy',
      'carbohydrate',
    ];

    return keywords.some(
      (keyword) =>
        lower.includes(keyword),
    );
  }

  async generateFacts(
    vegetableName,
  ) {
    if (
      this.isGenerating
    ) {
      return null;
    }

    this.isGenerating = true;

    try {
      const baseFact =
        this.getBaseFact(
          vegetableName,
        );

      const prompt =
        this.buildPrompt(
          vegetableName,
          baseFact,
        );

      const result =
        await this.generator(
          prompt,
          {
            max_new_tokens: 40,
            temperature: 0.4,
            top_p: 0.8,
            do_sample: false,
          },
        );

      let generatedText =
        result?.[0]
          ?.generated_text || '';

      generatedText =
        generatedText
          .replace(prompt, '')
          .trim();

      generatedText =
        this.cleanGeneratedText(
          generatedText,
        );

      if (
        !generatedText ||
        generatedText.length <
          10 ||
        !this.isRelevant(
          generatedText,
          vegetableName,
        )
      ) {
        return baseFact;
      }

      return generatedText;
    } catch (error) {
      console.error(
        'Generate fact error:',
        error,
      );

      return this.getBaseFact(
        vegetableName,
      );
    } finally {
      this.isGenerating = false;
    }
  }

  isReady() {
    return this.isModelLoaded;
  }
}
