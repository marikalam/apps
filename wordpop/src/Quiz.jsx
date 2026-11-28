import { useEffect, useMemo, useRef, useState } from 'react';
import { Buzzy, Confetti, CountUp } from './bits.jsx';
import { MODES } from './grades.js';
import { partSay } from './content/phonics.js';
import { ROUND_LENGTH, makeRound } from './questions.js';
import { feedback, playFanfare, playPop, speak, stopSpeaking } from './sound.js';

const PRAISE = ['Great job', 'You got it', 'Awesome', 'Super reading', 'Way to go', 'Brilliant'];

function Progress({ index, results, total }) {
  return (
    <div className="progress-wrap">
      <div className="progress-dots">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`progress-dot${i === index ? ' progress-dot-now' : ''}${results[i] === true ? ' progress-dot-right' : ''}${results[i] === false ? ' progress-dot-wrong' : ''}`}
          />
        ))}
      </div>
      <span className="progress-count">
        {Math.min(index + 1, total)} / {total}
      </span>
    </div>
  );
}

// The big colored card at the top of each question. Tapping it says the
// question again; for Sound It Out, each sound is its own tile to tap.
function PromptCard({ q, color }) {
  const [lit, setLit] = useState(-1);
  if (q.prompt.kind === 'parts') {
    return (
      <div className="prompt-card prompt-parts" style={{ '--card-from': color.from, '--card-to': color.to }}>
        <div className="parts-row">
          {q.prompt.parts.map((part, i) => (
            <button
              key={i}
              className={`part-tile${lit === i ? ' part-tile-lit' : ''}${part.sound === '_' ? ' part-tile-silent' : ''}`}
              onClick={() => {
                setLit(i);
                playPop();
                const say = partSay(part);
                if (say) speak(say);
                setTimeout(() => setLit(-1), 700);
              }}
              aria-label={part.sound === '_' ? `${part.text}, silent` : `${part.text}`}
            >
              {part.text}
              {part.sound === '_' && <span className="part-silent">quiet</span>}
            </button>
          ))}
        </div>
        <div className="parts-arrow" aria-hidden="true">
          {q.prompt.parts.map((_, i) => (
            <span key={i} className="parts-ball" />
          ))}
        </div>
        <p className="prompt-hint">{q.prompt.small}</p>
      </div>
    );
  }
  const big = q.prompt.big;
  const isText = q.prompt.kind === 'text';
  const blankParts = isText && big.includes('___') ? big.split('___') : null;
  return (
    <button
      className={`prompt-card prompt-${q.prompt.kind}`}
      style={{ '--card-from': color.from, '--card-to': color.to }}
      onClick={() => speak(q.replay || q.speak)}
    >
      <span className="prompt-speaker" aria-hidden="true">
        🔊
      </span>
      <span className={`prompt-big${big.length > 40 ? ' prompt-big-long' : ''}`}>
        {blankParts ? (
          <>
            {blankParts[0]}
            <span className="blank-line">_____</span>
            {blankParts[1]}
          </>
        ) : (
          big
        )}
      </span>
      {q.prompt.kind === 'pic' && <span className="prompt-word">{q.prompt.small}</span>}
      <span className="prompt-hint">{q.prompt.kind === 'pic' ? 'Tap to hear it' : q.prompt.small}</span>
    </button>
  );
}

function Choice({ c, style, state, onPick }) {
  return (
    <button className={`choice choice-${style} ${state ? `choice-${state}` : ''}`} onClick={() => onPick(c)}>
      {c.pic && <span className="choice-pic">{c.pic}</span>}
      {c.label && <span className="choice-label">{c.label}</span>}
      {state === 'right' && <span className="choice-mark">✓</span>}
      {state === 'wrong' && <span className="choice-mark">✗</span>}
    </button>
  );
}

