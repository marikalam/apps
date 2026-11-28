import { useState } from 'react';
import { SOUNDS, soundLabel } from './content/phonics.js';
import { PICTURE_VOCAB, VOCAB } from './content/vocab.js';
import { gradeInfo } from './grades.js';
import { cardStatus, dueLabel } from './srs.js';
import { playPop, speak } from './sound.js';

// Explore Letters: every sound, in the order the book teaches them. Tap
// one to see it big and hear it, with its key word.
export function ExploreLetters() {
  const [current, setCurrent] = useState(SOUNDS[0]);
  function tap(s) {
    setCurrent(s);
    playPop();
    speak(`${s.say}. ${s.say}, like ${s.key}.`);
  }
  return (
    <div className="explore">
      <h2 className="explore-title">Explore Letters</h2>
      <p className="explore-sub">Letters have sounds! Tap one to hear what it says.</p>
      <button className="letter-hero" onClick={() => tap(current)}>
        <span className="letter-hero-letter">{soundLabel(current)}</span>
        <span className="letter-hero-pic">{current.pic}</span>
        <span className="letter-hero-key">
          says “{current.say}” like <strong>{current.key}</strong> 🔊
        </span>
        {current.kind === 'hold' ? (
          <span className="letter-hero-tip">Hold this sound: {current.say[0].repeat(4)}{current.say}…</span>
        ) : (
          <span className="letter-hero-tip">Say this one quick! No “uh” at the end.</span>
        )}
      </button>
      <div className="letter-grid">
        {SOUNDS.map((s) => (
          <button key={s.id} className={`letter-cell${s.vowel ? ' letter-cell-vowel' : ''}${s.id === current.id ? ' letter-cell-on' : ''}`} onClick={() => tap(s)}>
            {soundLabel(s)}
          </button>
        ))}
      </div>
      <p className="explore-note">
        Pink letters are vowels. A line on top (ā, ē, ī, ō) means the letter says its name.
      </p>
    </div>
  );
}

const STATUS_LABEL = { new: 'New', learning: 'Learning', learned: '★ Learned', mastered: '★★ Mastered' };

// The Word Bank: the grade's vocabulary words with what they mean, a
// sentence, and where each one is in its spaced repetition: new,
// learning, learned, or mastered (comes back three weeks or more apart).
export function WordBank({ profile }) {
  const g = gradeInfo(profile.grade).id;
  const level = { p: 0, k: 0, 1: 1, 2: 2, 3: 3, 4: 4 }[g];
  const [open, setOpen] = useState(null);
  const words = level ? VOCAB[level] : PICTURE_VOCAB.map((v) => ({ ...v, s: null }));
  const cardFor = (v) => profile.progress.items[`word:${v.w}`] || profile.progress.items[`big:${v.w}`];
  const statusOf = (v) => cardStatus(cardFor(v));
  const learned = words.filter((v) => ['learned', 'mastered'].includes(statusOf(v))).length;
  const mastered = words.filter((v) => statusOf(v) === 'mastered').length;
  return (
    <div className="explore">
      <h2 className="explore-title">Word Bank</h2>
      <p className="explore-sub">
        {gradeInfo(g).label} words · <strong>{learned}</strong> of {words.length} learned · <strong>{mastered}</strong> mastered
      </p>
      <div className="bank-list">
        {words.map((v) => {
          const status = statusOf(v);
          const isOpen = open === v.w;
          return (
            <button
              key={v.w}
              className={`bank-item${isOpen ? ' bank-item-open' : ''}`}
              onClick={() => {
                setOpen(isOpen ? null : v.w);
                const sentence = v.s ? v.s.replace('___', v.w) : '';
                speak(`${v.w}. ${v.w} means ${v.def}. ${sentence}`);
              }}
            >
              <span className="bank-word">
                {v.pic && <span className="bank-pic">{v.pic}</span>}
                {v.w}
                <span className={`bank-status bank-status-${status}`}>{STATUS_LABEL[status]}</span>
              </span>
              <span className="bank-def">{v.def}</span>
              {isOpen && status !== 'new' && <span className="bank-due">Next review: {dueLabel(cardFor(v))}</span>}
              {isOpen && v.s && <span className="bank-sentence">“{v.s.replace('___', v.w)}”</span>}
              {isOpen && v.syn && (
                <span className="bank-extra">
                  Same: <strong>{v.syn}</strong>
                  {v.ant && (
                    <>
                      {' '}· Opposite: <strong>{v.ant}</strong>
                    </>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
