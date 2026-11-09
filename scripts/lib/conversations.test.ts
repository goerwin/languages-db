import { describe, expect, it } from 'vitest';

import { validateConversationFile } from './conversations.ts';

const turn = {
  id: 'greeting',
  message: 'Hey! Want to grab lunch?',
  hint: 'Say yes',
  reply: 'Sure, I’d love to.',
  wrongReplies: ['I am lunch.', 'Lunch is a noun.'],
  note: '“I’d love to” is a warm way to accept.',
};

const scene = {
  id: 'lunch-break',
  title: 'Lunch break',
  summary: 'A coworker invites you to lunch.',
  partner: { name: 'Maya', role: 'Coworker', avatar: '👩🏽‍💼' },
  turns: [turn],
  closing: 'See you at noon!',
};

describe('validateConversationFile', () => {
  it('returns the scene IDs', () => {
    expect(
      validateConversationFile({ scenes: [scene] }, 'food-meals.json'),
    ).toEqual(['lunch-break']);
  });

  it('accepts an image', () => {
    const withImage = {
      ...turn,
      image: { url: 'https://images.example.com/soup.jpg', alt: 'Soup' },
    };

    expect(() =>
      validateConversationFile(
        { scenes: [{ ...scene, turns: [withImage] }] },
        'food-meals.json',
      ),
    ).not.toThrow();
  });

  it('throws for a scene without turns', () => {
    expect(() =>
      validateConversationFile(
        { scenes: [{ ...scene, turns: [] }] },
        'food-meals.json',
      ),
    ).toThrow(/turns: expected a non-empty array/);
  });

  it('throws when a wrong reply matches the right one', () => {
    const repeated = { ...turn, wrongReplies: [turn.reply] };

    expect(() =>
      validateConversationFile(
        { scenes: [{ ...scene, turns: [repeated] }] },
        'food-meals.json',
      ),
    ).toThrow(/replies must all be different/);
  });

  it('throws for duplicate turn IDs', () => {
    expect(() =>
      validateConversationFile(
        { scenes: [{ ...scene, turns: [turn, turn] }] },
        'food-meals.json',
      ),
    ).toThrow(/duplicate id "greeting"/);
  });

  it('throws for an image without https', () => {
    const insecure = {
      ...turn,
      image: { url: 'http://images.example.com/soup.jpg', alt: 'Soup' },
    };

    expect(() =>
      validateConversationFile(
        { scenes: [{ ...scene, turns: [insecure] }] },
        'food-meals.json',
      ),
    ).toThrow(/must use https/);
  });

  it('throws for topic metadata in the file', () => {
    expect(() =>
      validateConversationFile(
        { title: 'Food & Meals', scenes: [scene] },
        'food-meals.json',
      ),
    ).toThrow(/unknown key "title"/);
  });
});
