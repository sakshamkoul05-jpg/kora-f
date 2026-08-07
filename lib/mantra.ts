/**
 * Om mani padme hum, in Tibetan Uchen script.
 *
 * Kept in one place, written as explicit escapes rather than pasted glyphs, so
 * the exact codepoints can be audited without depending on what any given
 * editor or terminal renders. If someone needs to check this, check the
 * escapes — not the comment.
 *
 *   ཨོཾ    U+0F68 ཨ A · U+0F7C ོ vowel O · U+0F7E ཾ rjes su nga ro (anusvara)
 *   ་      U+0F0B tsheg (syllable separator)
 *   མ      U+0F58 MA
 *   ་
 *   ཎི     U+0F4E NNA · U+0F72 ི vowel I
 *   ་
 *   པདྨེ   U+0F54 PA · U+0F51 DA · U+0FA8 ྨ subjoined MA · U+0F7A ེ vowel E
 *   ་
 *   ཧཱུྃ    U+0F67 HA · U+0F71 ཱ vowel AA · U+0F74 ུ vowel U · U+0F83 ྃ nyi zla naa da
 *
 * The two clusters that need real shaping support are པདྨེ (the subjoined ma
 * stacks *under* da) and ཧཱུྃ (vowel signs stack under and the nasal above).
 * If the font is missing or shaping fails, those are what break — which is why
 * every consumer must check `isTibetanReady()` before drawing this, and fall
 * back to no script at all rather than to broken script.
 */
export const OM_MANI_PADME_HUM =
  "ཨོཾ་" + // ཨོཾ་
  "མ་" + // མ་
  "ཎི་" + // ཎི་
  "པདྨེ་" + // པདྨེ་
  "ཧཱུྃ"; // ཧཱུྃ

export const MANTRA_TRANSLITERATION = "oṃ maṇi padme hūṃ";

export const TIBETAN_FAMILY = '"Noto Serif Tibetan"';

const LOAD_SPEC = `400 21px ${TIBETAN_FAMILY}`;

/**
 * Fetch the Tibetan face, then report whether it can genuinely render the
 * mantra.
 *
 * The explicit `fonts.load()` is not optional. Browsers fetch a face only when
 * something on the page already needs it — but nothing here draws Uchen until
 * this returns true, so checking alone deadlocks: the face sits `unloaded`
 * forever and the stones never carve. Ask for it, wait, then check.
 *
 * Callers must not draw Uchen until this resolves true. Unshaped Tibetan is
 * meaningless to anyone who reads it, and a plain stone is honest where a
 * garbled one is not.
 */
export async function ensureTibetan(): Promise<boolean> {
  if (typeof document === "undefined" || !("fonts" in document)) return false;
  try {
    await document.fonts.load(LOAD_SPEC, OM_MANI_PADME_HUM);
    return document.fonts.check(LOAD_SPEC, OM_MANI_PADME_HUM);
  } catch {
    return false;
  }
}
