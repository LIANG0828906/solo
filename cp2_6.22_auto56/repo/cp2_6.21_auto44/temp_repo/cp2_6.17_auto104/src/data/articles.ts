export const articles: string[] = [
  `The quick brown fox jumps over the lazy dog. This pangram sentence contains every letter of the English alphabet at least once. Typing practice helps improve both speed and accuracy over time. Many people find that regular practice sessions of just ten minutes per day can lead to significant improvements in their typing skills. The key is consistency and focus on proper technique rather than pure speed. Remember to keep your fingers on the home row and use all ten fingers for optimal results.`,

  `Programming is the art of telling a computer what to do through a series of instructions. Every line of code is a step toward solving a problem or creating something new. The best programmers are not just those who write code quickly, but those who write clear, maintainable code that others can understand and build upon. Learning to program requires patience, practice, and a willingness to make mistakes and learn from them. Each bug you fix makes you a better developer.`,

  `The ocean covers more than seventy percent of the Earth's surface and contains an incredible diversity of life. From the smallest plankton to the largest whales, marine ecosystems are complex and interconnected. Coral reefs, often called the rainforests of the sea, support about twenty-five percent of all marine species despite covering less than one percent of the ocean floor. Protecting our oceans is vital for the health of our planet and future generations.`,

  `Artificial intelligence has transformed many aspects of modern life, from how we search for information to how we communicate with each other. Machine learning algorithms can now recognize patterns in data that would be impossible for humans to detect manually. While AI offers tremendous benefits, it also raises important ethical questions about privacy, bias, and the future of work. Responsible development and deployment of AI systems will be crucial as this technology continues to evolve.`,

  `Reading books is one of the most effective ways to expand your knowledge and imagination. A good book can transport you to different worlds, introduce you to new ideas, and help you understand perspectives different from your own. Studies have shown that regular reading improves vocabulary, enhances critical thinking skills, and even reduces stress. Whether you prefer fiction or non-fiction, the simple act of opening a book can be a gateway to endless possibilities and personal growth.`,

  `Space exploration has captivated human imagination for centuries. From the first observations of the night sky to landing on the moon and sending probes to distant planets, our understanding of the universe continues to grow. The International Space Station orbits our planet, serving as a laboratory for scientific research and a symbol of international cooperation. As we look toward Mars and beyond, the spirit of discovery drives us to push the boundaries of what is possible.`,
];

export function getRandomArticle(): string {
  const index = Math.floor(Math.random() * articles.length);
  return articles[index];
}
