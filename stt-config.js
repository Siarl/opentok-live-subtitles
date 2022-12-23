const STT_DEFAULT_ENCODING = 'LINEAR16';
const STT_DEFAULT_SAMPLE_RATE = 44100;
const STT_INTERIM_RESULTS = true;
const STT_MODEL_CONFIGS = {
  'nl-NL': {
    languageCode: 'nl-NL',
    model: 'latest_long',
    profanityFilter: true,
    enableAutomaticPunctuation: true,
  },
  'en-US': {
    languageCode: 'en-US',
    model: 'latest_long',
    profanityFilter: true,
    enableAutomaticPunctuation: true,
  },
  'de-DE': {
    languageCode: 'de-DE',
    model: 'latest_long',
    profanityFilter: true,
    enableAutomaticPunctuation: true,
  },
  'fr-FR': {
    languageCode: 'fr-FR',
    model: 'latest_long',
    profanityFilter: true,
    enableAutomaticPunctuation: true,
  },
  'tr-TR': {
    languageCode: 'tr-TR',
    model: 'default',
    profanityFilter: true,
    enableAutomaticPunctuation: true,
  },
  'es-ES': {
    languageCode: 'es-ES',
    model: 'latest_long',
    profanityFilter: true,
    enableAutomaticPunctuation: true,
  },
  'it-IT': {
    languageCode: 'it-IT',
    model: 'latest_long',
    profanityFilter: true,
    enableAutomaticPunctuation: true,
  },
}
const STT_DEFAULT_MODEL_CONFIG = STT_MODEL_CONFIGS['nl-NL'];

module.exports = {
  STT_DEFAULT_ENCODING,
  STT_DEFAULT_SAMPLE_RATE,
  STT_DEFAULT_MODEL_CONFIG,
  STT_MODEL_CONFIGS,
  STT_INTERIM_RESULTS
}
