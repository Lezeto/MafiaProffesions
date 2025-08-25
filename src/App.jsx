import React, { useState, useEffect, useRef } from "react";
import "./Game.css";
import athleteImg from "./deportista.png";
import lawyerImg from "./abogado.png";
import businessmanImg from "./empresario.png";
import priestImg from "./sacerdote.png";
import policeImg from "./policia.png";

export default function Game() {
  const professions = {
    Athlete: "strength",
    Lawyer: "alibi",
    Businessman: "assets",
    Priest: "information",
    Police: "patrol",
  };

  const professionImages = {
    Athlete: athleteImg,
    Lawyer: lawyerImg,
    Businessman: businessmanImg,
    Priest: priestImg,
    Police: policeImg,
  };

  const missionTypes = ["Robbery", "Murder", "Raid", "Fraud", "Smuggling"];
  const difficulties = [
    { name: "Easy", req: 0, time: 5000, success: 0.9, damage: 20, exp: 20 },
    { name: "Normal", req: 5, time: 8000, success: 0.8, damage: 30, exp: 50 },
    { name: "Hard", req: 10, time: 10000, success: 0.7, damage: 40, exp: 100 },
  ];

  const MAX_STAT = 30;
  const MAX_HP = 100;

  const [profession, setProfession] = useState(null);
  const [stats, setStats] = useState({
    strength: 0,
    alibi: 0,
    assets: 0,
    information: 0,
    patrol: 0,
  });
  const [hp, setHp] = useState(MAX_HP);
  const [level, setLevel] = useState(1);
  const [exp, setExp] = useState(0);
  const [points, setPoints] = useState(0);
  const [missions, setMissions] = useState([]);
  const [cooldown, setCooldown] = useState(0);
  const [nextMissionIn, setNextMissionIn] = useState(12);
  const [message, setMessage] = useState("");
  const [a, setA] = useState(1);

  const expToNextLevel = (lvl) => {
    if (lvl === 1) return 100;
    return Math.floor(expToNextLevel(lvl - 1) * 1.6);
  };

  const chooseProfession = (prof) => {
    let newStats = { strength: 0, alibi: 0, assets: 0, information: 0, patrol: 0 };
    newStats[professions[prof]] = 10;
    setStats(newStats);
    setProfession(prof);
    setMissions([]);
    generateMissions(5, newStats);
  };

  const generateMissions = (n, currentStats = stats) => {
    let newMissions = [];
    for (let i = 0; i < n; i++) {
      const type = missionTypes[Math.floor(Math.random() * missionTypes.length)];
      const diff = difficulties[Math.floor(Math.random() * difficulties.length)];
      const statKeys = Object.keys(currentStats);
      const reqStat = statKeys[Math.floor(Math.random() * statKeys.length)];
      newMissions.push({ id: Date.now() + Math.random(), name: `${type} ${diff.name}`, difficulty: diff, reqStat });
    }
    setMissions((prev) => [...prev, ...newMissions]);
  };

  useEffect(() => {
    if (cooldown > 0) {
      const interval = setInterval(() => {
        setCooldown((c) => Math.max(0, c - 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [cooldown]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (cooldown === 0 && hp < MAX_HP) setHp((h) => Math.min(MAX_HP, h + 5));
    }, 10000);
    return () => clearInterval(interval);
  }, [cooldown, hp]);

  const countdownInterval = useRef(null);
  const [tickCounter, setTickCounter] = useState(0);

  useEffect(() => {
    if (!profession) return;
    if (missions.length >= 5) return;
    const interval = setInterval(() => {
      setTickCounter((t) => {
        if (t >= 9) {
          setNextMissionIn((n) => {
            if (n <= 1) {
              setMissions((prev) => {
                if (prev.length < 5) generateMissions(1);
                return prev;
              });
              return 12;
            }
            return n - 1;
          });
          return 0;
        }
        return t + 1;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [missions.length]);

  const showTempMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 7000);
  };

  const acceptMission = (mission) => {
    if (cooldown > 0) return;
    if (stats[mission.reqStat] < mission.difficulty.req) {
      showTempMessage("You don’t have enough stats for this mission.");
      return;
    }
    setCooldown(mission.difficulty.time);
    setTimeout(() => {
      if (Math.random() <= mission.difficulty.success) {
        showTempMessage(`Mission ${mission.name} succeeded!`);
        setExp((currentExp) => {
          let newExp = currentExp + mission.difficulty.exp;
          let newLevel = level;
          let tempExp = newExp;
          while (tempExp >= expToNextLevel(newLevel)) {
            tempExp -= expToNextLevel(newLevel);
            newLevel += 1;
            setLevel(newLevel);
            setPoints((p) => p + 5);
          }
          return tempExp;
        });
      } else {
        showTempMessage(`Mission ${mission.name} failed!`);
        setHp((h) => Math.max(0, h - mission.difficulty.damage));
      }
      setMissions((ms) => ms.filter((m) => m.id !== mission.id));
    }, mission.difficulty.time);
  };

  const cancelMission = (missionId) => setMissions((ms) => ms.filter((m) => m.id !== missionId));
  const upgradeStat = (stat) => { if (points > 0 && stats[stat] < MAX_STAT) { setStats((s) => ({ ...s, [stat]: s[stat] + 1 })); setPoints((p) => p - 1); } };

  if (!profession) {
    return (
      <div className="game">
        <h1 className="title">Choose your profession</h1>
        <p className="description">
          Welcome to the initial version of Mafia Profession. Choose your favorite profession and level up to commit more complex crimes. 
          You can develop different skills: Strength, Alibi, Assets, Information, or Patrol. At the start, each profession has 10 points 
          in one specific skill: the Athlete in Strength, the Lawyer in Alibi, the Businessman in Assets, the Priest in Information, 
          and the Police in Patrol.<br /><br />
          Some crimes require a certain skill level, so you won’t be able to attempt all of them at first. Easy crimes can be done 
          immediately, while others require higher levels. If you can’t do a crime yet, you can leave it for later or cancel it. 
          You can have up to 5 active crimes, and if you have fewer, a new one will appear every 12 seconds.<br /><br />
          Each crime has a success chance. If you succeed, you gain experience; if you fail, you lose health. Health recovers 
          gradually, 5 points every 10 seconds. Harder crimes take longer, are riskier, and cause more health loss if you fail, 
          but they give more experience when you succeed.<br /><br />
          When leveling up, you earn 5 points to improve your skills however you like. The current goal is to reach 10 in every skill 
          so you can perform all crimes. The game ends if your health reaches 0.
        </p>
        <div className="professions">
          {Object.keys(professions).map((p) => (
            <div key={p} className="profession-choice" onClick={() => chooseProfession(p)}>
              <img src={professionImages[p]} alt={p} />
              <span>{p}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="game">
      <h1>
        <img src={professionImages[profession]} className="profession-icon" alt={profession} />
        {profession}
      </h1>

      <div className="stats">
        <div className="bar-container">
          <label>Health:</label>
          <div className="bar-background">
            <div className="bar hp-bar" style={{ width: `${(hp / MAX_HP) * 100}%` }} />
          </div>
          <span>{hp}/{MAX_HP}</span>
        </div>

        <div className="bar-container">
          <label>Exp:</label>
          <div className="bar-background">
            <div className="bar exp-bar" style={{ width: `${(exp / expToNextLevel(level)) * 100}%` }} />
          </div>
          <span>{exp}/{expToNextLevel(level)}</span>
        </div>

        <p>Level: {level}</p>
        <p>Available points: {points}</p>

        {Object.keys(stats).map((s) => (
          <div key={s} className="bar-container">
            <label>{s}:</label>
            <div className="bar-background">
              <div className="bar stat-bar" style={{ width: `${(stats[s] / MAX_STAT) * 100}%` }} />
            </div>
            <span>{stats[s]}/{MAX_STAT}</span>
            <button onClick={() => upgradeStat(s)}>+</button>
          </div>
        ))}
      </div>

      <h2>Crimes</h2>
      <div className="missions">
        {missions.map((m) => (
          <div key={m.id} className="mission">
            <p>{m.name}</p>
            <p>Requires: {m.difficulty.req} {m.reqStat}</p>
            <p>Success chance: {m.difficulty.success * 100}%</p>
            <p>Duration: {m.difficulty.time / 1000}s</p>
            <p>Exp: {m.difficulty.exp}</p>
            <button disabled={cooldown > 0} onClick={() => acceptMission(m)}>Accept</button>
            <button onClick={() => cancelMission(m.id)}>Cancel</button>
          </div>
        ))}
      </div>

      <div className="cooldown-container">
        <p className="cooldown">Cooldown: {cooldown > 0 ? `${cooldown / 1000}s` : "0s"}</p>
        {missions.length < 5 && nextMissionIn > 0 && <p className="next-mission">Next mission in: {Math.floor(nextMissionIn / 60)}m {nextMissionIn % 60}s</p>}
        {message && <p className="mission-message">{message}</p>}
      </div>
    </div>
  );
}
