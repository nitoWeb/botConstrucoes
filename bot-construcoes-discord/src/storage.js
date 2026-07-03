import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.resolve(currentDirectory, '../data');
const databasePath = path.join(dataDirectory, 'construcoes.json');
const temporaryPath = path.join(dataDirectory, 'construcoes.tmp.json');

let writeQueue = Promise.resolve();

async function ensureDatabase() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(databasePath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    await writeFile(databasePath, '[]\n', 'utf8');
  }
}

export async function readConstructions() {
  await ensureDatabase();

  const content = await readFile(databasePath, 'utf8');

  try {
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [];
  } catch {
    throw new Error(
      'O arquivo data/construcoes.json está inválido. Corrija o JSON ou substitua seu conteúdo por [].',
    );
  }
}

export function updateConstructions(updater) {
  const operation = async () => {
    const current = await readConstructions();
    const result = await updater(current);

    if (!result || !Array.isArray(result.data)) {
      throw new Error('A atualização do armazenamento retornou um resultado inválido.');
    }

    await writeFile(
      temporaryPath,
      `${JSON.stringify(result.data, null, 2)}\n`,
      'utf8',
    );
    await rename(temporaryPath, databasePath);

    return result.value;
  };

  writeQueue = writeQueue.then(operation, operation);
  return writeQueue;
}
