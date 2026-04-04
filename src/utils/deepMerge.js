const isObject = (item) => typeof item === 'object' && !Array.isArray(item) && item !== null

export default function deepMerge(target, source) {
  const output = { ...target }
  if (isObject(target) && isObject(source)) {
    for (const key of Object.keys(source)) {
      if (isObject(source[key])) {
        if (!(key in target)) Object.assign(output, { [key]: source[key] })
        else output[key] = deepMerge(target[key], source[key])
      } else {
        Object.assign(output, { [key]: source[key] })
      }
    }
  }
  return output
}
