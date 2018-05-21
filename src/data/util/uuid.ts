const uuidSet = new Set<string>();

function generateId(): string {
  return (Math.random() * Math.pow(2, 32 - 1) >>> 0) + '';
}

//TODO: use when importing a project
function offerUniqueId(id: string) {
  if (uuidSet.has(id)) {
    id = generateUniqueId();
  }
  return id;
}

export function generateUniqueId(): string {
  let id: string = generateId();

  while (uuidSet.has(id)) {
    id = generateId();
  }

  uuidSet.add(id);

  return id;
}
