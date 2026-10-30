import { getCultureMapUrl } from '../../assets/culture';
import { getDictionaryByLanguage } from '../../assets/dictionary';
import { getConversationsByLanguage } from '../../assets/conversations';

describe('content loaders', () => {
  it('only returns an interactive map for languages that configure one', () => {
    expect(getCultureMapUrl('dz')).toMatch(/^https:\/\//);
    expect(getCultureMapUrl('de')).toBeUndefined();
    expect(getCultureMapUrl('qu')).toBeUndefined();
  });

  it('exposes every dictionary entry with a target-language word', () => {
    for (const lang of ['dz', 'de', 'fr']) {
      const { entries } = getDictionaryByLanguage(lang);
      expect(entries.length).toBeGreaterThan(0);
      for (const e of entries) expect(typeof e.dz).toBe('string');
    }
  });

  it('exposes every conversation line with a target-language string', () => {
    const { categories } = getConversationsByLanguage('dz');
    expect(categories.length).toBeGreaterThan(0);
    for (const cat of categories)
      for (const cv of cat.conversations)
        for (const ex of cv.exchanges) expect(typeof ex.dzardzongke).toBe('string');
  });
});
