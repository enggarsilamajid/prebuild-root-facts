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

  buildPrompt(vegetableName) {
    const prompts = {
      normal:
        `Write one short fun fact about ${vegetableName}.`,

      funny:
        `Write one funny fun fact about ${vegetableName}.`,

      professional:
        `Write one scientific fact about ${vegetableName}.`,

      casual:
        `Write one casual and interesting fact about ${vegetableName}.`,
    };

    return (
      prompts[this.currentTone] ||
      prompts.normal
    );
  }

  cleanGeneratedText(
    text,
    vegetableName,
  ) {
    if (!text) {
      return `${vegetableName} contains nutrients that are good for the body.`;
    }

    let cleaned = text.trim();

    cleaned = cleaned.replace(
      /\n/g,
      ' ',
    );

    cleaned = cleaned.trim();

    if (
      cleaned.length < 10
    ) {
      cleaned =
        `${vegetableName} is a nutritious vegetable that is good for health.`;
    }

    return cleaned;
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
      const prompt =
        this.buildPrompt(
          vegetableName,
        );

      const result =
        await this.generator(
          prompt,
          {
            max_new_tokens: 60,
            temperature: 0.7,
            top_p: 0.9,
            do_sample: true,
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
          vegetableName,
        );

      return generatedText;
    } catch (error) {
      console.error(
        'Generate fact error:',
        error,
      );

      return `${vegetableName} is rich in nutrients and beneficial for health.`;
    } finally {
      this.isGenerating = false;
    }
  }

  isReady() {
    return this.isModelLoaded;
  }
}
