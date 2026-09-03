/**
 * keyboard.js
 * The reusable, abstract keyboard "engine". Knows nothing about scales,
 * chords or keys — it just draws a piano keyboard for a given MIDI range
 * and lets a caller highlight/mark individual notes in two visual styles:
 *   1. "highlight"  -> the whole key body gets a highlight class/color
 *   2. "marker"     -> a small circle is drawn on top of the key
 * Both can be applied to the same note at once (e.g. highlight the whole
 * chord, but circle-mark the root).
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const WHITE_PITCH_CLASSES = [0, 2, 4, 5, 7, 9, 11];
const BLACK_PITCH_CLASSES = [1, 3, 6, 8, 10];

function isWhitePitchClass(pc) {
  return WHITE_PITCH_CLASSES.includes(pc);
}

export class PianoKeyboard {
  /**
   * @param {HTMLElement} container element to render into
   * @param {object} options
   * @param {number} options.startMidi first MIDI note shown (inclusive)
   * @param {number} options.endMidi last MIDI note shown (inclusive)
   * @param {number} options.whiteKeyWidth px
   * @param {number} options.whiteKeyHeight px
   * @param {number} options.blackKeyHeight px
   */
  constructor(container, options = {}) {
    this.container = container;
    this.startMidi = options.startMidi ?? 60;
    this.endMidi = options.endMidi ?? 72;
    this.whiteKeyWidth = options.whiteKeyWidth ?? 40;
    this.whiteKeyHeight = options.whiteKeyHeight ?? 160;
    this.blackKeyHeight = options.blackKeyHeight ?? 100;

    // midi -> { rect, isWhite, centerX }
    this.keyElements = new Map();
    // midi -> SVG circle element(s) currently drawn as markers
    this.markerElements = new Map();

    this._render();
  }

  /** Rebuild the SVG for a new MIDI range (e.g. switching pages/octaves). */
  setRange(startMidi, endMidi) {
    this.startMidi = startMidi;
    this.endMidi = endMidi;
    this._render();
  }

  _render() {
    this.container.innerHTML = '';
    this.keyElements.clear();
    this.markerElements.clear();

    const whiteMidis = [];
    for (let m = this.startMidi; m <= this.endMidi; m++) {
      if (isWhitePitchClass(((m % 12) + 12) % 12)) whiteMidis.push(m);
    }

    const svgWidth = whiteMidis.length * this.whiteKeyWidth;
    const svgHeight = this.whiteKeyHeight;

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', svgWidth);
    svg.setAttribute('height', svgHeight);
    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
    svg.classList.add('piano-keyboard');

    const whiteX = new Map();
    whiteMidis.forEach((m, i) => whiteX.set(m, i * this.whiteKeyWidth));

    // White keys first (underneath).
    whiteMidis.forEach((m) => {
      const x = whiteX.get(m);
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', 0);
      rect.setAttribute('width', this.whiteKeyWidth);
      rect.setAttribute('height', this.whiteKeyHeight);
      rect.setAttribute('rx', 2);
      rect.classList.add('key', 'key-white');
      rect.dataset.midi = String(m);
      svg.appendChild(rect);
      this.keyElements.set(m, {
        rect,
        isWhite: true,
        centerX: x + this.whiteKeyWidth / 2,
      });
    });

    // Black keys on top.
    for (let m = this.startMidi; m <= this.endMidi; m++) {
      const pc = ((m % 12) + 12) % 12;
      if (!BLACK_PITCH_CLASSES.includes(pc)) continue;
      const prevWhiteX = whiteX.get(m - 1);
      if (prevWhiteX === undefined) continue; // at the very edge of the range
      const width = this.whiteKeyWidth * 0.62;
      const x = prevWhiteX + this.whiteKeyWidth - width / 2;
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', 0);
      rect.setAttribute('width', width);
      rect.setAttribute('height', this.blackKeyHeight);
      rect.setAttribute('rx', 2);
      rect.classList.add('key', 'key-black');
      rect.dataset.midi = String(m);
      svg.appendChild(rect);
      this.keyElements.set(m, {
        rect,
        isWhite: false,
        centerX: x + width / 2,
      });
    }

    this.svg = svg;
    this.container.appendChild(svg);
  }

  /** Attach a click handler; callback receives the MIDI note clicked. */
  onKeyClick(callback) {
    this.svg.addEventListener('click', (evt) => {
      const midi = evt.target?.dataset?.midi;
      if (midi !== undefined) callback(Number(midi));
    });
  }

  /** Full-key-body highlight (style 1). */
  highlightKey(midi, className = 'key-highlighted') {
    const info = this.keyElements.get(midi);
    if (info) info.rect.classList.add(className);
  }

  /** Circle-on-top marker (style 2). */
  markKey(midi, className = 'marker-default') {
    const info = this.keyElements.get(midi);
    if (!info) return;
    const cy = info.isWhite ? this.whiteKeyHeight - 22 : this.blackKeyHeight - 16;
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', info.centerX);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', 9);
    circle.classList.add('key-marker', className);
    this.svg.appendChild(circle);
    if (!this.markerElements.has(midi)) this.markerElements.set(midi, []);
    this.markerElements.get(midi).push(circle);
  }

  clearHighlights() {
    this.keyElements.forEach(({ rect }) => {
      rect.classList.remove('key-highlighted', 'key-highlighted-secondary');
    });
  }

  clearMarkers() {
    this.markerElements.forEach((circles) => circles.forEach((c) => c.remove()));
    this.markerElements.clear();
  }

  clearAll() {
    this.clearHighlights();
    this.clearMarkers();
  }

  /**
   * Convenience "set state in one call" API most pages will use.
   * @param {object} state
   * @param {number[]} state.highlighted MIDI notes to highlight (style 1)
   * @param {number[]} state.markers MIDI notes to circle-mark (style 2)
   * @param {string} [state.highlightClass]
   * @param {string} [state.markerClass]
   */
  setNotes({ highlighted = [], markers = [], highlightClass, markerClass } = {}) {
    this.clearAll();
    highlighted.forEach((m) => this.highlightKey(m, highlightClass));
    markers.forEach((m) => this.markKey(m, markerClass));
  }
}