function Results({ score, total, mode, name, onAgain, onHome }) {
  useEffect(() => {
    playFanfare();
    const t = setTimeout(
      () =>
        speak(
          score === total
            ? `Perfect${name ? `, ${name}` : ''}! You got all ${total}!`
            : `${name ? `Well done, ${name}! ` : 'Well done! '}You got ${score} out of ${total}.`,
        ),
      600,
    );
    return () => clearTimeout(t);
  }, [score, total, name]);
  const stars = score >= total ? 3 : score >= total * 0.7 ? 2 : score > 0 ? 1 : 0;
  return (
    <div className="results">
      {score > 0 && <Confetti />}
      <Buzzy size={120} bounce={1} />
      <h2 className="results-title">{score === total ? 'Perfect round!' : score >= total * 0.7 ? 'Great reading!' : 'Nice try!'}</h2>
      <div className="results-stars" aria-label={`${stars} of 3 stars`}>
        {[0, 1, 2].map((i) => (
          <span key={i} className={`results-star${i < stars ? ' results-star-on' : ''}`} style={{ animationDelay: `${0.3 + i * 0.25}s` }}>
            ★
          </span>
        ))}
      </div>
      <p className="results-score">
        <CountUp to={score} /> <span>/ {total} right</span>
      </p>
      <p className="results-sub">+{score} ★ for {mode === 'mix' ? 'Random Mix' : MODES[mode].title}</p>
      <div className="results-actions">
        <button className="pill-btn-primary pill-btn-full" onClick={onAgain}>
          Play again
        </button>
        <button className="pill-btn-secondary pill-btn-full" onClick={onHome}>
          Home
        </button>
      </div>
    </div>
  );
}

// One round of ten questions.
export default function Quiz({ mode, profile, onAnswer, onRoundDone, onHome }) {
  const [roundId, setRoundId] = useState(0);
  // Questions are made once per round (missed words from earlier rounds
  // are more likely to be picked).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const questions = useMemo(() => makeRound(mode, profile.grade, profile.progress.items), [mode, profile.grade, roundId]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [results, setResults] = useState([]);
  const [done, setDone] = useState(false);
  const nextRef = useRef(null);

  const q = questions[index];
  const total = questions.length;
  const color = mode === 'mix' ? MODES[q?.mode] || MODES.meaning : MODES[mode];

  useEffect(() => {
    if (!q || done) return undefined;
    const t = setTimeout(() => speak(q.speak), 350);
    return () => clearTimeout(t);
  }, [q, done]);

  useEffect(() => () => stopSpeaking(), []);

  useEffect(() => {
    if (picked) nextRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [picked]);

  function pick(c) {
    if (picked) {
      // After answering, tapping a choice just says it.
      if (c.speak) speak(c.speak);
      return;
    }
    const correct = c.id === q.answer;
    setPicked(c.id);
    setResults((r) => {
      const next = [...r];
      next[index] = correct;
      return next;
    });
    feedback(correct);
    onAnswer(q, correct);
    const lead = correct ? `${PRAISE[Math.floor(Math.random() * PRAISE.length)]}${Math.random() < 0.5 ? `, ${profile.name}` : ''}!` : 'Not quite.';
    setTimeout(() => speak(`${lead} ${q.after.speak}`), 450);
  }

  function next() {
    if (index + 1 >= total) {
      const score = results.filter(Boolean).length;
      onRoundDone(mode, score);
      setDone(true);
      return;
    }
    setIndex(index + 1);
    setPicked(null);
  }

  function again() {
    setRoundId((n) => n + 1);
    setIndex(0);
    setPicked(null);
    setResults([]);
    setDone(false);
  }

  if (done) {
    return <Results score={results.filter(Boolean).length} total={total} mode={mode} name={profile.name} onAgain={again} onHome={onHome} />;
  }
  if (!q) return null;

  const correct = picked === q.answer;
  const title = mode === 'mix' ? MODES[q.mode].title : MODES[mode].title;

  return (
    <div className="quiz">
      <Progress index={index} results={results} total={total || ROUND_LENGTH} />
      <div className="question-title-row">
        <span className="question-game">{title}</span>
        <h2 className="question-title">{q.title}</h2>
      </div>
      <PromptCard key={`${roundId}-${index}`} q={q} color={color} />
      <div className={`choices choices-${q.style}`}>
        {q.choices.map((c) => {
          let state = null;
          if (picked) {
            if (c.id === q.answer) state = 'right';
            else if (c.id === picked) state = 'wrong';
            else state = 'dim';
          }
          return <Choice key={c.id} c={c} style={q.style} state={state} onPick={pick} />;
        })}
      </div>
      {picked && (
        <div ref={nextRef} className={`feedback ${correct ? 'feedback-right' : 'feedback-wrong'}`}>
          {correct && <Confetti pieces={18} />}
          <p className="feedback-head">{correct ? '🎉 Yes!' : '💛 Not quite'}</p>
          <button className="feedback-text" onClick={() => speak(q.after.speak)}>
            {q.after.text} <span aria-hidden="true">🔊</span>
          </button>
          <button className="pill-btn-primary pill-btn-full" onClick={next}>
            {index + 1 >= total ? 'See my stars' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  );
}
