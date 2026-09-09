export const SUPPORTED_LANGUAGES = ['es', 'en'];

export function getLanguageLabel(lang: string): string {
  try {
    const label = new Intl.DisplayNames([lang], { type: 'language' }).of(lang) ?? lang;
    return label.charAt(0).toUpperCase() + label.slice(1);
  } catch {
    return lang;
  }
}
