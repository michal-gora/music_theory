/**
 * score-tracker.js
 * Reusable correct/wrong counter display. Knows nothing about quizzes,
 * scales or chords - just tracks two numbers and renders them, so it
 * could back any future quiz type without changes.
 */

export function createScoreTracker(container) {
  container.innerHTML = '';
  container.classList.add('score-tracker');

  let correct = 0;
  let wrong = 0;

  const correctEl = document.createElement('span');
  correctEl.classList.add('score-correct');
  const wrongEl = document.createElement('span');
  wrongEl.classList.add('score-wrong');
  const accuracyEl = document.createElement('span');
  accuracyEl.classList.add('score-accuracy');

  function render() {
    const total = correct + wrong;
    const accuracy = total === 0 ? '—' : `${Math.round((correct / total) * 100)}%`;
    correctEl.textContent = `✅ ${correct}`;
    wrongEl.textContent = `❌ ${wrong}`;
    accuracyEl.textContent = `Accuracy: ${accuracy}`;
  }

  container.appendChild(correctEl);
  container.appendChild(wrongEl);
  container.appendChild(accuracyEl);
  render();

  return {
    recordCorrect: () => { correct += 1; render(); },
    recordWrong: () => { wrong += 1; render(); },
    reset: () => { correct = 0; wrong = 0; render(); },
    getStats: () => ({ correct, wrong, total: correct + wrong }),
  };
}