import { motion, useMotionValue, useTransform } from "motion/react";
import { useState } from "react";
import "./Stack.css";

function Card({ img, onSendToBack, sensitivity, randomRotation }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-200, 200], [sensitivity, -sensitivity]);
  const rotateY = useTransform(x, [-200, 200], [-sensitivity, sensitivity]);

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    x.set(dx);
    y.set(dy);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      className="stack-card"
      style={{
        x,
        y,
        rotateX,
        rotateY,
        rotate: randomRotation ? Math.random() * 10 - 5 : 0,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onSendToBack}
    >
      <img src={img} alt="" />
    </motion.div>
  );
}

export default function Stack({
  cardsData,
  cardDimensions = { width: 200, height: 200 },
  sensitivity = 120,
  randomRotation = true,
  sendToBackOnClick = false,
}) {
  const [cards, setCards] = useState(cardsData);

  function handleSendToBack(id) {
    if (!sendToBackOnClick) return;
    setCards(prev => {
      const idx = prev.findIndex(c => c.id === id);
      if (idx === -1) return prev;
      const card = prev[idx];
      const rest = prev.filter(c => c.id !== id);
      return [...rest, card];
    });
  }

  return (
    <div
      className="stack-container"
      style={{
        width: cardDimensions.width,
        height: cardDimensions.height,
      }}
    >
      {cards.map(card => (
        <Card
          key={card.id}
          img={card.img}
          randomRotation={randomRotation}
          sensitivity={sensitivity}
          onSendToBack={() => handleSendToBack(card.id)}
        />
      ))}
    </div>
  );
}
