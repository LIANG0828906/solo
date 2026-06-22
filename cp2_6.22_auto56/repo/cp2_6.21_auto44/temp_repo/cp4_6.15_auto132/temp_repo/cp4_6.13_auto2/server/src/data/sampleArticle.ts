export const sampleArticle = {
  title: "The Joy of Learning Languages",
  paragraphs: [
    {
      id: 1,
      content: "Learning a new language opens doors to countless opportunities. It is not merely about memorizing vocabulary or grammar rules; it is about embracing a new way of thinking and understanding the world. When you learn a language, you gain access to literature, music, films, and conversations that would otherwise remain inaccessible.",
      expanded: true
    },
    {
      id: 2,
      content: "Many people struggle with language learning because they approach it incorrectly. They spend hours drilling flashcards and memorizing word lists, yet they freeze up when it is time to speak. The key is immersion—surrounding yourself with the language in meaningful contexts. Read books that interest you, watch movies without subtitles, and practice speaking with native speakers whenever possible.",
      expanded: true
    },
    {
      id: 3,
      content: "Contextual learning is particularly effective. When you encounter a new word in a sentence or story, you remember it far better than when you see it in isolation. The brain naturally connects words to their surroundings, creating stronger neural pathways. This is why reading extensively is one of the most powerful language learning strategies.",
      expanded: true
    },
    {
      id: 4,
      content: "Technology has revolutionized language learning. Applications and online platforms provide interactive experiences that adapt to individual learning styles. However, these tools work best when complemented by real-world practice. Balance digital learning with genuine human interaction, and you will make remarkable progress.",
      expanded: true
    },
    {
      id: 5,
      content: "Ultimately, language learning is a journey, not a destination. There will be moments of frustration and self-doubt, but these are signs of growth. Every new word you learn, every conversation you have, brings you closer to fluency. Embrace the process, celebrate small victories, and remember that even native speakers continue learning new words throughout their lives.",
      expanded: true
    }
  ]
};

export type ArticleParagraph = typeof sampleArticle.paragraphs[0];
