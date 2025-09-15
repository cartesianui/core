export enum KeyFormats {
  CAMEL = 'CAMEL',
  SNAKE = 'SNAKE',
  UPPER_SNAKE = 'UPPER_SNAKE',
  PASCAL = 'PASCAL',
  KEBAB = 'KEBAB',
  UPPER_KEBAB = 'UPPER_KEBAB'
}

export class ObjectUtils {
  
  // 🔑 single key conversion (from → to)
  static convertKey(key: string, from: KeyFormats, to: KeyFormats): string {
    const words = this.splitToWords(key, from);
    //console.log(`   splitToWords("${key}", ${from}) ->`, words);
    return this.buildFromWords(words, to);
  }

  static convertObjectKeys(obj: any, from: KeyFormats, to: KeyFormats): any {
    if (obj === null || obj === undefined) return obj;

    // If body is JSON string, parse it
    if (typeof obj === 'string') {
      try {
        const parsed = JSON.parse(obj);
        const converted = this.convertObjectKeys(parsed, from, to);
        return JSON.stringify(converted);
      } catch {
        return obj; // not JSON, leave it
      }
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.convertObjectKeys(item, from, to));
    } else if (typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => {
          const newKey = this.convertKey(k, from, to);
          // console.log(`🔑 "${k}" (${from} -> ${to}) => "${newKey}"`);
          return [newKey, this.convertObjectKeys(v, from, to)];
        })
      );
    }

    return obj;
  }

  // 🔒 rebuild words in target format
  private static buildFromWords(words: string[], to: KeyFormats): string {
    switch (to) {
      case KeyFormats.CAMEL:
        return words.map((w, i) => (i === 0 ? w : this.capitalize(w))).join('');
      case KeyFormats.PASCAL:
        return words.map(this.capitalize).join('');
      case KeyFormats.SNAKE:
        return words.join('_');
      case KeyFormats.UPPER_SNAKE:
        return words.join('_').toUpperCase();
      case KeyFormats.KEBAB:
        return words.join('-');
      case KeyFormats.UPPER_KEBAB:
        return words.join('-').toUpperCase();
      default:
        return words.join('');
    }
  }
  
  // 🔒 break down a string into words based on source format
  private static splitToWords(key: string, from: KeyFormats): string[] {
    switch (from) {
      case KeyFormats.SNAKE:
      case KeyFormats.UPPER_SNAKE:
        return key.toLowerCase().split('_');

      case KeyFormats.KEBAB:
      case KeyFormats.UPPER_KEBAB:
        return key.toLowerCase().split('-');

      case KeyFormats.CAMEL:
      case KeyFormats.PASCAL:
      default:
        return key
          .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // split before capitals
          .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // split ABCd → AB Cd
          .toLowerCase()
          .split(/[\s_\-]+/)
          .filter(Boolean);
    }
  }

  // 🔒 capitalize helper
  private static capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  // 🚀 convenience converters (when only target matters)
  static toCamel(key: string, from: KeyFormats = KeyFormats.SNAKE): string {
    return this.convertKey(key, from, KeyFormats.CAMEL);
  }
  static toPascal(key: string, from: KeyFormats = KeyFormats.SNAKE): string {
    return this.convertKey(key, from, KeyFormats.PASCAL);
  }
  static toSnake(key: string, from: KeyFormats = KeyFormats.CAMEL): string {
    return this.convertKey(key, from, KeyFormats.SNAKE);
  }
  static toUpperSnake(key: string, from: KeyFormats = KeyFormats.CAMEL): string {
    return this.convertKey(key, from, KeyFormats.UPPER_SNAKE);
  }
  static toKebab(key: string, from: KeyFormats = KeyFormats.CAMEL): string {
    return this.convertKey(key, from, KeyFormats.KEBAB);
  }
  static toUpperKebab(key: string, from: KeyFormats = KeyFormats.CAMEL): string {
    return this.convertKey(key, from, KeyFormats.UPPER_KEBAB);
  }
}
