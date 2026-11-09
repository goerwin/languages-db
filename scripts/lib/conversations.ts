import {
  expectArray,
  expectObject,
  expectString,
  expectUniqueIDs,
} from './json.ts';

/**
 * Validates a conversation topic file: `{ "scenes": [...] }`.
 *
 * @returns the scene IDs, so callers can check they're unique across topics
 * @throws if the file is invalid
 */
export function validateConversationFile(
  json: unknown,
  where: string,
): string[] {
  const root = expectObject(json, where, { required: ['scenes'] });

  const sceneIDs = expectArray(root.scenes, `${where} scenes`).map(
    (value, idx) => {
      const sceneWhere = `${where} scenes[${idx}]`;
      const scene = expectObject(value, sceneWhere, {
        required: ['id', 'title', 'summary', 'partner', 'turns', 'closing'],
      });

      for (const key of ['title', 'summary', 'closing'])
        expectString(scene[key], `${sceneWhere}.${key}`);

      const partner = expectObject(scene.partner, `${sceneWhere}.partner`, {
        required: ['name', 'role', 'avatar'],
      });
      for (const key of ['name', 'role', 'avatar'])
        expectString(partner[key], `${sceneWhere}.partner.${key}`);

      const turnIDs = expectArray(scene.turns, `${sceneWhere}.turns`).map(
        (turnValue, turnIdx) =>
          validateTurn(turnValue, `${sceneWhere}.turns[${turnIdx}]`),
      );
      expectUniqueIDs(turnIDs, `${sceneWhere}.turns`);

      return expectString(scene.id, `${sceneWhere}.id`);
    },
  );

  expectUniqueIDs(sceneIDs, `${where} scenes`);
  return sceneIDs;
}

function validateTurn(value: unknown, where: string): string {
  const turn = expectObject(value, where, {
    required: ['id', 'message', 'reply', 'wrongReplies', 'note'],
    optional: ['hint', 'image'],
  });

  for (const key of ['message', 'note'])
    expectString(turn[key], `${where}.${key}`);
  if (turn.hint !== undefined) expectString(turn.hint, `${where}.hint`);

  const reply = expectString(turn.reply, `${where}.reply`);
  const wrongReplies = expectArray(
    turn.wrongReplies,
    `${where}.wrongReplies`,
  ).map((wrongReply, idx) =>
    expectString(wrongReply, `${where}.wrongReplies[${idx}]`),
  );
  if (new Set([reply, ...wrongReplies]).size !== wrongReplies.length + 1)
    throw new Error(`${where}: replies must all be different`);

  if (turn.image !== undefined) {
    const image = expectObject(turn.image, `${where}.image`, {
      required: ['url', 'alt'],
    });
    const url = expectString(image.url, `${where}.image.url`);
    if (!url.startsWith('https://'))
      throw new Error(`${where}.image.url: "${url}" must use https`);
    expectString(image.alt, `${where}.image.alt`);
  }

  return expectString(turn.id, `${where}.id`);
}
