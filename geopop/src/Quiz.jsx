import { useEffect, useRef, useState } from 'react';
import { Confetti, CountUp, Globie } from './bits.jsx';
import { BY_ID, flagUrl } from './geo.js';
import { KINDS } from './levels.js';
import { againQuestion } from './questions.js';
import { feedback, playFanfare, speak, stopSpeaking } from './sound.js';
import WorldMap from './WorldMap.jsx';

const PRAISE = ['Great job', 'You got it', 'Awesome', 'Way to go', 'Super explorer', 'Brilliant'];

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
        {index + 1} / {total}
      </span>
    </div>
  );
}

// The top of a question: a map with a country lit up, a map to tap, a
// flag, or a name.
function Prompt({ q, world, picked, onTapMap, homeId }) {
  const kind = KINDS[q.kind];
  if (q.prompt.kind === 'map') {
    const colorOf = (id) => {
      if (id === q.country) return picked ? (picked === q.answer ? 'map-right' : 'map-target') : 'map-target';
      if (picked && id === picked) return 'map-wrong';
      return '';
    };
    return (
      <div className="prompt-map">
        <WorldMap world={world} view={{ focus: q.country }} height={250} colorOf={colorOf} dots={[q.country]} />
      </div>
    );
  }
  if (q.prompt.kind === 'find') {
    const colorOf = (id) => {
      if (picked) {
        if (id === q.answer) return 'map-right';
        if (id === picked) return 'map-wrong';
      }
      return q.prompt.area.includes(id) ? 'map-level' : '';
    };
    return (
      <div className="prompt-map prompt-find">
        <WorldMap
          world={world}
          view={{ fit: q.prompt.area }}
          height={330}
          colorOf={colorOf}
          dots={q.prompt.area}
          onTap={(id) => !picked && onTapMap(id)}
        />
        <p className="prompt-map-hint">{picked ? (picked === q.answer ? 'Found it!' : `That’s ${BY_ID[picked]?.name}. ${BY_ID[q.answer].name} is the green one.`) : 'Tap the country on the map'}</p>
      </div>
    );
  }
  if (q.prompt.kind === 'flag') {
    return (
      <button className="prompt-card prompt-flag" style={{ '--card-from': kind.from, '--card-to': kind.to }} onClick={() => speak(q.speak)}>
        <img className="prompt-flag-img" src={flagUrl(q.prompt.flag)} alt="A flag" />
      </button>
    );
  }
  return (
    <button className="prompt-card" style={{ '--card-from': kind.from, '--card-to': kind.to }} onClick={() => speak(q.speak)}>
      <span className="prompt-speaker" aria-hidden="true">
        🔊
      </span>
      {q.prompt.flag && <img className="prompt-small-flag" src={flagUrl(q.prompt.flag)} alt="" />}
      {q.prompt.icon && <span className="prompt-icon">{q.prompt.icon}</span>}
      <span className={`prompt-big${q.prompt.text.length > 18 ? ' prompt-big-long' : ''}`}>{q.prompt.text}</span>
      <span className="prompt-hint">Tap to hear it</span>
    </button>
  );
}

