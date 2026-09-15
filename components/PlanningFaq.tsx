import React from 'react';

export interface FaqItem { question: string; answer: React.ReactNode; }
export function PlanningFaq({ title, intro, items, id = 'pytania' }: { title: string; intro?: string; items: FaqItem[]; id?: string }) {
  return <section id={id} className="planning-faq scroll-mt-40" aria-labelledby={`${id}-title`}>
    <div className="planning-faq-heading"><p className="leave-eyebrow">DOBRZE WIEDZIEĆ PRZED WOLNYM</p><h2 id={`${id}-title`}>{title}</h2>{intro && <p>{intro}</p>}</div>
    <div className="planning-faq-list">{items.map((item, index) => <details key={item.question}><summary><span className="planning-faq-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span>{item.question}</span><span className="planning-faq-plus" aria-hidden="true">+</span></summary><div className="planning-faq-answer">{item.answer}</div></details>)}</div>
  </section>;
}