function Results({ score, total, title, name, onAgain, onHome }) {
  useEffect(() => {
    playFanfare();
    const t = setTimeout(
      () => speak(score === total ? `Perfect${name ? `, ${name}` : ''}! You got all ${total}!` : `${name ? `Well done, ${name}! ` : 'Well done! '}You got ${score} out of ${total}.`),
      600,
    );
    return () => clearTimeout(t);
  }, [score, total, name]);
  const stars = score >= total ? 3 : score >= total * 0.7 ? 2 : score > 0 ? 1 : 0;
  return (
    <div className="results">
      {score > 0 && <Confetti />}
      <Globie size={120} bounce={1} />
      <h2 className="results-title">{score === total ? 'Perfect trip!' : score >= total * 0.7 ? 'Great exploring!' : 'Nice try!'}</h2>
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
      <p className="results-sub">
        +{score} ★ · {title}
      </p>
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

// One round. `build()` makes its questions; a missed one comes back three
// questions later (Anki's "Again").
export default function Quiz({ title, build, world, profile, onAnswer, onRoundDone, onHome }) {
  const [questions, setQuestions] = useState(build);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [results, setResults] = useState([]);
  const [done, setDone] = useState(false);
  const nextRef = useRef(null);

  const q = questions[index];
  const score = results.filter((r, i) => r && !questions[i]?.retry).length;
  const asked = questions.filter((x) => !x.retry).length;

  useEffect(() => {
    if (!q || done) return undefined;
    const t = setTimeout(() => speak(q.speak), 350);
    return () => clearTimeout(t);
  }, [q, done]);
  useEffect(() => () => stopSpeaking(), []);
  useEffect(() => {
    if (picked) setTimeout(() => nextRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  }, [picked]);

  function answer(id) {
    if (picked) {
      if (BY_ID[id]) speak(q.kind === 'cap' && q.style === 'name' && q.prompt.flag ? BY_ID[id].capital : BY_ID[id].name);
      return;
    }
    const correct = id === q.answer;
    setPicked(id);
    setResults((r) => {
      const next = [...r];
      next[index] = correct;
      return next;
    });
    feedback(correct);
    onAnswer(q, correct);
    if (!correct && !q.retry) {
      setQuestions((list) => {
        const at = Math.min(index + 3, list.length);
        return [...list.slice(0, at), againQuestion(q), ...list.slice(at)];
      });
    }
    const lead = correct ? `${PRAISE[Math.floor(Math.random() * PRAISE.length)]}${Math.random() < 0.5 ? `, ${profile.name}` : ''}!` : 'Not quite.';
    setTimeout(() => speak(`${lead} ${q.after.speak} ${q.after.fact}`), 450);
  }

  function next() {
    if (index + 1 >= questions.length) {
      onRoundDone(score);
      setDone(true);
      return;
    }
    setIndex(index + 1);
    setPicked(null);
  }

  function again() {
    setQuestions(build());
    setIndex(0);
    setPicked(null);
    setResults([]);
    setDone(false);
  }

  if (done) return <Results score={score} total={asked} title={title} name={profile.name} onAgain={again} onHome={onHome} />;
  if (!q) {
    return (
      <div className="results">
        <Globie size={110} />
        <h2 className="results-title">All caught up!</h2>
        <p className="results-sub">Nothing is due for review right now. Keep exploring to meet new countries.</p>
        <div className="results-actions">
          <button className="pill-btn-primary pill-btn-full" onClick={onHome}>
            Home
          </button>
        </div>
      </div>
    );
  }

  const correct = picked === q.answer;
  return (
    <div className="quiz">
      <Progress index={index} results={results} total={questions.length} />
      <div className="question-title-row">
        <span className="question-game">
          {title} · {KINDS[q.kind].title}
          {q.retry && <span className="again-badge">Again!</span>}
        </span>
        <h2 className="question-title">{q.title}</h2>
      </div>
      <Prompt key={`${index}-${q.key}`} q={q} world={world} picked={picked} onTapMap={answer} homeId={profile.home} />
      {q.choices.length > 0 && (
        <div className={`choices choices-${q.style}`}>
          {q.choices.map((c) => {
            let state = '';
            if (picked) state = c.id === q.answer ? 'choice-right' : c.id === picked ? 'choice-wrong' : 'choice-dim';
            return (
              <button key={c.id} className={`choice ${state}`} onClick={() => answer(c.id)}>
                {c.flag && <img className="choice-flag" src={flagUrl(c.flag)} alt={picked ? BY_ID[c.flag].name : 'A flag'} />}
                {c.label && <span className="choice-label">{c.label}</span>}
                {picked && c.flag && <span className="choice-caption">{BY_ID[c.flag].name}</span>}
                {state === 'choice-right' && <span className="choice-mark">✓</span>}
                {state === 'choice-wrong' && <span className="choice-mark">✗</span>}
              </button>
            );
          })}
        </div>
      )}
      {picked && (
        <div ref={nextRef} className={`feedback ${correct ? 'feedback-right' : 'feedback-wrong'}`}>
          {correct && <Confetti pieces={18} />}
          <p className="feedback-head">{correct ? '🎉 Yes!' : '💛 Not quite'}</p>
          {!correct && !q.retry && <p className="feedback-again">We’ll try this one again in a moment.</p>}
          <button className="feedback-text" onClick={() => speak(`${q.after.speak} ${q.after.fact}`)}>
            <img className="feedback-flag" src={flagUrl(q.country)} alt="" /> {q.after.text} <span aria-hidden="true">🔊</span>
          </button>
          <p className="feedback-fact">💡 {q.after.fact}</p>
          <button className="pill-btn-primary pill-btn-full" onClick={next}>
            {index + 1 >= questions.length ? 'See my stars' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  );
}
